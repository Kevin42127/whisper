import { useState } from 'react'

function SearchBar({ onSearch, placeholder = '搜尋留言...' }) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch(value)
  }

  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <span className="material-icons search-icon">search</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleChange}
        />
        {searchTerm && (
          <button
            className="search-clear"
            onClick={handleClear}
            title="清除搜尋"
          >
            <span className="material-icons">close</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchBar

