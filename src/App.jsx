import { useState, useEffect } from 'react'
import PostForm from './components/PostForm'
import PostList from './components/PostList'
import AdminLogin from './components/AdminLogin'
import ToastContainer from './components/ToastContainer'
import Announcement from './components/Announcement'
import AnnouncementEditor from './components/AnnouncementEditor'
import ReportList from './components/ReportList'
import PostManagement from './components/PostManagement'
import AdminDashboard from './components/AdminDashboard'
import SearchBar from './components/SearchBar'
import UserSettings from './components/UserSettings'
import AnonymousMatchPage from './components/AnonymousMatchPage'
import ScrollProgress from './components/ScrollProgress'
import useToast from './hooks/useToast'
import { db, auth } from './config/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

function App() {
  const [posts, setPosts] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [adminPage, setAdminPage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [activePage, setActivePage] = useState('home')
  const toast = useToast()

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
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const adminStatus = !!user
      setIsAdmin(adminStatus)
      if (adminStatus) {
        setActivePage('home')
        setAdminPage('dashboard')
      } else {
        setAdminPage(null)
      }
    })

    return () => unsubscribeAuth()
  }, [])

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
    <div className="app">
      <ScrollProgress />
      <header className="app-header">
        <div className="brand-block">
          <h1 className="brand-logo">Whisper</h1>
          <p className="app-subtitle">匿名發言，自由表達</p>
        </div>
        <div className="header-actions">
          <button
            className={`match-toggle ${activePage === 'match' ? 'active' : ''}`}
            onClick={() => {
              const nextPage = activePage === 'match' ? 'home' : 'match'
              if (nextPage === 'match') {
                setAdminPage(null)
              }
              setActivePage(nextPage)
            }}
          >
            <span className="material-icons">
              {activePage === 'match' ? 'home' : 'forum'}
            </span>
            {activePage === 'match' ? '返回首頁' : '匿名配對'}
          </button>
          <UserSettings />
          <button 
            className="announcement-bell" 
            onClick={() => setShowAnnouncement(true)}
            title="查看公告"
          >
            <span className="material-icons">notifications</span>
          </button>
          {!isMobile && (
            <AdminLogin 
              isLoggedIn={isAdmin} 
              toast={toast} 
              onShowAdmin={() => {
                setActivePage('home')
                setAdminPage('dashboard')
              }}
            />
          )}
        </div>
      </header>
      {!adminPage && activePage === 'home' && (
        <div className="search-section">
          <SearchBar onSearch={setSearchTerm} />
        </div>
      )}
      <main className="app-main">
        {adminPage === 'dashboard' ? (
          <AdminDashboardSection 
            isAdmin={isAdmin} 
            onNavigate={(page) => setAdminPage(page)} 
            onClose={() => setAdminPage(null)}
          />
        ) : adminPage === 'announcement' ? (
          <AnnouncementEditorSection 
            toast={toast} 
            onClose={() => setAdminPage('dashboard')} 
          />
        ) : adminPage === 'reports' ? (
          <ReportsSection 
            isAdmin={isAdmin} 
            toast={toast} 
            onClose={() => setAdminPage('dashboard')} 
          />
        ) : adminPage === 'posts' ? (
          <PostManagementSection 
            isAdmin={isAdmin} 
            toast={toast} 
            onClose={() => setAdminPage('dashboard')} 
          />
        ) : activePage === 'match' ? (
          <AnonymousMatchPage
            toast={toast}
            onBack={() => setActivePage('home')}
          />
        ) : (
          <HomeSection
            posts={posts}
            isAdmin={isAdmin}
            toast={toast}
            searchTerm={searchTerm}
          />
        )}
      </main>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <Announcement isVisible={showAnnouncement} onClose={() => setShowAnnouncement(false)} />
      <footer className="app-footer">
        <div className="footer-content">
          <p>© Whisper</p>
        </div>
      </footer>
      <a 
        href="https://forms.gle/eRY3UfV51Gh1523n6" 
        target="_blank" 
        rel="noopener noreferrer"
        className="feedback-fab"
        title="回饋表單"
      >
        <span className="material-icons">feedback</span>
      </a>
    </div>
  )
}
function HomeSection({ posts, isAdmin, toast, searchTerm }) {
  return (
    <>
      <div className="maintenance-banner">
        <span className="material-icons">campaign</span>
        <p>目前資料持久化遇到一些問題，我們正在處理，大家可先到匿名配對去遊玩。</p>
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

function AdminDashboardSection({ isAdmin, onNavigate, onClose }) {
  if (!isAdmin) {
    return (
      <div className="guard-card">
        <span className="material-icons">lock</span>
        <p>僅限管理員使用</p>
        <button className="cta-primary" onClick={onClose}>
          返回首頁
        </button>
      </div>
    )
  }

  return (
    <section className="admin-dashboard-page">
      <AdminDashboard onNavigate={onNavigate} />
    </section>
  )
}

function ReportsSection({ isAdmin, toast, onClose }) {
  if (!isAdmin) {
    return (
      <div className="guard-card">
        <span className="material-icons">lock</span>
        <p>僅限管理員檢視檢舉記錄</p>
        <button className="cta-primary" onClick={onClose}>
          返回後台
        </button>
      </div>
    )
  }

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

function PostManagementSection({ isAdmin, toast, onClose }) {
  if (!isAdmin) {
    return (
      <div className="guard-card">
        <span className="material-icons">lock</span>
        <p>僅限管理員使用</p>
        <button className="cta-primary" onClick={onClose}>
          返回後台
        </button>
      </div>
    )
  }

  return (
    <section className="post-management-page">
      <PostManagement toast={toast} onBack={onClose} />
    </section>
  )
}

export default App

