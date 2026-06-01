import React, { useRef, useEffect, useState, useMemo } from 'react'
import './TimelinePanel.css'
import TimelineItem from './TimelineItem'
import TimelineRuler from './TimelineRuler'
import { updateProject } from '../../utils/projectUpdater'
import { triggerCompanionButton } from '../../utils/fireCompanionEvents'

const TOTAL_DURATION = 300
const TRACKS = [
  { name: 'Camera' },
  { name: 'Graphics' },
  { name: 'Lighting' },
  { name: 'Pyro' },
  { name: 'Video' },
  { name: 'Audio' },
  { name: 'Other' },
]

function TimelinePanel({ project, selectedSequenceIndex, isSidebarVisible, isPlaying, isResetPlayback }) {
  const [items, setItems] = useState([])
  const [secondsScale, setSecondsScale] = useState(100)
  const draggingItemRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const [scrubberTime, setScrubberTime] = useState(-0.01)
  const scrubberRef = useRef(null)
  const isDraggingScrubber = useRef(false)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [snapInterval, setSnapInterval] = useState(0.1)
  const [scrollX, setScrollX] = useState(0)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const triggeredItems = useRef(new Set());
  const [flashTracks, setFlashTracks] = useState({});

  const playInterval = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      const startTime = performance.now();
      const startScrubber = scrubberTime;

      playInterval.current = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        const nextTime = startScrubber + elapsed;

        if (nextTime >= TOTAL_DURATION) {
          setScrubberTime(TOTAL_DURATION);
          setIsPlaying(false);
        } else {
          setScrubberTime(nextTime);
        }
      }, 16);
    } else {
      clearInterval(playInterval.current);
    }

    return () => clearInterval(playInterval.current);
  }, [isPlaying]);

  const triggerTrackEffect = (trackIndex, color) => {
    setFlashTracks(prev => ({ ...prev, [trackIndex]: color }));

    setTimeout(() => {
      setFlashTracks(prev => {
        const next = { ...prev };
        delete next[trackIndex];
        return next;
      });
    }, 175);
  };

  useEffect(() => {
    triggeredItems.current.clear();
  }, [selectedSequenceIndex, scrubberTime === 0]);

  useEffect(() => {
    if (isResetPlayback) {
      setScrubberTime(-0.01);
    }
  }, [isResetPlayback])

  useEffect(() => {
    if (!isPlaying) return;

    items.forEach(item => {
      const isInside = scrubberTime >= item.start && scrubberTime < item.end;

      if (isInside && !triggeredItems.current.has(item.id)) {
        triggeredItems.current.add(item.id);

        triggerCompanionButton(item.pageIndex, item.row, item.col, project?.companion?.connection);
        triggerTrackEffect(item.track, item.color);

      } else if (!isInside) {
        triggeredItems.current.delete(item.id);
      }
    });
  }, [scrubberTime, items, isPlaying]);

  const snap = (value) => {
    if (!snapEnabled) return value
    return Math.round(value / snapInterval) * snapInterval
  }

  useEffect(() => {
    if (scrubberRef.current) {
      scrubberRef.current.style.transform = `translateX(${scrubberTime * secondsScale}px)`;
    }
  }, [scrubberTime, secondsScale]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      const step = e.shiftKey ? 1 : 0.1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setScrubberTime(prev => Math.max(0, prev - step));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setScrubberTime(prev => Math.min(TOTAL_DURATION, prev + step));
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId !== null) {
          setItems(prev => prev.filter(item => item.id !== selectedItemId));
          handleUpdate(items.filter(item => item.id !== selectedItemId));

          setSelectedItemId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, secondsScale]);

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const handleScroll = () => setScrollX(container.scrollLeft)
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) setContainerWidth(entry.contentRect.width)
    })
    container.addEventListener('scroll', handleScroll, { passive: true })
    resizeObserver.observe(container)
    setScrollX(container.scrollLeft)
    setContainerWidth(container.clientWidth)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [])

  const visibleStart = scrollX / secondsScale
  const visibleEnd = (scrollX + containerWidth) / secondsScale

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const absoluteX = mouseX + container.scrollLeft
        const timeAtMouse = absoluteX / secondsScale
        const zoomFactor = 1.15
        let newScale = e.deltaY < 0 ? secondsScale * zoomFactor : secondsScale / zoomFactor
        newScale = Math.max(30, Math.min(newScale, 500))
        setSecondsScale(newScale)
        const newAbsoluteX = timeAtMouse * newScale
        container.scrollLeft = newAbsoluteX - mouseX
        setScrollX(container.scrollLeft)
      }
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [secondsScale])

  const getValidPosition = (targetStart, trackIndex, draggingIdx) => {
    const draggingItem = draggingIdx !== null ? items[draggingIdx] : null
    const duration = draggingItem ? (draggingItem.end - draggingItem.start) : 1
    const trackItems = items.filter((i, idx) => i.track === trackIndex && idx !== draggingIdx)
    const isOverlap = (s) => trackItems.some(i => s < i.end && (s + duration) > i.start)
    const baseStart = Math.max(0, targetStart)
    if (!isOverlap(baseStart)) return baseStart
    const collided = trackItems.find(i => baseStart < i.end && (baseStart + duration) > i.start)
    if (!collided) return null
    const snapLeft = collided.start - duration
    const snapRight = collided.end
    const leftValid = snapLeft >= 0 && !isOverlap(snapLeft)
    const rightValid = !isOverlap(snapRight)
    if (leftValid && rightValid) return Math.abs(baseStart - snapLeft) <= Math.abs(baseStart - snapRight) ? snapLeft : snapRight
    if (leftValid) return snapLeft
    if (rightValid) return snapRight
    return null
  }

  const handleDragOver = (event, trackIndex) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    if (draggingItemRef.current !== null) return
    const previewEl = event.currentTarget.querySelector('.timeline-item-preview')
    if (!previewEl) return
    const duration = 1
    const itemWidth = duration * secondsScale
    const rect = event.currentTarget.getBoundingClientRect()
    const pixelX = event.clientX - rect.left - (itemWidth / 2)
    const exactSeconds = Math.max(0, pixelX / secondsScale)
    const snappedSeconds = snap(exactSeconds)
    const finalSeconds = getValidPosition(snapEnabled ? snappedSeconds : exactSeconds, trackIndex, null)
    previewEl.style.display = 'block'
    previewEl.style.width = `${itemWidth}px`
    const pixelOffset = (finalSeconds ?? (snapEnabled ? snappedSeconds : exactSeconds)) * secondsScale
    previewEl.style.transform = `translate3d(${pixelOffset}px, 0, 0)`
    if (finalSeconds === null) previewEl.classList.add('invalid')
    else previewEl.classList.remove('invalid')
  }

  const handleDragLeave = (event) => {
    const previewEl = event.currentTarget.querySelector('.timeline-item-preview')
    if (previewEl) {
      previewEl.style.display = 'none'
      previewEl.classList.remove('invalid')
    }
  }

  const handleDrop = (event, trackIndex) => {
    event.preventDefault()
    const previewEl = event.currentTarget.querySelector('.timeline-item-preview')
    if (previewEl) {
      previewEl.style.display = 'none'
      previewEl.classList.remove('invalid')
    }
    if (draggingItemRef.current !== null) return
    const duration = 1
    const rect = event.currentTarget.getBoundingClientRect()
    const pixelX = event.clientX - rect.left - ((duration * secondsScale) / 2)
    const exactSeconds = Math.max(0, pixelX / secondsScale)
    const finalSeconds = getValidPosition(snapEnabled ? snap(exactSeconds) : exactSeconds, trackIndex, null)
    if (finalSeconds === null) return
    const data = event.dataTransfer.getData('application/json')
    if (!data) return
    const parsedData = JSON.parse(data)

    const newItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      color: parsedData.color,
      row: parsedData.row,
      col: parsedData.col,
      pageIndex: parsedData.pageIndex,
      description: "description...",
      start: finalSeconds,
      end: finalSeconds + 1,
      track: trackIndex
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    handleUpdate(newItems);
  }

  const handleSelectItem = (id) => {
    setSelectedItemId(id || null)
  }

  const handleUpdate = (updatedItems) => {
    updateProject(project.name, (currentProject) => ({
      ...currentProject,
      sequences: currentProject.sequences.map((seq, idx) => {
        if (idx !== selectedSequenceIndex) return seq;
        return { ...seq, items: updatedItems };
      })
    }));
  };

  useEffect(() => {
    if (project?.sequences?.[selectedSequenceIndex]?.items) {
      setItems(project.sequences[selectedSequenceIndex].items);
    } else {
      setItems([]);
    }
  }, [project, selectedSequenceIndex]);

  const timelineWidth = `${(TOTAL_DURATION + 1) * secondsScale}px`
  const visibleItemsFiltered = useMemo(() => {
    const startLimit = Math.max(0, visibleStart - 2)
    const endLimit = visibleEnd + 2
    return items.map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter(item => item.end >= startLimit && item.start <= endLimit)
  }, [items, visibleStart, visibleEnd])

  return (
    <div className="timeline-panel">
      <div className="timeline-labels">
        {TRACKS.map((track, index) => {
          const isActive = flashTracks[index];
          return (
            <div
              key={track.name}
              className={`timeline-label-item ${isActive ? 'active' : ''}`}
              style={isActive ? { backgroundColor: isActive, color: '#fff', transition: 'background 0.2s' } : {}}
            >
              {track.name}
            </div>
          );
        })}
      </div>

      <div className="timeline-scroll-container" ref={scrollContainerRef}>
        <div
          className="timeline-scrubber"
          ref={scrubberRef}
          style={{ top: '0px' }}
        />

        <TimelineRuler
          totalDuration={TOTAL_DURATION}
          secondsScale={secondsScale}
          visibleStart={visibleStart}
          visibleEnd={visibleEnd}
          snapEnabled={snapEnabled}
          snapInterval={snapInterval}
          onSnapEnabledChange={setSnapEnabled}
          onSnapIntervalChange={setSnapInterval}
        />
        {TRACKS.map((track, index) => (
          <div
            key={index}
            className={`timeline-track ${index % 2 !== 0 ? 'odd' : ''}`}
            style={{ width: timelineWidth }}
            data-track-index={index}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="timeline-item-preview" style={{ display: 'none' }} />
            {visibleItemsFiltered
              .filter(item => item.track === index)
              .map((item) => (
                <TimelineItem
                  key={item.id}
                  index={item.originalIndex}
                  color={item.color}
                  description={item.description}
                  row={item.row}
                  col={item.col}
                  pageIndex={item.pageIndex}
                  start={item.start}
                  end={item.end}
                  project={project}
                  secondsScale={secondsScale}
                  snapEnabled={snapEnabled}
                  snapInterval={snapInterval}
                  trackIndex={index}
                  items={items}
                  onStartDrag={(idx) => { draggingItemRef.current = idx }}
                  onEndDrag={() => { draggingItemRef.current = null }}
                  onUpdate={(targetIdx, updatedFields) => {
                    const newItems = items.map((it, i) => i === targetIdx ? { ...it, ...updatedFields } : it);
                    setItems(newItems);
                    handleUpdate(newItems);
                  }}
                  id={item.id}
                  onSelect={handleSelectItem}
                  selected={selectedItemId !== null && selectedItemId === item.id}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TimelinePanel