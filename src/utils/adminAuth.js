const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD
const ADMIN_SESSION_KEY = 'admin_session'

export function verifyAdmin(email, password) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('管理員帳號或密碼未設置，請檢查環境變數')
    return false
  }
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD
}

export function setAdminSession() {
  const sessionId = Date.now().toString()
  localStorage.setItem(ADMIN_SESSION_KEY, sessionId)
  return sessionId
}

export function getAdminSession() {
  return localStorage.getItem(ADMIN_SESSION_KEY)
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function isAdminLoggedIn() {
  return !!getAdminSession()
}

