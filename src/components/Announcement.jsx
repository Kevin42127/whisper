function Announcement({ isVisible, onClose }) {
  if (!isVisible) return null

  const handleClose = () => {
    localStorage.setItem('hasSeenAnnouncement', 'true')
    onClose()
  }

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
          <div className="announcement-icon">
            <span className="material-icons">info</span>
          </div>
          <p>禁止詐騙、行銷等不當用途</p>
          <p className="announcement-warning">管理員會隨時查看並刪除違規內容</p>
        </div>
        <div className="announcement-footer">
          <button className="announcement-button" onClick={handleClose}>
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}

export default Announcement

