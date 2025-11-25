import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdminLoggedIn } from '../utils/adminAuth'

function AdminRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      let authenticated = await isAdminLoggedIn()
      
      if (!authenticated) {
        await new Promise(resolve => setTimeout(resolve, 300))
        authenticated = await isAdminLoggedIn()
      }
      
      setIsAuthenticated(authenticated)
      setIsChecking(false)
    }

    checkAuth()
  }, [])

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p>驗證中...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default AdminRoute

