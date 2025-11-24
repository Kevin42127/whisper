import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import PostItem from './PostItem'

function PostManagement({ onBack, toast }) {
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('all')

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


  const filteredPosts = filter === 'all' 
    ? posts 
    : filter === 'pinned'
    ? posts.filter(p => p.pinned)
    : filter === 'admin'
    ? posts.filter(p => p.isAdmin)
    : posts.filter(p => !p.isAdmin)

  const pinnedCount = posts.filter(p => p.pinned).length
  const adminCount = posts.filter(p => p.isAdmin).length
  const anonymousCount = posts.filter(p => !p.isAdmin).length
  const totalCount = posts.length

  return (
    <div className="post-management-container">
      <div className="admin-nav">
        <div className="admin-nav-header">
          {onBack && (
            <button className="admin-nav-back" onClick={onBack}>
              <span className="material-icons">arrow_back</span>
              <span>返回後台</span>
            </button>
          )}
          <div className="admin-nav-title">
            <span className="material-icons">admin_panel_settings</span>
            <h2>管理留言</h2>
          </div>
        </div>
        
        <div className="admin-nav-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon total">
              <span className="material-icons">list</span>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{totalCount}</div>
              <div className="admin-stat-label">總計</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon pending">
              <span className="material-icons">push_pin</span>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{pinnedCount}</div>
              <div className="admin-stat-label">已釘選</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon resolved">
              <span className="material-icons">person</span>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{anonymousCount}</div>
              <div className="admin-stat-label">匿名</div>
            </div>
          </div>
        </div>

        <div className="admin-nav-filters">
          <button
            className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="material-icons">list</span>
            <span>全部</span>
          </button>
          <button
            className={`admin-filter-btn ${filter === 'pinned' ? 'active' : ''}`}
            onClick={() => setFilter('pinned')}
          >
            <span className="material-icons">push_pin</span>
            <span>已釘選</span>
          </button>
          <button
            className={`admin-filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            <span className="material-icons">admin_panel_settings</span>
            <span>管理員</span>
          </button>
          <button
            className={`admin-filter-btn ${filter === 'anonymous' ? 'active' : ''}`}
            onClick={() => setFilter('anonymous')}
          >
            <span className="material-icons">person</span>
            <span>匿名</span>
          </button>
        </div>
      </div>

      <div className="post-management-list">
        {filteredPosts.length === 0 ? (
          <div className="post-list-empty">
            <span className="material-icons">chat_bubble_outline</span>
            <p>目前沒有{filter === 'pinned' ? '已釘選' : filter === 'admin' ? '管理員' : filter === 'anonymous' ? '匿名' : ''}的留言</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="post-management-item">
              <PostItem 
                post={post} 
                isAdmin={true} 
                toast={toast}
              />
            </div>
          ))
        )}
      </div>

    </div>
  )
}

export default PostManagement

