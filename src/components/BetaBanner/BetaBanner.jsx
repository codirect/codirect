import React from 'react'
import "./BetaBanner.css"

function BetaBanner() {
  const repeatedText = Array(16).fill("BETA");

  return (
    <div className='beta-banner-container'>
      {/* Moving Marquee Background */}
      <div className='beta-marquee'>
        <div className='marquee-track'>
          {repeatedText.map((text, index) => (
            <span key={index} className='marquee-text'>{text}</span>
          ))}
          {/* Duplicated track to create a seamless infinite loop gapless finish */}
          {repeatedText.map((text, index) => (
            <span key={`dup-${index}`} className='marquee-text'>{text}</span>
          ))}
        </div>
      </div>

      {/* Foreground Content: Interactive Form Link */}
      <div className='beta-content'>
        <p className='feedback-prompt'>
          Experiencing issues?{' '}
          <a 
            href="https://forms.google.com/your-form-id-here" 
            target="_blank" 
            rel="noopener noreferrer"
            className="feedback-link"
          >
            Report a bug
          </a>
        </p>
      </div>
    </div>
  )
}

export default BetaBanner