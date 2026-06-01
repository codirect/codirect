import React from 'react'
import './StatusPill.css'

export default function StatusPill({ status, onClick, children }) {
  return (
    <div className={`status-pill ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <p style={{ cursor: onClick ? 'pointer' : 'default' }}>
        {children}
      </p>
      <div className={`status-indicator ${status}`} />
    </div>
  )
}