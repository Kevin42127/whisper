import { useState, useEffect } from 'react'

function UserSettings() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState('medium')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    const savedFontSize = localStorage.getItem('fontSize') || 'medium'
    
    setIsDarkMode(savedDarkMode)
    setFontSize(savedFontSize)
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark-mode')
    }
    
    document.documentElement.setAttribute('data-font-size', savedFontSize)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }

  const handleFontSizeChange = (size) => {
    setFontSize(size)
    localStorage.setItem('fontSize', size)
    document.documentElement.setAttribute('data-font-size', size)
  }

  return (
    <>
      <button
        className="settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="設定"
      >
        <span className="material-icons">settings</span>
      </button>
      
      {isOpen && (
        <div className="settings-overlay" onClick={() => setIsOpen(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h3>設定</h3>
              <button
                className="settings-close"
                onClick={() => setIsOpen(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="settings-content">
              <div className="settings-group">
                <div className="settings-row">
                  <label className="settings-label">深色模式</label>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="settings-group">
                <label className="settings-label">字體大小</label>
                <div className="font-size-options">
                  <button
                    className={`font-size-btn ${fontSize === 'small' ? 'active' : ''}`}
                    onClick={() => handleFontSizeChange('small')}
                  >
                    小
                  </button>
                  <button
                    className={`font-size-btn ${fontSize === 'medium' ? 'active' : ''}`}
                    onClick={() => handleFontSizeChange('medium')}
                  >
                    中
                  </button>
                  <button
                    className={`font-size-btn ${fontSize === 'large' ? 'active' : ''}`}
                    onClick={() => handleFontSizeChange('large')}
                  >
                    大
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserSettings

