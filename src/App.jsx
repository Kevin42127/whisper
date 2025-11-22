import { useState, useEffect } from 'react'
import PostForm from './components/PostForm'
import PostList from './components/PostList'
import AdminLogin from './components/AdminLogin'
import ToastContainer from './components/ToastContainer'
import Announcement from './components/Announcement'
import ReportList from './components/ReportList'
import useToast from './hooks/useToast'
import { db, auth } from './config/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

function App() {
  const [posts, setPosts] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const hasSeenAnnouncement = localStorage.getItem('hasSeenAnnouncement')
    if (!hasSeenAnnouncement) {
      setShowAnnouncement(true)
    }
  }, [])

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user)
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
      <header className="app-header">
        <div className="brand-block">
          <h1 className="brand-logo">Whisper</h1>
          <p className="app-subtitle">匿名發言，自由表達</p>
        </div>
        <div className="header-actions">
          <button 
            className="announcement-bell" 
            onClick={() => setShowAnnouncement(true)}
            title="查看公告"
          >
            <span className="material-icons">notifications</span>
          </button>
          <AdminLogin 
            isLoggedIn={isAdmin} 
            toast={toast} 
            onShowReports={() => setShowReports((prev) => !prev)}
          />
        </div>
      </header>
      <main className="app-main">
        {showReports ? (
          <ReportsSection isAdmin={isAdmin} toast={toast} onClose={() => setShowReports(false)} />
        ) : (
          <HomeSection posts={posts} isAdmin={isAdmin} toast={toast} />
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
function HomeSection({ posts, isAdmin, toast }) {
  return (
    <>
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
        <PostList posts={posts} isAdmin={isAdmin} toast={toast} />
      </section>
    </>
  )
}

function ReportsSection({ isAdmin, toast, onClose }) {
  if (!isAdmin) {
    return (
      <div className="guard-card">
        <span className="material-icons">lock</span>
        <p>僅限管理員檢視檢舉記錄</p>
        <button className="cta-primary" onClick={onClose}>
          返回首頁
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

export default App

