import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import DeleteConfirm from './DeleteConfirm'

function ReportList({ toast, onBack }) {
  const [reports, setReports] = useState([])
  const [allReports, setAllReports] = useState([])
  const [filter, setFilter] = useState('pending')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('reportedAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setAllReports(reportsData)
      
      const filtered = filter === 'all' 
        ? reportsData 
        : reportsData.filter(r => r.status === filter)
      
      setReports(filtered)
    })

    return () => unsubscribe()
  }, [filter])

  const pendingCount = allReports.filter(r => r.status === 'pending').length
  const resolvedCount = allReports.filter(r => r.status === 'resolved').length
  const totalCount = allReports.length

  const handleDeleteClick = (report) => {
    setSelectedReport(report)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedReport) return

    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, 'posts', selectedReport.postId))
      await updateDoc(doc(db, 'reports', selectedReport.id), {
        status: 'resolved',
        resolvedAt: new Date()
      })
      toast.success('留言已刪除，檢舉已標記為已處理')
      setShowDeleteConfirm(false)
      setSelectedReport(null)
    } catch (error) {
      console.error('刪除失敗:', error)
      toast.error('刪除失敗，請稍後再試')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setSelectedReport(null)
  }

  const handleResolve = async (report) => {
    try {
      await updateDoc(doc(db, 'reports', report.id), {
        status: 'resolved',
        resolvedAt: new Date()
      })
      toast.success('檢舉已標記為已處理')
    } catch (error) {
      console.error('更新失敗:', error)
      toast.error('更新失敗，請稍後再試')
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (reports.length === 0) {
    return (
      <div className="report-list-empty">
        <span className="material-icons">check_circle</span>
        <p>目前沒有{filter === 'pending' ? '待處理' : filter === 'resolved' ? '已處理' : ''}的檢舉</p>
      </div>
    )
  }

  return (
    <div className="report-list-container">
      <div className="admin-nav">
        <div className="admin-nav-header">
          {onBack && (
            <button className="admin-nav-back" onClick={onBack}>
              <span className="material-icons">arrow_back</span>
              <span>返回後台</span>
            </button>
          )}
          <div className="admin-nav-title">
            <span className="material-icons">admin_panel_settings</span>
            <h2>檢舉管理</h2>
          </div>
        </div>
        
        <div className="admin-nav-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon pending">
              <span className="material-icons">pending</span>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{pendingCount}</div>
              <div className="admin-stat-label">待處理</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon resolved">
              <span className="material-icons">check_circle</span>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{resolvedCount}</div>
              <div className="admin-stat-label">已處理</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon total">
              <span className="material-icons">list</span>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{totalCount}</div>
              <div className="admin-stat-label">總計</div>
            </div>
          </div>
        </div>

        <div className="admin-nav-filters">
          <button
            className={`admin-filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <span className="material-icons">pending</span>
            <span>待處理</span>
            {pendingCount > 0 && (
              <span className="admin-filter-badge">{pendingCount}</span>
            )}
          </button>
          <button
            className={`admin-filter-btn ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            <span className="material-icons">check_circle</span>
            <span>已處理</span>
          </button>
          <button
            className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="material-icons">list</span>
            <span>全部</span>
          </button>
        </div>
      </div>
      <div className="report-list">
        {reports.map(report => (
          <div key={report.id} className="report-item">
            <div className="report-header">
              <div className="report-status">
                <span className={`report-badge ${report.status === 'pending' ? 'pending' : 'resolved'}`}>
                  {report.status === 'pending' ? '待處理' : '已處理'}
                </span>
                <time className="report-time">
                  {formatDate(report.reportedAt)}
                </time>
              </div>
            </div>
            <div className="report-content">
              <p className="report-label">被檢舉的留言內容：</p>
              <div className="report-post-content">{report.postContent}</div>
            </div>
            {report.status === 'pending' && (
              <div className="report-actions">
                <button
                  className="report-action-delete"
                  onClick={() => handleDeleteClick(report)}
                >
                  <span className="material-icons">delete</span>
                  刪除留言
                </button>
                <button
                  className="report-action-resolve"
                  onClick={() => handleResolve(report)}
                >
                  <span className="material-icons">check</span>
                  標記已處理
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <DeleteConfirm
        isVisible={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default ReportList

