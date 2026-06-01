import React from 'react'
import './PillButton.css'

export default function PillButton({ background_style, children, onClick }) {
  return (
    <div className='pill-button-bg' style={background_style}>
      <button className='pill-button-button' type='button' onClick={onClick}>
        {children}
      </button>
    </div>
  )
}