import { useState } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../config/firebase'

function AdminLogin({ isLoggedIn, toast, onShowReports }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      setEmail('')
      setPassword('')
      setShowForm(false)
      if (toast) {
        toast.success('管理員登入成功')
      }
    } catch (error) {
      console.error('登入失敗:', error)
      setError('帳號或密碼錯誤')
      if (toast) {
        toast.error('帳號或密碼錯誤')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      if (toast) {
        toast.info('已登出管理員模式')
      }
    } catch (error) {
      console.error('登出失敗:', error)
      if (toast) {
        toast.error('登出失敗')
      }
    }
  }

  if (isLoggedIn) {
    return (
      <div className="admin-panel">
        {onShowReports && (
          <button 
            className="admin-reports" 
            onClick={onShowReports}
            title="檢舉管理"
          >
            <span className="material-icons">report</span>
            檢舉管理
          </button>
        )}
        <button className="admin-logout" onClick={handleLogout}>
          <span className="material-icons">logout</span>
          登出
        </button>
      </div>
    )
  }

  if (!showForm) {
    return (
      <button className="admin-toggle" onClick={() => setShowForm(true)}>
        <span className="material-icons">lock</span>
        管理員登入
      </button>
    )
  }

  return (
    <div className="admin-login">
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-header">
          <h3>管理員登入</h3>
          <button
            type="button"
            className="admin-close"
            onClick={() => {
              setShowForm(false)
              setError('')
            }}
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        {error && <div className="admin-error">{error}</div>}
        <div className="form-group">
          <input
            type="email"
            className="form-input"
            placeholder="電子郵件"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            className="form-input"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="form-submit" disabled={isLoading}>
          <span className="material-icons">login</span>
          {isLoading ? '登入中...' : '登入'}
        </button>
      </form>
    </div>
  )
}

export default AdminLogin

