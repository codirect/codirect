import React from 'react'
import "./TOSFooter.css"

function TOSFooter() {
  return (
    <div className="terms-container">
      <p className="terms-text">
        By using coDIRECT, you agree to our{' '}
        <a href="/terms-of-use" className="terms-link">Terms of Use</a>
        {' '}and{' '}
        <a href="/privacy-policy" className="terms-link">Privacy Policy</a>.
      </p>
    </div>
  )
}

export default TOSFooter