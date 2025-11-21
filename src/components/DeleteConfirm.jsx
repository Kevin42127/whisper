function DeleteConfirm({ isVisible, onConfirm, onCancel, isDeleting }) {
  if (!isVisible) return null

  return (
    <div className="delete-confirm-overlay">
      <div className="delete-confirm-modal">
        <div className="delete-confirm-icon">
          <span className="material-icons">warning</span>
        </div>
        <h3 className="delete-confirm-title">確定要刪除此留言嗎？</h3>
        <p className="delete-confirm-message">此操作無法復原</p>
        <div className="delete-confirm-actions">
          <button
            className="delete-confirm-cancel"
            onClick={onCancel}
            disabled={isDeleting}
          >
            取消
          </button>
          <button
            className="delete-confirm-delete"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '刪除中...' : '確定刪除'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirm

