import PostItem from './PostItem'

function PostList({ posts, isAdmin, toast }) {
  if (posts.length === 0) {
    return (
      <div className="post-list-empty">
        <span className="material-icons">chat_bubble_outline</span>
        <p>還沒有任何留言</p>
      </div>
    )
  }

  return (
    <div className="post-list">
      {posts.map(post => (
        <PostItem key={post.id} post={post} isAdmin={isAdmin} toast={toast} />
      ))}
    </div>
  )
}

export default PostList

