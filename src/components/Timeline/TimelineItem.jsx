import React, { useRef } from 'react'
import './TimelineItem.css'

function TimelineItem({ color, row, col, pageIndex, description, start, end, id, index, secondsScale, trackIndex, items, onStartDrag, onEndDrag, onUpdate, snapEnabled, snapInterval, selected, onSelect, project }) {
  const itemRef = useRef(null)
  const dragMode = useRef(null)

  const startX = useRef(0)
  const startY = useRef(0)
  const initialStart = useRef(0)
  const initialEnd = useRef(0)

  const currentStart = useRef(start)
  const currentTrack = useRef(trackIndex)

  const scrollContainer = useRef(null)
  const initialScrollLeft = useRef(0)
  const lastClientX = useRef(0)
  const lastClientY = useRef(0)

  const snap = (value) => {
    if (!snapEnabled) return value
    return Math.round(value / snapInterval) * snapInterval
  }

  const getTitleForControl = (pageIndex, col, row) => {
    const pages = project?.companion?.companionConfig?.pages || {};
    const pageIds = Object.keys(pages); // ["1", "2"]

    const pageKey = pageIds[pageIndex];
    if (!pageKey) return 'Untitled (No Page)';

    const pageData = pages[pageKey];
    if (!pageData?.controls) return 'Untitled (No Controls)';

    const control = pageData.controls[String(col)]?.[String(row)];
    if (!control) return 'Empty Slot';

    return control?.style?.text || 'Untitled';
  };

  const handleMouseDown = (e, mode) => {
    e.stopPropagation()
    e.preventDefault()

    dragMode.current = mode
    startX.current = e.clientX
    startY.current = e.clientY
    initialStart.current = start
    initialEnd.current = end
    currentStart.current = start
    currentTrack.current = trackIndex

    scrollContainer.current = itemRef.current?.closest('.timeline-scroll-container')
    initialScrollLeft.current = scrollContainer.current ? scrollContainer.current.scrollLeft : 0
    lastClientX.current = e.clientX
    lastClientY.current = e.clientY

    if (itemRef.current) {
      itemRef.current.classList.add('dragging')
    }

    if (mode === 'left' || mode === 'right') {
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    } else if (mode === 'move') {
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    }

    if (mode === 'move' && onStartDrag) {
      onStartDrag(index)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    if (scrollContainer.current) {
      scrollContainer.current.addEventListener('scroll', handleContainerScroll, { passive: true })
    }
  }

  const calculatePositions = (clientX, clientY) => {
    if (!dragMode.current || !itemRef.current) return

    lastClientX.current = clientX
    lastClientY.current = clientY

    const currentScrollLeft = scrollContainer.current ? scrollContainer.current.scrollLeft : 0
    const deltaScrollX = currentScrollLeft - initialScrollLeft.current

    const deltaX = clientX - startX.current + deltaScrollX
    const deltaSeconds = deltaX / secondsScale
    const duration = initialEnd.current - initialStart.current

    if (dragMode.current === 'left') {
      let newStart = snap(initialStart.current + deltaSeconds)
      if (newStart > initialEnd.current - 0.1) newStart = initialEnd.current - 0.1

      const leftNeighbor = items
        .filter((item, i) => item.track === trackIndex && i !== index && item.end <= initialStart.current)
        .reduce((max, item) => item.end > max ? item.end : max, 0)

      if (newStart < leftNeighbor) newStart = leftNeighbor

      currentStart.current = newStart
      itemRef.current.style.left = `${newStart * secondsScale}px`
      itemRef.current.style.width = `${(initialEnd.current - newStart) * secondsScale}px`
    }

    else if (dragMode.current === 'right') {
      let newEnd = snap(initialEnd.current + deltaSeconds)
      if (newEnd < initialStart.current + 0.1) newEnd = initialStart.current + 0.1

      const rightNeighbor = items
        .filter((item, i) => item.track === trackIndex && i !== index && item.start >= initialEnd.current)
        .reduce((min, item) => item.start < min ? item.start : min, Infinity)

      if (newEnd > rightNeighbor) newEnd = rightNeighbor

      itemRef.current.style.width = `${(newEnd - initialStart.current) * secondsScale}px`
      currentStart.current = initialStart.current
    }

    else if (dragMode.current === 'move') {
      itemRef.current.style.pointerEvents = 'none'
      const elementUnderMouse = document.elementFromPoint(clientX, clientY)
      itemRef.current.style.pointerEvents = 'auto'

      const trackEl = elementUnderMouse?.closest('[data-track-index]')
      let targetTrack = currentTrack.current
      if (trackEl) {
        targetTrack = parseInt(trackEl.getAttribute('data-track-index'), 10)
      }

      let desiredStart = initialStart.current + deltaSeconds
      if (desiredStart < 0) desiredStart = 0

      desiredStart = snap(desiredStart)
      if (desiredStart < 0) desiredStart = 0

      const targetTrackItems = items
        .filter((item, i) => item.track === targetTrack && i !== index)
        .sort((a, b) => a.start - b.start)

      const validGaps = []

      let firstItemStart = targetTrackItems.length > 0 ? targetTrackItems[0].start : Infinity
      if (firstItemStart >= duration) {
        validGaps.push({ start: 0, end: firstItemStart })
      }

      for (let i = 0; i < targetTrackItems.length - 1; i++) {
        let gapStart = targetTrackItems[i].end
        let gapEnd = targetTrackItems[i + 1].start
        if (gapEnd - gapStart >= duration) {
          validGaps.push({ start: gapStart, end: gapEnd })
        }
      }

      if (targetTrackItems.length > 0) {
        validGaps.push({ start: targetTrackItems[targetTrackItems.length - 1].end, end: Infinity })
      } else {
        validGaps.push({ start: 0, end: Infinity })
      }

      let bestStart = null
      let minDistance = Infinity

      validGaps.forEach(gap => {
        let clampedStart = Math.max(gap.start, Math.min(desiredStart, gap.end - duration))
        if (snapEnabled) {
          const snapped = snap(clampedStart)

          if (snapped >= gap.start && snapped + duration <= gap.end) {
            clampedStart = snapped
          }
        }

        if (clampedStart >= gap.start && (clampedStart + duration) <= gap.end) {
          let distance = Math.abs(desiredStart - clampedStart)
          if (distance < minDistance) {
            minDistance = distance
            bestStart = clampedStart
          }
        }
      })

      if (bestStart !== null) {
        currentTrack.current = targetTrack
        currentStart.current = bestStart
      } else {
        const currentTrackItems = items
          .filter((item, i) => item.track === currentTrack.current && i !== index)
          .sort((a, b) => a.start - b.start)

        const fallbackGaps = []
        let fStart = currentTrackItems.length > 0 ? currentTrackItems[0].start : Infinity
        if (fStart >= duration) fallbackGaps.push({ start: 0, end: fStart })

        for (let i = 0; i < currentTrackItems.length - 1; i++) {
          let gapStart = currentTrackItems[i].end
          let gapEnd = currentTrackItems[i + 1].start
          if (gapEnd - gapStart >= duration) fallbackGaps.push({ start: gapStart, end: gapEnd })
        }
        if (currentTrackItems.length > 0) {
          fallbackGaps.push({ start: currentTrackItems[currentTrackItems.length - 1].end, end: Infinity })
        } else {
          fallbackGaps.push({ start: 0, end: Infinity })
        }

        let fallbackBestStart = currentStart.current
        let fallbackMinDist = Infinity
        fallbackGaps.forEach(gap => {
          let clampedStart = Math.max(gap.start, Math.min(desiredStart, gap.end - duration))
          if (clampedStart >= gap.start && (clampedStart + duration) <= gap.end) {
            let distance = Math.abs(desiredStart - clampedStart)
            if (distance < fallbackMinDist) {
              fallbackMinDist = distance
              fallbackBestStart = clampedStart
            }
          }
        })
        currentStart.current = fallbackBestStart
      }

      const snappedDeltaX = (currentStart.current - initialStart.current) * secondsScale
      const deltaY = (currentTrack.current - trackIndex) * 64

      itemRef.current.style.transform = `translate3d(${snappedDeltaX}px, ${deltaY}px, 0)`
    }
  }

  const handleMouseMove = (e) => {
    calculatePositions(e.clientX, e.clientY)
  }

  const handleContainerScroll = () => {
    calculatePositions(lastClientX.current, lastClientY.current)
  }

  const handleMouseUp = () => {
    if (!dragMode.current) return

    if (itemRef.current) {
      itemRef.current.classList.remove('dragging')
      itemRef.current.style.transform = ''
    }

    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    if (dragMode.current === 'move' && onEndDrag) {
      onEndDrag()
    }

    const duration = initialEnd.current - initialStart.current

    if (dragMode.current === 'move') {
      onUpdate(index, {
        start: currentStart.current,
        end: currentStart.current + duration,
        track: currentTrack.current
      })
    } else if (dragMode.current === 'left') {
      onUpdate(index, { start: currentStart.current })
    } else if (dragMode.current === 'right') {
      const computedWidthSeconds = parseFloat(itemRef.current.style.width) / secondsScale
      onUpdate(index, { end: initialStart.current + computedWidthSeconds })
    }

    dragMode.current = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    if (scrollContainer.current) {
      scrollContainer.current.removeEventListener('scroll', handleContainerScroll)
    }
  }

  return (
    <div
      ref={itemRef}
      className={`timeline-item ${selected ? 'selected' : ''}`}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      style={{
        backgroundColor: color,
        left: `${start * secondsScale}px`,
        width: `${(end - start) * secondsScale}px`
      }}
    >
      <div className="resize-handle handle-left" onMouseDown={(e) => handleMouseDown(e, 'left')} />
      <p className="timeline-item-name">{getTitleForControl(pageIndex, col, row)}</p>
      <p className="timeline-item-description">{description}</p>
      <div className="resize-handle handle-right" onMouseDown={(e) => handleMouseDown(e, 'right')} />
    </div>
  )
}

export default TimelineItem