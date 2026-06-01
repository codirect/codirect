import React from 'react'
import './Expand.css'

function Expand({ title = 'Details', defaultOpen = false, children, className = '' }) {
  const [open, setOpen] = React.useState(defaultOpen)
  const contentId = React.useId()

  return (
    <div className={`expand ${open ? 'open' : ''} ${className}`.trim()}>
      <button
        type='button'
        className='expand-toggle'
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className='expand-caret' aria-hidden='true' />
        <span className='expand-title'>{title}</span>
      </button>

      <div className='expand-content' id={contentId}>
        <div className='expand-inner'>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Expand