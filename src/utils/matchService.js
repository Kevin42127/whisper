import { db } from '../config/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'

const MATCH_STATE = 'matchState'
const QUEUE_DOC = 'queue'
const TICKETS = 'matchTickets'
const ROOMS = 'chatRooms'
const SESSION_KEY = 'whisperMatchSession'

const queueRef = doc(db, MATCH_STATE, QUEUE_DOC)

export function getMatchSessionId() {
  if (typeof window === 'undefined') {
    return ''
  }
  const existing = window.localStorage.getItem(SESSION_KEY)
  if (existing) {
    return existing
  }
  const hasGenerator = window.crypto && typeof window.crypto.randomUUID === 'function'
  const nextId = hasGenerator
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  window.localStorage.setItem(SESSION_KEY, nextId)
  return nextId
}

export async function joinMatchQueue(sessionId, profile = {}) {
  if (!sessionId) {
    throw new Error('missing session id')
  }
  const ticketRef = doc(db, TICKETS, sessionId)
  const response = await runTransaction(db, async (transaction) => {
    const queueSnap = await transaction.get(queueRef)
    const waitingSession = queueSnap.exists() ? queueSnap.data().waitingSession : null
    if (!waitingSession || waitingSession === sessionId) {
      transaction.set(queueRef, {
        waitingSession: sessionId,
        updatedAt: serverTimestamp()
      })
      transaction.set(
        ticketRef,
        {
          status: 'waiting',
          roomId: null,
          profile,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
      return { status: 'waiting' }
    }
    const partnerTicketRef = doc(db, TICKETS, waitingSession)
    const roomRef = doc(collection(db, ROOMS))
    transaction.set(roomRef, {
      participants: [waitingSession, sessionId],
      createdAt: serverTimestamp(),
      active: true,
      lastMessageAt: null,
      closedAt: null,
      closedBy: null
    })
    transaction.set(
      ticketRef,
      {
        status: 'matched',
        roomId: roomRef.id,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
    transaction.set(
      partnerTicketRef,
      {
        status: 'matched',
        roomId: roomRef.id,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
    transaction.set(queueRef, {
      waitingSession: null,
      updatedAt: serverTimestamp()
    })
    return { status: 'matched', roomId: roomRef.id }
  })
  return response
}

export async function cancelMatchQueue(sessionId) {
  if (!sessionId) {
    return
  }
  const ticketRef = doc(db, TICKETS, sessionId)
  await runTransaction(db, async (transaction) => {
    const queueSnap = await transaction.get(queueRef)
    const waitingSession = queueSnap.exists() ? queueSnap.data().waitingSession : null
    if (waitingSession === sessionId) {
      transaction.set(queueRef, {
        waitingSession: null,
        updatedAt: serverTimestamp()
      })
    }
    transaction.delete(ticketRef)
  })
}

export function listenMatchTicket(sessionId, handler) {
  if (!sessionId) {
    return () => {}
  }
  const ticketRef = doc(db, TICKETS, sessionId)
  return onSnapshot(ticketRef, (snapshot) => {
    if (!snapshot.exists()) {
      handler({ status: 'idle', roomId: null })
      return
    }
    handler(snapshot.data())
  })
}

export function listenRoom(roomId, handler) {
  if (!roomId) {
    return () => {}
  }
  const roomRef = doc(db, ROOMS, roomId)
  return onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      handler(null)
      return
    }
    handler({ id: snapshot.id, ...snapshot.data() })
  })
}

export function listenRoomMessages(roomId, handler) {
  if (!roomId) {
    return () => {}
  }
  const messagesRef = collection(db, ROOMS, roomId, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }))
    handler(items)
  })
}

export async function sendRoomMessage(roomId, sessionId, content) {
  if (!roomId || !sessionId || !content.trim()) {
    return
  }
  const messagesRef = collection(db, ROOMS, roomId, 'messages')
  await addDoc(messagesRef, {
    content: content.trim(),
    sender: sessionId,
    createdAt: serverTimestamp()
  })
  await updateDoc(doc(db, ROOMS, roomId), {
    lastMessageAt: serverTimestamp()
  })
}

export async function leaveRoom(roomId, sessionId) {
  if (!roomId || !sessionId) {
    return
  }
  const ticketRef = doc(db, TICKETS, sessionId)
  await updateDoc(doc(db, ROOMS, roomId), {
    active: false,
    closedAt: serverTimestamp(),
    closedBy: sessionId
  }).catch(() => {})
  await deleteDoc(ticketRef).catch(() => {})
}

export async function resetMatchState(sessionId) {
  if (!sessionId) {
    return
  }
  const ticketRef = doc(db, TICKETS, sessionId)
  await deleteDoc(ticketRef).catch(() => {})
}

