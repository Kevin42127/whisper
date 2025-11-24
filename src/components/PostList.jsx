import { useState, useEffect, useRef } from 'react'
import PostItem from './PostItem'

function PostList({ posts, isAdmin, toast, searchTerm = '' }) {
  const [displayedPosts, setDisplayedPosts] = useState([])
  const [displayCount, setDisplayCount] = useState(10)
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)

  useEffect(() => {
    let filtered = posts

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = posts.filter(post => 
        post.content.toLowerCase().includes(term)
      )
    }

    setDisplayedPosts(filtered.slice(0, displayCount))
  }, [posts, searchTerm, displayCount])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedPosts.length < posts.length) {
          setDisplayCount(prev => prev + 10)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [displayedPosts.length, posts.length])

  if (posts.length === 0) {
    return (
      <div className="post-list-empty">
        <span className="material-icons">chat_bubble_outline</span>
        <p>還沒有任何留言</p>
      </div>
    )
  }

  if (searchTerm.trim() && displayedPosts.length === 0) {
    return (
      <div className="post-list-empty">
        <span className="material-icons">search_off</span>
        <p>找不到符合「{searchTerm}」的留言</p>
      </div>
    )
  }

  return (
    <>
      <div className="post-list">
        {displayedPosts.map(post => (
          <PostItem key={post.id} post={post} isAdmin={isAdmin} toast={toast} searchTerm={searchTerm} />
        ))}
      </div>
      {displayedPosts.length < posts.length && !searchTerm.trim() && (
        <div ref={loadMoreRef} className="load-more-indicator">
          <span className="material-icons">expand_more</span>
          <p>載入更多...</p>
        </div>
      )}
      {searchTerm.trim() && displayedPosts.length > 0 && (
        <div className="search-results-info">
          <p>找到 {displayedPosts.length} 則符合的留言</p>
        </div>
      )}
    </>
  )
}

export default PostList

