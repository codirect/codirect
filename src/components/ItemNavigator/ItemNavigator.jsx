import React, { useState, useEffect } from 'react'
import './ItemNavigator.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ItemNavigator({ items = [], loading, onItemSelect, width, selectedIndex, onClick }) {
  const itemCount = items?.length ?? 0
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [itemCount])

  useEffect(() => {
    if (typeof selectedIndex === 'number') {
      const desired = Math.max(0, Math.min(itemCount - 1, Math.floor(selectedIndex)))
      setIndex(desired)
    }
  }, [selectedIndex, itemCount])

  const getViewportWidth = () => {
    if (typeof width === 'number') return `${width}px`
    return width ?? '120px'
  }

  const isLoading = loading ?? itemCount === 0
  const canNav = !isLoading && itemCount > 1

  const handlePrevious = () => {
    if (!canNav) return
    setIndex(i => {
      const next = (i - 1 + itemCount) % itemCount
      if (onItemSelect) onItemSelect(next, items[next])
      return next
    })
  }

  const handleNext = () => {
    if (!canNav) return
    setIndex(i => {
      const next = (i + 1) % itemCount
      if (onItemSelect) onItemSelect(next, items[next])
      return next
    })
  }

  return (
    <div
      className='item-navigator'
      style={{
        '--navigator-viewport-width': getViewportWidth(),
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <button className='button' type='button' disabled={!canNav} onClick={handlePrevious}>
        <ChevronLeft size={19} style={{ transform: 'translateX(-1px)' }} />
      </button>

      {isLoading ? (
        <div className='item-skeleton' aria-label='Loading items' />
      ) : (
        <div className='item-viewport' aria-live='polite'>
          <div className='item-center'>
            <p
              className={`item ${onClick ? 'is-clickable' : ''}`.trim()}
              onClick={() => onClick && onClick()}
            >
              {items[index]}
            </p>
          </div>
        </div>
      )}

      <button className='button' type='button' disabled={!canNav} onClick={handleNext}>
        <ChevronRight size={19} style={{ transform: 'translateX(1px)' }} />
      </button>
    </div>
  )
}
