const ADMIN_SESSION_KEY = 'admin_session'

const API_BASE_URL = '/api/admin'

export async function verifyAccessKey(accessKey) {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessKey })
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.valid === true
  } catch (error) {
    console.error('驗證訪問密鑰失敗:', error)
    return false
  }
}

export async function loginAdmin(email, password, accessKey) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, accessKey })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '登入失敗')
    }

    const data = await response.json()
    
    if (data.success && data.sessionToken) {
      setAdminSession(data.sessionToken, data.expiresAt)
      return true
    }

    return false
  } catch (error) {
    console.error('登入失敗:', error)
    throw error
  }
}

export function setAdminSession(sessionToken, expiresAt) {
  const sessionData = {
    token: sessionToken,
    expiresAt: expiresAt
  }
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData))
}

export function getAdminSession() {
  const sessionData = localStorage.getItem(ADMIN_SESSION_KEY)
  if (!sessionData) {
    return null
  }

  try {
    const session = JSON.parse(sessionData)
    if (session.expiresAt && session.expiresAt < Date.now()) {
      clearAdminSession()
      return null
    }
    return session
  } catch (error) {
    return null
  }
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export async function isAdminLoggedIn() {
  const session = getAdminSession()
  
  if (!session || !session.token) {
    return false
  }

  if (session.expiresAt && session.expiresAt < Date.now()) {
    clearAdminSession()
    return false
  }

  try {
    const response = await fetch(`${API_BASE_URL}/verify-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionToken: session.token })
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    
    if (data.valid !== true) {
      clearAdminSession()
      return false
    }

    return true
  } catch (error) {
    console.error('驗證 session 失敗:', error)
    return false
  }
}

