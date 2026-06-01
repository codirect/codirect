import React from 'react'

function HorizontalSeparator({ style }) {
  return (
    <div style={{
      width: '100%',
      height: '1px',
      backgroundColor: '#444444',
      ...style
    }} />
  )
}

export default HorizontalSeparator