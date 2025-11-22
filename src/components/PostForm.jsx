import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

function PostForm({ toast, isAdmin }) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      await addDoc(collection(db, 'posts'), {
        content: content.trim(),
        createdAt: serverTimestamp(),
        isAdmin: isAdmin || false
      })
      
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
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="6"
          disabled={isSubmitting}
        />
      </div>
      <button
        type="submit"
        className="form-submit"
        disabled={isSubmitting || !content.trim()}
      >
        <span className="material-icons">send</span>
        發送
      </button>
    </form>
  )
}

export default PostForm

