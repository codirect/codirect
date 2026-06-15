import React from 'react'
import "./TOS.css"

function TOS() {
  return (
    <div className="terms-container">
      <p className="terms-text">
        By using coDIRECT, you agree to our{' '}
        <a href="/terms" className="terms-link">Terms of Use</a>
        {' '}and{' '}
        <a href="/privacy" className="terms-link">Privacy Policy</a>.
      </p>
    </div>
  )
}

export default TOS