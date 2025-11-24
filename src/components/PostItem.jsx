import { useState } from 'react'
import { doc, deleteDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import DeleteConfirm from './DeleteConfirm'
import ReportConfirm from './ReportConfirm'

function PostItem({ post, isAdmin, toast, searchTerm = '' }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReportConfirm, setShowReportConfirm] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [isPinning, setIsPinning] = useState(false)

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '剛剛'
    if (minutes < 60) return `${minutes} 分鐘前`
    if (hours < 24) return `${hours} 小時前`
    if (days < 7) return `${days} 天前`
    
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, 'posts', post.id))
      toast.success('留言已刪除')
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('刪除失敗:', error)
      toast.error('刪除失敗，請稍後再試')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  const handleReportClick = () => {
    setShowReportConfirm(true)
  }

  const handleConfirmReport = async () => {
    setIsReporting(true)
    try {
      await addDoc(collection(db, 'reports'), {
        postId: post.id,
        postContent: post.content,
        createdAt: serverTimestamp(),
        reportedAt: serverTimestamp(),
        status: 'pending'
      })
      toast.success('檢舉已送出，管理員會盡快處理')
      setShowReportConfirm(false)
    } catch (error) {
      console.error('檢舉失敗:', error)
      toast.error('檢舉失敗，請稍後再試')
    } finally {
      setIsReporting(false)
    }
  }

  const handleCancelReport = () => {
    setShowReportConfirm(false)
  }

  const handlePinToggle = async () => {
    setIsPinning(true)
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        pinned: !post.pinned
      })
      toast.success(post.pinned ? '已取消釘選' : '已釘選')
    } catch (error) {
      console.error('釘選失敗:', error)
      toast.error('釘選失敗，請稍後再試')
    } finally {
      setIsPinning(false)
    }
  }

  const highlightText = (text, term) => {
    if (!term || !term.trim()) {
      return text
    }

    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    )
  }

  return (
    <article className={`post-item ${post.pinned ? 'post-item-pinned' : ''} ${!post.isAdmin ? 'post-item-anonymous' : ''}`}>
      {post.pinned && (
        <div className="post-pinned-badge">
          <span className="material-icons">push_pin</span>
          <span>已釘選</span>
        </div>
      )}
      <div className="post-header">
        <div className="post-header-left">
          {post.isAdmin && (
            <div className="post-admin-badge">
              <span>管理員</span>
            </div>
          )}
        </div>
        <div className="post-header-right">
          <time className="post-time">
            <span className="material-icons">schedule</span>
            {formatDate(post.createdAt)}
          </time>
          {!isAdmin && (
            <button
              className="post-report"
              onClick={handleReportClick}
              title="檢舉此留言"
            >
              <span className="material-icons">report</span>
            </button>
          )}
          {isAdmin && (
            <>
              <button
                className={`post-pin ${post.pinned ? 'post-pin-active' : ''}`}
                onClick={handlePinToggle}
                disabled={isPinning}
                title={post.pinned ? '取消釘選' : '釘選此留言'}
              >
                <span className="material-icons">push_pin</span>
              </button>
              <button
                className="post-delete"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                title="刪除此留言"
              >
                <span className="material-icons">delete</span>
              </button>
            </>
          )}
        </div>
      </div>
      <div className="post-content">{highlightText(post.content, searchTerm)}</div>
      <DeleteConfirm
        isVisible={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
      <ReportConfirm
        isVisible={showReportConfirm}
        onConfirm={handleConfirmReport}
        onCancel={handleCancelReport}
        isReporting={isReporting}
      />
    </article>
  )
}

export default PostItem

