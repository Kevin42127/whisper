import { useMemo } from 'react'
import PostItem from './PostItem'

function PostList({ posts, isAdmin, toast, searchTerm = '' }) {
  const hasSearch = searchTerm.trim().length > 0

  const filteredPosts = useMemo(() => {
    if (!hasSearch) {
      return posts
    }
    const term = searchTerm.toLowerCase()
    return posts.filter(post => post.content.toLowerCase().includes(term))
  }, [posts, hasSearch, searchTerm])

  if (posts.length === 0) {
    return (
      <div className="post-list-empty">
        <span className="material-icons">chat_bubble_outline</span>
        <p>還沒有任何留言</p>
      </div>
    )
  }

  if (hasSearch && filteredPosts.length === 0) {
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
        {filteredPosts.map(post => (
          <PostItem
            key={post.id}
            post={post}
            isAdmin={isAdmin}
            toast={toast}
            searchTerm={searchTerm}
          />
        ))}
      </div>
      {hasSearch && filteredPosts.length > 0 && (
        <div className="search-results-info">
          <p>找到 {filteredPosts.length} 則符合的留言</p>
        </div>
      )}
    </>
  )
}

export default PostList

