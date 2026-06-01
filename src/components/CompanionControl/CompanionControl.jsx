import React from 'react'
import './CompanionControl.css'
import { getStyleForIndex } from '../../utils/colorIndex'

function CompanionControl({ name, index, variant = 'list', draggable = false, onDragStart }) {
  const style = getStyleForIndex(index)
  const isCard = variant === 'card'

  return (
    <div
      className={`companion-control ${isCard ? 'is-card' : ''}`.trim()}
      draggable={draggable}
      onDragStart={onDragStart}
      
    >
      <div className='companion-control-color' style={{ backgroundColor: style.backgroundColor }}>
        <p className='companion-control-number' style={{ textShadow: style.textShadow }}>
          {index + 1}
        </p>
      </div>
      <p className='companion-control-name'>
        {name}
      </p>
    </div>
  )   
}

export default CompanionControl