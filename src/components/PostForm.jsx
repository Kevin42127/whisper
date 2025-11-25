import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

const MAX_LENGTH = 500
const POST_INTERVAL = 30 * 1000
const RECENT_POSTS_KEY = 'recent_posts'
const LAST_POST_TIME_KEY = 'last_post_time'
const MAX_RECENT_POSTS = 5

function PostForm({ toast, isAdmin }) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    const checkInterval = () => {
      const lastPostTime = localStorage.getItem(LAST_POST_TIME_KEY)
      if (lastPostTime) {
        const elapsed = Date.now() - parseInt(lastPostTime, 10)
        const remaining = Math.max(0, POST_INTERVAL - elapsed)
        setTimeRemaining(remaining)
      } else {
        setTimeRemaining(0)
      }
    }

    checkInterval()
    const interval = setInterval(checkInterval, 1000)

    return () => clearInterval(interval)
  }, [isSubmitting])

  const checkPostInterval = () => {
    const lastPostTime = localStorage.getItem(LAST_POST_TIME_KEY)
    if (lastPostTime) {
      const elapsed = Date.now() - parseInt(lastPostTime, 10)
      if (elapsed < POST_INTERVAL) {
        const remainingSeconds = Math.ceil((POST_INTERVAL - elapsed) / 1000)
        return remainingSeconds
      }
    }
    return 0
  }

  const checkDuplicateContent = (newContent) => {
    const recentPosts = JSON.parse(localStorage.getItem(RECENT_POSTS_KEY) || '[]')
    const normalizedNewContent = newContent.trim().toLowerCase()
    
    for (const recentPost of recentPosts) {
      const normalizedRecent = recentPost.toLowerCase()
      
      if (normalizedNewContent === normalizedRecent) {
        return true
      }
      
      const similarity = calculateSimilarity(normalizedNewContent, normalizedRecent)
      if (similarity > 0.9) {
        return true
      }
    }
    
    return false
  }

  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) {
      return 1.0
    }
    
    const distance = levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  const levenshteinDistance = (str1, str2) => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim()) {
      return
    }

    if (content.length > MAX_LENGTH) {
      toast.warning(`留言長度不能超過 ${MAX_LENGTH} 字`)
      return
    }

    if (!isAdmin) {
      const remainingSeconds = checkPostInterval()
      if (remainingSeconds > 0) {
        toast.warning(`發文間隔需 ${POST_INTERVAL / 1000} 秒，請稍後 ${remainingSeconds} 秒再試`)
        return
      }

      if (checkDuplicateContent(content.trim())) {
        toast.warning('內容與最近發送的消息過於相似，請稍後再試或修改內容')
        return
      }
    }

    const hasLink = /(https?:\/\/|www\.)/i.test(content)
    if (hasLink) {
      toast.warning('禁止貼上連結')
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
      content.toLowerCase().includes(keyword.toLowerCase())
    )
    if (hasScamKeyword) {
      toast.warning('內容包含不允許的關鍵字')
      return
    }

    setIsSubmitting(true)

    try {
      await addDoc(collection(db, 'posts'), {
        content: content.trim(),
        createdAt: serverTimestamp(),
        isAdmin: isAdmin || false
      })
      
      if (!isAdmin) {
        localStorage.setItem(LAST_POST_TIME_KEY, Date.now().toString())
        
        const recentPosts = JSON.parse(localStorage.getItem(RECENT_POSTS_KEY) || '[]')
        recentPosts.unshift(content.trim())
        if (recentPosts.length > MAX_RECENT_POSTS) {
          recentPosts.pop()
        }
        localStorage.setItem(RECENT_POSTS_KEY, JSON.stringify(recentPosts))
      }
      
      setContent('')
      toast.success('發文成功')
    } catch (error) {
      console.error('發文失敗:', error)
      toast.error('發文失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (content.trim() && !isSubmitting) {
        handleSubmit(e)
      }
    }
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      {isAdmin ? (
        <div className="admin-badge">
          <span className="material-icons">admin_panel_settings</span>
          <span>管理員模式</span>
        </div>
      ) : null}
      <div className="form-group">
        <textarea
          className="form-textarea"
          placeholder="輸入你的想法..."
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) {
              setContent(e.target.value)
            }
          }}
          onKeyDown={handleKeyDown}
          rows="6"
          disabled={isSubmitting}
          maxLength={MAX_LENGTH}
        />
        <div className="form-char-count">
          <span className={content.length > MAX_LENGTH * 0.9 ? 'char-count-warning' : ''}>
            {content.length} / {MAX_LENGTH}
          </span>
          {!isAdmin && timeRemaining > 0 && (
            <span className="post-interval-warning">
              請稍候 {Math.ceil(timeRemaining / 1000)} 秒
            </span>
          )}
        </div>
      </div>
      <button
        type="submit"
        className="form-submit"
        disabled={isSubmitting || !content.trim() || content.length > MAX_LENGTH || (!isAdmin && timeRemaining > 0)}
      >
        <span className="material-icons">send</span>
        發送
      </button>
    </form>
  )
}

export default PostForm

