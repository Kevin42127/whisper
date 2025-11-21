import { useState, useEffect } from 'react'
import PostForm from './components/PostForm'
import PostList from './components/PostList'
import AdminLogin from './components/AdminLogin'
import ToastContainer from './components/ToastContainer'
import Announcement from './components/Announcement'
import useToast from './hooks/useToast'
import { db, auth } from './config/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

function App() {
  const [posts, setPosts] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
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
      setPosts(postsData)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="brand-logo">Whisper</h1>
        <p className="app-subtitle">匿名發言，自由表達</p>
        <div className="header-actions">
          <button 
            className="announcement-bell" 
            onClick={() => setShowAnnouncement(true)}
            title="查看公告"
          >
            <span className="material-icons">notifications</span>
          </button>
          <AdminLogin isLoggedIn={isAdmin} toast={toast} />
        </div>
      </header>
      <main className="app-main">
        <PostForm toast={toast} />
        <PostList posts={posts} isAdmin={isAdmin} toast={toast} />
      </main>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <Announcement isVisible={showAnnouncement} onClose={() => setShowAnnouncement(false)} />
      <footer className="app-footer">
        <p>© Whisper</p>
      </footer>
    </div>
  )
}

export default App

