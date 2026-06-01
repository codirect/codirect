import React from 'react'
import './Sidebar.css'

function Sidebar({ children, isVisible = true }) {
  return (
    <div className={`sidebar ${isVisible ? 'is-visible' : 'is-hidden'}`}>
      {children}
    </div>
  )
}

export default Sidebar