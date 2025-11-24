import { useEffect, useMemo, useRef, useState } from 'react'
import {
  cancelMatchQueue,
  getMatchSessionId,
  joinMatchQueue,
  leaveRoom,
  listenMatchTicket,
  listenRoom,
  listenRoomMessages,
  resetMatchState,
  sendRoomMessage
} from '../utils/matchService'

function AnonymousMatchPage({ toast, onBack }) {
  const [sessionId, setSessionId] = useState('')
  const [ticket, setTicket] = useState({ status: 'idle', roomId: null })
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const matchSoundPlayedRef = useRef(false)
  const audioRef = useRef(null)

  const isWaiting = ticket.status === 'waiting' && !ticket.roomId
  const isMatched = ticket.status === 'matched' && !!ticket.roomId
  const partnerLeft = !!room && room.active === false
  const canChat = isMatched && !partnerLeft

  useEffect(() => {
    audioRef.current = new Audio('/notification.wav')
    audioRef.current.volume = 0.6
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const id = getMatchSessionId()
    setSessionId(id)
    const unsubscribe = listenMatchTicket(id, (data) => {
      setTicket({
        status: data?.status || 'idle',
        roomId: data?.roomId || null
      })
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!ticket.roomId) {
      setRoom(null)
      setMessages([])
      return
    }
    const stopRoom = listenRoom(ticket.roomId, setRoom)
    const stopMessages = listenRoomMessages(ticket.roomId, setMessages)
    return () => {
      stopRoom()
      stopMessages()
    }
  }, [ticket.roomId])

  useEffect(() => {
    if (isMatched && !partnerLeft && !matchSoundPlayedRef.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((error) => {
          console.warn('播放配對提示音失敗', error)
        })
      }
      matchSoundPlayedRef.current = true
    }
    if (!isMatched) {
      matchSoundPlayedRef.current = false
    }
  }, [isMatched, partnerLeft])

  const stateTitle = useMemo(() => {
    if (isMatched) {
      return '配對成功，開始聊天'
    }
    if (isWaiting) {
      return '正在尋找聊天夥伴'
    }
    return '匿名配對聊天'
  }, [isMatched, isWaiting])

  const handleStart = async () => {
    if (!sessionId) {
      return
    }
    setIsJoining(true)
    try {
      const result = await joinMatchQueue(sessionId)
      if (result.status === 'waiting') {
        toast.info('已加入配對隊列')
      } else if (result.status === 'matched') {
        toast.success('配對成功')
      }
    } catch (error) {
      toast.error('配對失敗，請稍後再試')
    } finally {
      setIsJoining(false)
    }
  }

  const handleCancel = async () => {
    if (!sessionId) {
      return
    }
    setIsJoining(true)
    try {
      await cancelMatchQueue(sessionId)
      setTicket({ status: 'idle', roomId: null })
      toast.info('已取消排隊')
    } catch (error) {
      toast.error('取消失敗，請稍後再試')
    } finally {
      setIsJoining(false)
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    const message = input.trim()
    if (!message || !ticket.roomId || partnerLeft) {
      return
    }
    const hasLink = /(https?:\/\/|www\.)/i.test(message)
    if (hasLink) {
      toast.warning('聊天室禁止貼上連結')
      return
    }
    setIsSending(true)
    try {
      await sendRoomMessage(ticket.roomId, sessionId, message)
      setInput('')
    } catch (error) {
      toast.error('訊息傳送失敗')
    } finally {
      setIsSending(false)
    }
  }

  const handleLeave = async () => {
    if (!ticket.roomId) {
      return
    }
    setIsLeaving(true)
    try {
      await leaveRoom(ticket.roomId, sessionId)
      await resetMatchState(sessionId)
      setTicket({ status: 'idle', roomId: null })
      toast.info('聊天室已關閉')
    } catch (error) {
      toast.error('離開失敗，請稍後再試')
    } finally {
      setIsLeaving(false)
    }
  }

  const renderMessages = () => {
    if (!messages.length) {
      return (
        <div className="chat-empty">
          <span className="material-icons">chat</span>
          <p>聊聊今天的心情吧</p>
        </div>
      )
    }
    return messages.map((msg) => {
      const isMine = msg.sender === sessionId
      return (
        <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : 'partner'}`}>
          <span>{msg.content}</span>
        </div>
      )
    })
  }

  return (
    <section className="match-page">
      <div className="match-header">
        <div className="match-title">
          <span className="material-icons">forum</span>
          <div>
            <h2>{stateTitle}</h2>
            <p>一次只配對一組，離開後可重新排隊</p>
          </div>
        </div>
      </div>

      <div className="match-content">
        <div className="match-panel queue">
          <div className="panel-heading">
            <span className="material-icons">shuffle</span>
            配對狀態
          </div>
          <div className="panel-body">
            {isMatched ? (
              <div className="status-card success">
                <span className="material-icons">handshake</span>
                <div>
                  <p>配對完成</p>
                  <small>保持尊重，享受匿名聊天</small>
                </div>
              </div>
            ) : isWaiting ? (
              <div className="status-card waiting">
                <span className="material-icons">hourglass_top</span>
                <div>
                  <p>正在尋找聊伴</p>
                  <small>停留此頁即可自動配對</small>
                </div>
              </div>
            ) : (
              <div className="status-card idle">
                <span className="material-icons">person_search</span>
                <div>
                  <p>尚未開始配對</p>
                  <small>按下開始後系統會自動連線</small>
                </div>
              </div>
            )}
            {partnerLeft && (
              <div className="match-alert">
                <span className="material-icons">info</span>
                <p>對方已離線，請結束或重新配對</p>
              </div>
            )}
          </div>
          <div className="panel-actions">
            {!isMatched && !isWaiting && (
              <button
                className="cta-primary"
                disabled={isJoining}
                onClick={handleStart}
              >
                <span className="material-icons">play_arrow</span>
                開始配對
              </button>
            )}
            {isWaiting && (
              <button
                className="cta-secondary"
                disabled={isJoining}
                onClick={handleCancel}
              >
                <span className="material-icons">close</span>
                取消排隊
              </button>
            )}
            {isMatched && (
              <button
                className="cta-secondary"
                disabled={isLeaving}
                onClick={handleLeave}
              >
                <span className="material-icons">logout</span>
                離開聊天室
              </button>
            )}
          </div>
        </div>

        <div className="match-panel chat">
          <div className="panel-heading">
            <span className="material-icons">chat_bubble</span>
            匿名對話
          </div>
          <div className="chat-body">
            {isMatched ? renderMessages() : (
              <div className="chat-empty">
                <span className="material-icons">lock</span>
                <p>配對成功後才會開啟聊天室</p>
              </div>
            )}
          </div>
          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder={
                canChat ? '輸入訊息...' : partnerLeft ? '對方已離開' : '等待配對中'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!canChat || isSending}
            />
            <button type="submit" disabled={!canChat || !input.trim() || isSending}>
              <span className="material-icons">send</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default AnonymousMatchPage

