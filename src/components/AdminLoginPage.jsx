import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginAdmin, isAdminLoggedIn, verifyAccessKey, getAdminSession } from '../utils/adminAuth'

function AdminLoginPage({ toast, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (isLoggedIn) return

    const checkAccess = async () => {
      const loggedIn = await isAdminLoggedIn()
      if (loggedIn) {
        setIsLoggedIn(true)
        navigate('/admin/dashboard', { replace: true })
        return
      }

      const accessKey = searchParams.get('access')
      if (!accessKey) {
        const session = getAdminSession()
        if (session && session.token) {
          await new Promise(resolve => setTimeout(resolve, 500))
          const retryLoggedIn = await isAdminLoggedIn()
          if (retryLoggedIn) {
            setIsLoggedIn(true)
            navigate('/admin/dashboard', { replace: true })
            return
          }
        }
        navigate('/', { replace: true })
        return
      }

      const isValidAccess = await verifyAccessKey(accessKey)
      if (!isValidAccess) {
        navigate('/', { replace: true })
        return
      }

      setIsCheckingAccess(false)
    }

    checkAccess()
  }, [navigate, searchParams, isLoggedIn])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const accessKey = searchParams.get('access')
      
      if (!accessKey) {
        setError('訪問密鑰無效')
        navigate('/', { replace: true })
        return
      }

      const success = await loginAdmin(email, password, accessKey)
      
      if (success) {
        setEmail('')
        setPassword('')
        setIsLoggedIn(true)
        if (toast) {
          toast.success('管理員登入成功')
        }
        if (onLoginSuccess) {
          onLoginSuccess()
        }
        await new Promise(resolve => setTimeout(resolve, 300))
        navigate('/admin/dashboard', { replace: true })
      } else {
        setError('帳號或密碼錯誤')
        if (toast) {
          toast.error('帳號或密碼錯誤')
        }
      }
    } catch (error) {
      console.error('登入失敗:', error)
      setError(error.message || '登入失敗')
      if (toast) {
        toast.error(error.message || '登入失敗')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAccess) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-container">
          <p>驗證中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <button 
          className="admin-login-back"
          onClick={() => navigate('/')}
          disabled={isLoading}
        >
          <span className="material-icons">arrow_back</span>
          <span>返回首頁</span>
        </button>
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

