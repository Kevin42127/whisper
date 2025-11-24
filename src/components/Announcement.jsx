import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

function Announcement({ isVisible, onClose }) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isVisible) return

    setIsLoading(true)
    
    // 使用實時監聽來獲取公告內容
    const docRef = doc(db, 'announcement', 'main')
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        try {
          if (docSnap.exists() && docSnap.data().content) {
            setContent(docSnap.data().content)
          } else {
            setContent('禁止詐騙、行銷等不當用途\n\n管理員會隨時查看並刪除違規內容')
          }
        } catch (error) {
          console.error('載入公告失敗:', error)
          setContent('禁止詐騙、行銷等不當用途\n\n管理員會隨時查看並刪除違規內容')
        } finally {
          setIsLoading(false)
        }
      },
      (error) => {
        console.error('監聽公告失敗:', error)
        setContent('禁止詐騙、行銷等不當用途\n\n管理員會隨時查看並刪除違規內容')
        setIsLoading(false)
      }
    )

    // 清理監聽器
    return () => unsubscribe()
  }, [isVisible])

  if (!isVisible) return null

  const handleClose = () => {
    localStorage.setItem('hasSeenAnnouncement', 'true')
    onClose()
  }

  const paragraphs = content.split('\n').filter(p => p.trim())

  return (
    <div className="announcement-overlay">
      <div className="announcement-modal">
        <div className="announcement-header">
          <h3>重要公告</h3>
          <button className="announcement-close" onClick={handleClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="announcement-content">
          {isLoading ? (
            <div className="announcement-loading">
              <span className="material-icons">hourglass_empty</span>
              <p>載入中...</p>
            </div>
          ) : (
            <>
              <div className="announcement-icon">
                <span className="material-icons">info</span>
              </div>
              {paragraphs.map((paragraph, index) => (
                <p key={index} className={index === paragraphs.length - 1 ? 'announcement-warning' : ''}>
                  {paragraph}
                </p>
              ))}
            </>
          )}
        </div>
        <div className="announcement-footer">
          <button className="announcement-button" onClick={handleClose} disabled={isLoading}>
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}

export default Announcement

