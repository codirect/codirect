import React from 'react'
import "./BetaBanner.css"

function BetaBanner() {
  return (
    <div className='beta-banner-container'>
      <p className='feedback-prompt'>
        coDIRECT is currently in beta. {' '}
        <a 
          href="https://tally.so/r/rjgEeR" 
          target="_blank" 
          rel="noopener noreferrer"
          className="feedback-link"
        >
          Report an issue
        </a>
      </p>
    </div>
  )
}

export default BetaBanner