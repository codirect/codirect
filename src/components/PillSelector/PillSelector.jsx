import React, { useState, useRef, useEffect } from 'react'
import './PillSelector.css'

export default function PillSelector({ options = [], initialSelectedIndex = 0, onChange }) {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex)
  const [highlightStyle, setHighlightStyle] = useState({})
  const buttonsRef = useRef([])

  useEffect(() => {
    setSelectedIndex(initialSelectedIndex)
  }, [initialSelectedIndex])

  useEffect(() => {
    const activeButton = buttonsRef.current[selectedIndex]
    if (activeButton) {
      const next = {
        left: `${activeButton.offsetLeft}px`,
        width: `${activeButton.offsetWidth}px`,
      }
      setHighlightStyle((prev) => (
        prev.left === next.left && prev.width === next.width ? prev : next
      ))
    }
  }, [selectedIndex, options.length])

  const handleSelect = (index) => {
    setSelectedIndex(index)
    if (onChange) onChange(index, options[index])
  }

  return (
    <div className='pill-selector'>
      <div className='pill-highlight' style={highlightStyle} />
      
      {options.map((option, index) => (
        <button
          key={index}
          ref={(el) => (buttonsRef.current[index] = el)}
          type='button'
          className={`pill-option ${index === selectedIndex ? 'is-selected' : ''}`}
          onClick={() => handleSelect(index)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}