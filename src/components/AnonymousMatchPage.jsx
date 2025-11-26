import { useEffect, useMemo, useRef, useState } from 'react'
import {
  cancelMatchQueue,
  getMatchSessionId,
  joinMatchQueue,
  leaveRoom,
  listenMatchTicket,
  listenRoom,
  listenRoomMessages,
  listenTypingStatus,
  resetMatchState,
  sendRoomMessage,
  setTypingStatus
} from '../utils/matchService'
import 'emoji-picker-element'

function AnonymousMatchPage({ toast }) {
  const inputRef = useRef(null)
  const [sessionId, setSessionId] = useState('')
  const [ticket, setTicket] = useState({ status: 'idle', roomId: null })
  const [queueInfo, setQueueInfo] = useState({ waitingSession: null, updatedAt: null })
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const emojiPickerRef = useRef(null)
  const matchSoundPlayedRef = useRef(false)
  const audioRef = useRef(null)
  const lastSeenMessageTimeRef = useRef(null)
  const originalTitleRef = useRef(null)
  const isPageVisibleRef = useRef(true)

  const isWaiting = ticket.status === 'waiting' && !ticket.roomId
  const isMatched = ticket.status === 'matched' && !!ticket.roomId
  const partnerLeft = !!room && room.active === false
  const canChat = isMatched && !partnerLeft

  useEffect(() => {
    if (!canChat) {
      setIsTyping(false)
      setTypingStatus(ticket.roomId, sessionId, false).catch(() => {})
    }
  }, [canChat, ticket.roomId, sessionId])

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
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title
    }
    return () => {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current
      }
    }
  }, [])

  useEffect(() => {
    const id = getMatchSessionId()
    setSessionId(id)
    const unsubscribe = listenMatchTicket(id, (data, queueData) => {
      setTicket({
        status: data?.status || 'idle',
        roomId: data?.roomId || null
      })
      setQueueInfo(queueData)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!ticket.roomId) {
      setRoom(null)
      setMessages([])
      setPartnerTyping(false)
      lastSeenMessageTimeRef.current = null
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current
      }
      return
    }
    const stopRoom = listenRoom(ticket.roomId, setRoom)
    const stopMessages = listenRoomMessages(ticket.roomId, setMessages)
    const stopTyping = listenTypingStatus(ticket.roomId, (typingUsers) => {
      const othersTyping = Object.entries(typingUsers || {}).some(
        ([id, typing]) => id !== sessionId && typing
      )
      setPartnerTyping(othersTyping)
    })
    return () => {
      stopRoom()
      stopMessages()
      stopTyping()
    }
  }, [ticket.roomId, sessionId])

  useEffect(() => {
    if (!showEmoji || !emojiPickerRef.current) return
    const picker = emojiPickerRef.current.querySelector('emoji-picker')
    if (!picker) return

    const handleEmoji = (event) => {
      if (!inputRef.current) return
      const emoji = event.detail.unicode || event.detail.emoji?.unicode || ''
      const start = inputRef.current.selectionStart
      const end = inputRef.current.selectionEnd
      const nextValue = input.slice(0, start) + emoji + input.slice(end)
      setInput(nextValue)
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const cursor = start + emoji.length
          inputRef.current.selectionStart = cursor
          inputRef.current.selectionEnd = cursor
          inputRef.current.focus()
        }
      })
      const typing = canChat && nextValue.trim().length > 0
      setIsTyping(typing)
      setTypingStatus(ticket.roomId, sessionId, typing).catch(() => {})
    }

    picker.addEventListener('emoji-click', handleEmoji)
    return () => picker.removeEventListener('emoji-click', handleEmoji)
  }, [showEmoji, input, canChat, sessionId, ticket.roomId])

useEffect(() => {
  if (isMatched && !partnerLeft && !matchSoundPlayedRef.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((error) => {
          console.warn('播放配對提示音失敗', error)
        })
      }
      toast.success('配對成功！主動打招呼可以讓聊天更順利')
      matchSoundPlayedRef.current = true
    }
    if (!isMatched) {
      matchSoundPlayedRef.current = false
    }
  }, [isMatched, partnerLeft, toast])

