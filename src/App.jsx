import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import PostForm from './components/PostForm'
import PostList from './components/PostList'
import ToastContainer from './components/ToastContainer'
import Announcement from './components/Announcement'
import AnnouncementEditor from './components/AnnouncementEditor'
import ReportList from './components/ReportList'
import PostManagement from './components/PostManagement'
import AdminDashboard from './components/AdminDashboard'
import AdminLoginPage from './components/AdminLoginPage'
import AdminRoute from './components/AdminRoute'
import SearchBar from './components/SearchBar'
import UserSettings from './components/UserSettings'
import AnonymousMatchPage from './components/AnonymousMatchPage'
import ScrollProgress from './components/ScrollProgress'
import useToast from './hooks/useToast'
import { db } from './config/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { isAdminLoggedIn, clearAdminSession } from './utils/adminAuth'

function App() {
  const [posts, setPosts] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const isAdminPath = location.pathname.startsWith('/admin')
  const isMatchPath = location.pathname === '/match'

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const hasSeenAnnouncement = localStorage.getItem('hasSeenAnnouncement')
    if (!hasSeenAnnouncement) {
      setShowAnnouncement(true)
    }
  }, [])

  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = isAdminLoggedIn()
      setIsAdmin(adminStatus)
    }

    checkAdminStatus()
    const interval = setInterval(checkAdminStatus, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleAdminLogout = () => {
    clearAdminSession()
    setIsAdmin(false)
    navigate('/')
    if (toast) {
      toast.info('已登出管理員模式')
    }
  }

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true)
    navigate('/admin/dashboard')
  }

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      const sortedPosts = postsData.sort((a, b) => {
        const aPinned = a.pinned || false
        const bPinned = b.pinned || false
        if (aPinned && !bPinned) return -1
        if (!aPinned && bPinned) return 1
        return 0
      })
      setPosts(sortedPosts)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className={`app ${isMatchPath ? 'match-fullscreen' : ''}`}>
      <ScrollProgress />
      {!isAdminPath && (
        <header className="app-header">
          <div className="brand-block">
            <h1 className="brand-logo">Whisper</h1>
            <p className="app-subtitle">匿名發言，自由表達</p>
          </div>
          <div className="header-actions">
            <button
              className={`match-toggle ${isMatchPath ? 'active' : ''}`}
              onClick={() => {
                navigate(isMatchPath ? '/' : '/match')
              }}
            >
              <span className="material-icons">
                {isMatchPath ? 'home' : 'forum'}
              </span>
              {isMatchPath ? '返回首頁' : '匿名配對'}
            </button>
            <UserSettings />
            <button 
              className="announcement-bell" 
              onClick={() => setShowAnnouncement(true)}
              title="查看公告"
            >
              <span className="material-icons">notifications</span>
            </button>
          </div>
        </header>
      )}
      {!isAdminPath && location.pathname === '/' && (
        <div className="search-section">
          <SearchBar onSearch={setSearchTerm} />
        </div>
      )}
      <main className="app-main">
        <Routes>
          <Route path="/" element={
            <HomeSection
              posts={posts}
              isAdmin={isAdmin}
              toast={toast}
              searchTerm={searchTerm}
            />
          } />
          <Route path="/match" element={
            <AnonymousMatchPage
              toast={toast}
              onBack={() => navigate('/')}
            />
          } />
          <Route path="/admin/login" element={
            <AdminLoginPage 
              toast={toast} 
              onLoginSuccess={handleAdminLoginSuccess}
            />
          } />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboardSection 
                toast={toast}
                onNavigate={(page) => navigate(`/admin/${page}`)}
                onLogout={handleAdminLogout}
              />
            </AdminRoute>
          } />
          <Route path="/admin/announcement" element={
            <AdminRoute>
              <AnnouncementEditorSection 
                toast={toast} 
                onClose={() => navigate('/admin/dashboard')} 
              />
            </AdminRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminRoute>
              <ReportsSection 
                toast={toast} 
                onClose={() => navigate('/admin/dashboard')} 
              />
            </AdminRoute>
          } />
          <Route path="/admin/posts" element={
            <AdminRoute>
              <PostManagementSection 
                toast={toast} 
                onClose={() => navigate('/admin/dashboard')} 
              />
            </AdminRoute>
          } />
        </Routes>
      </main>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <Announcement isVisible={showAnnouncement} onClose={() => setShowAnnouncement(false)} />
      {!isAdminPath && (
        <footer className="app-footer">
          <div className="footer-content">
            <p>© Whisper</p>
          </div>
        </footer>
      )}
      {!isMatchPath && !isAdminPath && (
        <a 
          href="https://forms.gle/eRY3UfV51Gh1523n6" 
          target="_blank" 
          rel="noopener noreferrer"
          className="feedback-fab"
          title="回饋表單"
        >
          <span className="material-icons">feedback</span>
        </a>
      )}
    </div>
  )
}
function HomeSection({ posts, isAdmin, toast, searchTerm }) {
  return (
    <>
      <div className="maintenance-banner">
        <span className="material-icons">campaign</span>
        <p>為了維護網站安全與使用者權益，請不要嘗試未經授權的登入行為。感謝大家的配合與理解。</p>
      </div>
      <section id="compose-form" className="compose-section">
        <div className="compose-card">
          {isAdmin && (
            <div className="compose-note">
              <span className="material-icons">info</span>
              管理員發文依然保持匿名，但請謹慎使用。
            </div>
          )}
          <PostForm toast={toast} isAdmin={isAdmin} />
        </div>
      </section>
      <section id="latest-posts" className="posts-preview">
        <PostList posts={posts} isAdmin={isAdmin} toast={toast} searchTerm={searchTerm} />
      </section>
    </>
  )
}

function AdminDashboardSection({ toast, onNavigate, onLogout }) {
  return (
    <section className="admin-dashboard-page">
      <AdminDashboard onNavigate={onNavigate} onLogout={onLogout} />
    </section>
  )
}

function ReportsSection({ toast, onClose }) {
  return (
    <section className="reports-page">
      <ReportList toast={toast} onBack={onClose} />
    </section>
  )
}

function AnnouncementEditorSection({ toast, onClose }) {
  return (
    <section className="announcement-editor-page">
      <AnnouncementEditor toast={toast} onClose={onClose} />
    </section>
  )
}

function PostManagementSection({ toast, onClose }) {
  return (
    <section className="post-management-page">
      <PostManagement toast={toast} onBack={onClose} />
    </section>
  )
}

export default App

