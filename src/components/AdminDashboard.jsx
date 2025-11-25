import { useNavigate } from 'react-router-dom'

function AdminDashboard({ onNavigate, onLogout }) {
  const menuItems = [
    {
      id: 'announcement',
      title: '編輯公告',
      description: '管理網站公告內容',
      icon: 'edit',
      color: 'primary'
    },
    {
      id: 'reports',
      title: '檢舉管理',
      description: '處理使用者檢舉的留言',
      icon: 'report',
      color: 'accent'
    },
    {
      id: 'posts',
      title: '管理留言',
      description: '查看、刪除和釘選留言',
      icon: 'admin_panel_settings',
      color: 'secondary'
    }
  ]

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div className="admin-dashboard-title">
          <span className="material-icons">admin_panel_settings</span>
          <h2>管理後台</h2>
        </div>
        <p className="admin-dashboard-subtitle">選擇要管理的功能</p>
        {onLogout && (
          <button className="admin-logout-btn" onClick={onLogout} title="登出">
            <span className="material-icons">logout</span>
            <span>登出</span>
          </button>
        )}
      </div>
      
      <div className="admin-dashboard-grid">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`admin-dashboard-card admin-dashboard-card-${item.color}`}
            onClick={() => onNavigate(item.id)}
          >
            <div className="admin-dashboard-card-icon">
              <span className="material-icons">{item.icon}</span>
            </div>
            <div className="admin-dashboard-card-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <div className="admin-dashboard-card-arrow">
              <span className="material-icons">arrow_forward</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboard

