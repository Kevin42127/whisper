import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ToastContainer from './components/ToastContainer'
import AnonymousMatchPage from './components/AnonymousMatchPage'
import ScrollProgress from './components/ScrollProgress'
import useToast from './hooks/useToast'

function App() {
  const location = useLocation()
  const toast = useToast()
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [theme, setTheme] = useState('light')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640)

  const isMatchPath = location.pathname === '/'

  useEffect(() => {
    const hasSeen = localStorage.getItem('matchFocusAnnouncement')
    if (!hasSeen) {
      setShowAnnouncement(true)
    }
  }, [])

  useEffect(() => {
    const storedTheme = localStorage.getItem('whisperTheme')
    if (storedTheme === 'dark') {
      setTheme('dark')
      document.body.classList.add('theme-dark')
    }
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('theme-dark')
    } else {
      document.body.classList.remove('theme-dark')
    }
    localStorage.setItem('whisperTheme', theme)
  }, [theme])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleAnnouncementClose = () => {
    localStorage.setItem('matchFocusAnnouncement', 'true')
    setShowAnnouncement(false)
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className={`app ${isMatchPath ? 'match-fullscreen' : ''}`}>
      <ScrollProgress />
      <header className="app-header color-splash tone-coral">
        <div className="brand-block">
          <h1 className="brand-logo">Whisper</h1>
          <p className="app-subtitle">專注匿名配對，發言功能暫停中</p>
        </div>
        <div className="header-actions">
          <a
            className="icon-button"
            href="https://forms.gle/yPtzgs3oxqAUgZZT8"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="回饋表單"
          >
            <span className="material-icons">feedback</span>
          </a>
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label="切換深淺模式"
            title="切換深淺模式"
          >
            <span className="material-icons">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button
            className="announcement-toggle"
            onClick={() => setShowAnnouncement(true)}
            title="查看公告"
          >
            <span className="material-icons">campaign</span>
            {!isMobile && '查看公告'}
          </button>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={
            <AnonymousMatchPage
              toast={toast}
            />
          } />
          <Route path="/match" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <footer className="app-footer color-splash tone-mint">
        <div className="footer-content">
          <p>© Whisper</p>
        </div>
      </footer>
      {!isMatchPath && (
        <a 
          href="https://forms.gle/yPtzgs3oxqAUgZZT8" 
          target="_blank" 
          rel="noopener noreferrer"
          className="feedback-fab"
          title="回饋表單"
        >
          <span className="material-icons">feedback</span>
        </a>
      )}
      {showAnnouncement && (
        <ServiceAnnouncement onClose={handleAnnouncementClose} />
      )}
    </div>
  )
}

function ServiceAnnouncement({ onClose }) {
  return (
    <div className="announcement-overlay">
      <div className="announcement-modal">
        <div className="announcement-header">
          <h3>服務公告</h3>
          <button className="announcement-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="announcement-content">
          <div className="announcement-icon">
            <span className="material-icons">campaign</span>
          </div>
          <p>
            目前暫停「匿名發言」功能，<br />
            集中資源優化匿名配對與聊天室體驗。
          </p>
          <p>
            發言功能將在完成優化後再開放，<br />
            歡迎先體驗配對功能或透過回饋表單提供建議。
          </p>
        </div>
        <div className="announcement-footer">
          <button className="announcement-button" onClick={onClose}>
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}

export default App