useEffect(() => {
  if (!originalTitleRef.current) {
      originalTitleRef.current = document.title
    }

    const updateTitle = () => {
      if (!isMatched || partnerLeft || !sessionId || messages.length === 0) {
        document.title = originalTitleRef.current || 'Whisper'
        return
      }

      const partnerMessages = messages.filter(msg => msg.sender !== sessionId)
      if (partnerMessages.length === 0) {
        document.title = originalTitleRef.current || 'Whisper'
        return
      }

      const lastMessage = partnerMessages[partnerMessages.length - 1]
      const lastMessageTime = lastMessage?.createdAt?.toMillis()

      if (isPageVisibleRef.current) {
        if (lastMessageTime) {
          lastSeenMessageTimeRef.current = lastMessageTime
        }
        document.title = originalTitleRef.current || 'Whisper'
      } else {
        let unreadCount = 0
        if (lastSeenMessageTimeRef.current && lastMessageTime) {
          unreadCount = partnerMessages.filter(msg => {
            const msgTime = msg.createdAt?.toMillis()
            return msgTime && msgTime > lastSeenMessageTimeRef.current
          }).length
        } else if (lastMessageTime) {
          unreadCount = partnerMessages.length
          lastSeenMessageTimeRef.current = lastMessageTime
        }

        if (unreadCount > 0) {
          document.title = `(${unreadCount}) ${originalTitleRef.current || 'Whisper'}`
        } else {
          document.title = originalTitleRef.current || 'Whisper'
        }
      }
    }

    updateTitle()

    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
      updateTitle()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.title = originalTitleRef.current || 'Whisper'
    }
  }, [messages, isMatched, partnerLeft, sessionId])

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
    const scamKeywords = [
      'line.me', 'line id', 'line id:', 'line：', 'line:', '加line', '加 line',
      'telegram', 'tg', 'tg:', 'tg：',
      '加我', '私訊', '私聊', '私我', '密我', 'pm我',
      '投資', '賺錢', '獲利', '高報酬', '穩賺',
      '兼職', '在家工作', '輕鬆賺',
      '貸款', '借貸', '信用',
      '點擊', '點我', '點這裡'
    ]
    const hasScamKeyword = scamKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    )
    if (hasScamKeyword) {
      toast.warning('內容包含不允許的關鍵字')
      return
    }
    setIsSending(true)
    try {
      await sendRoomMessage(ticket.roomId, sessionId, message)
      setInput('')
      setIsTyping(false)
      setTypingStatus(ticket.roomId, sessionId, false).catch(() => {})
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

  const [viewportWidth, setViewportWidth] = useState(window.innerWidth)
  const isMobile = viewportWidth <= 640

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const renderMessages = () => {
    if (!messages.length) {
      return (
        <>
          <div className="chat-welcome">
            <span className="material-icons">celebration</span>
            <div>
              <p>配對成功！</p>
              <small>主動打招呼可以讓聊天更順利。</small>
            </div>
          </div>
          <div className="chat-empty">
            <span className="material-icons">chat</span>
            <p>聊聊今天的心情吧</p>
          </div>
        </>
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

  const showMobileChatOnly = isMatched && isMobile

  return (
    <section className={`match-page ${showMobileChatOnly ? 'focus-chat' : ''}`}>
      <div className="match-header color-splash tone-saffron">
        <div className="match-title">
          <span className="material-icons">forum</span>
          <div>
            <h2>{stateTitle}</h2>
            <p>一次只配對一組，離開後可重新排隊</p>
          </div>
        </div>
      </div>

      <div className={`match-content ${isMatched ? 'match-state-matched' : ''} ${showMobileChatOnly ? 'mobile-chat-only' : ''}`}>
        {!showMobileChatOnly && (
        <div className="match-panel queue color-splash tone-lagoon">
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
            <div className="queue-info">
              <div className="queue-info-item">
                <span className="material-icons">stacked_line_chart</span>
                <div>
                  <p>配對小提醒</p>
                  <small>若看到「正在尋找聊伴」，代表系統已在匹配下一位使用者。</small>
                </div>
              </div>
              <div className="queue-info-item">
                <span className="material-icons">schedule</span>
                <div>
                  <p>耐心等待</p>
                  <small>一般等待約 1 分鐘內，實際時間依目前活躍度而定。</small>
                </div>
              </div>
            </div>
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
        )}

        <div className={`match-panel chat color-splash tone-indigo ${showMobileChatOnly ? 'full-width' : ''}`}>
          {showMobileChatOnly && (
            <div className="mobile-chat-controls">
              <button
                type="button"
                className="mobile-exit-button"
                disabled={isLeaving}
                onClick={handleLeave}
              >
                <span className="material-icons">arrow_back</span>
                <span>離開</span>
              </button>
            </div>
          )}
          <div className="panel-heading">
            <span className="material-icons">chat_bubble</span>
            匿名對話
          </div>
          {partnerLeft && (
            <div className="chat-alert">
              <span className="material-icons">report</span>
              <div>
                <p>對方已離線</p>
                <small>請離開或重新配對以開始新的聊天</small>
              </div>
            </div>
          )}
          <div className="chat-body">
            {isMatched ? renderMessages() : (
              <div className="chat-empty">
                <span className="material-icons">lock</span>
                <p>配對成功後才會開啟聊天室</p>
              </div>
            )}
          </div>
          {isMatched && !partnerLeft && partnerTyping && (
            <div className="typing-banner">
              <div className="typing-content">
                <span className="typing-label">匿名夥伴</span>
                <span className="typing-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
              </div>
            </div>
          )}
          <form 
            className={`chat-input ${partnerLeft ? 'disabled' : ''}`} 
            onSubmit={handleSendMessage}
          >
            <textarea
              ref={inputRef}
              rows={1}
              placeholder={
                canChat ? '輸入訊息...' : partnerLeft ? '對方已離開' : '等待配對中'
              }
              value={input}
              onChange={(e) => {
                const value = e.target.value
                setInput(value)
                const typing = canChat && value.trim().length > 0
                setIsTyping(typing)
                setTypingStatus(ticket.roomId, sessionId, typing).catch(() => {})
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSendMessage(e)
                }
              }}
              disabled={!canChat || isSending}
            />
            <div className="chat-actions">
              <div className="emoji-wrapper">
                <button
                  type="button"
                  className="emoji-button"
                  onClick={() => setShowEmoji((prev) => !prev)}
                  disabled={!canChat || isSending}
                  aria-label="插入表情"
                >
                  <span className="material-icons">sentiment_satisfied_alt</span>
                </button>
                {showEmoji && (
                  <>
                    <div className="emoji-overlay" onClick={() => setShowEmoji(false)} />
                    <div className="emoji-picker" ref={emojiPickerRef}>
                      <emoji-picker></emoji-picker>
                    </div>
                  </>
                )}
              </div>
              <button type="submit" disabled={!canChat || !input.trim() || isSending}>
                <span className="material-icons">send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default AnonymousMatchPage

