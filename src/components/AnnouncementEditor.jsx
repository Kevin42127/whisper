import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

function AnnouncementEditor({ toast, onClose }) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadAnnouncement()
  }, [])

  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  const loadAnnouncement = async () => {
    setIsLoading(true)
    try {
      const docRef = doc(db, 'announcement', 'main')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        setContent(docSnap.data().content || '')
      } else {
        setContent('禁止詐騙、行銷等不當用途\n\n管理員會隨時查看並刪除違規內容')
      }
    } catch (error) {
      console.error('載入公告失敗:', error)
      toast.error('載入公告失敗')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('公告內容不能為空')
      return
    }

    setIsSaving(true)
    try {
      await setDoc(doc(db, 'announcement', 'main'), {
        content: content.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: 'admin'
      })
      toast.success('公告已更新')
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('儲存公告失敗:', error)
      toast.error('儲存公告失敗')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="announcement-editor-container">
        <div className="announcement-editor-loading">
          <span className="material-icons">hourglass_empty</span>
          <p>載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="announcement-editor-container">
      <div className="announcement-editor-nav">
        <button
          className="announcement-editor-back"
          onClick={handleClose}
          disabled={isSaving}
        >
          <span className="material-icons">arrow_back</span>
          <span>返回後台</span>
        </button>
        <div className="announcement-editor-title">
          <span className="material-icons">edit</span>
          <h2>編輯公告</h2>
        </div>
      </div>
      <div className="announcement-editor">
        <div className="announcement-editor-content">
          <div className="form-group">
            <label className="form-label">公告內容</label>
            <textarea
              className="form-textarea announcement-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="輸入公告內容..."
              rows="12"
              disabled={isSaving}
            />
            <p className="form-hint">支援換行，每行會顯示為一個段落</p>
          </div>
        </div>
        <div className="announcement-editor-footer">
          <button
            className="announcement-editor-cancel"
            onClick={handleClose}
            disabled={isSaving}
          >
            取消
          </button>
          <button
            className="announcement-editor-save"
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
          >
            <span className="material-icons">save</span>
            {isSaving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementEditor

