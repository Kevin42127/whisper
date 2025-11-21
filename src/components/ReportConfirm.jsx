function ReportConfirm({ isVisible, onConfirm, onCancel, isReporting }) {
  if (!isVisible) return null

  return (
    <div className="report-confirm-overlay">
      <div className="report-confirm-modal">
        <div className="report-confirm-icon">
          <span className="material-icons">report</span>
        </div>
        <h3 className="report-confirm-title">檢舉此留言</h3>
        <p className="report-confirm-message">確定要檢舉此留言嗎？管理員會審核此檢舉。</p>
        <div className="report-confirm-actions">
          <button
            className="report-confirm-cancel"
            onClick={onCancel}
            disabled={isReporting}
          >
            取消
          </button>
          <button
            className="report-confirm-submit"
            onClick={onConfirm}
            disabled={isReporting}
          >
            {isReporting ? '檢舉中...' : '確定檢舉'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportConfirm

