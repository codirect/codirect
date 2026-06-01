import React from 'react'
import './Button.css'

function Button({ children, onClick, style }) {
  return (
    <button className='button' onClick={onClick} style={style}>
      {children}
    </button>
  )
}

export default Button