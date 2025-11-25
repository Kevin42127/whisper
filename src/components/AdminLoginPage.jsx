import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { verifyAdmin, setAdminSession, isAdminLoggedIn } from '../utils/adminAuth'

function AdminLoginPage({ toast, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdminLoggedIn()) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (verifyAdmin(email, password)) {
        setAdminSession()
        setEmail('')
        setPassword('')
        if (toast) {
          toast.success('管理員登入成功')
        }
        if (onLoginSuccess) {
          onLoginSuccess()
        } else {
          navigate('/admin/dashboard')
        }
      } else {
        setError('帳號或密碼錯誤')
        if (toast) {
          toast.error('帳號或密碼錯誤')
        }
      }
    } catch (error) {
      console.error('登入失敗:', error)
      setError('登入失敗')
      if (toast) {
        toast.error('登入失敗')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <span className="material-icons">admin_panel_settings</span>
          <h2>管理員登入</h2>
          <p>請輸入管理員帳號密碼</p>
        </div>
        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="admin-login-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">電子郵件</label>
            <input
              type="email"
              className="form-input"
              placeholder="電子郵件"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              disabled={isLoading}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">密碼</label>
            <input
              type="password"
              className="form-input"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <button type="submit" className="form-submit" disabled={isLoading}>
            <span className="material-icons">login</span>
            {isLoading ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLoginPage

