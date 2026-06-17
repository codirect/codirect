import React, { useRef, useEffect, useState, useMemo, useLayoutEffect, useCallback } from 'react'
import './TimelinePanel.css'
import TimelineItem from './TimelineItem'
import TimelineRuler from './TimelineRuler'
import { updateProject } from '../../utils/projectUpdater'
import { triggerCompanionButton } from '../../utils/fireCompanionEvents'
import { createPlaybackEngine } from '../../utils/playbackEngine'
import AudioReferenceLabel from './AudioReference/AudioReferenceLabel'
import AudioReferenceItem from './AudioReference/AudioReferenceItem'
import { saveAudio, getAudio, deleteAudio } from '../../utils/audioDB'
import { MagnetIcon, Trash2Icon, TrashIcon } from 'lucide-react'

const TOTAL_DURATION = 300

function TimelinePanel({ project, selectedSequenceIndex, isSidebarVisible, isPlaying, setIsPlaying, isResetPlayback, setPlaybackTime, isHoldingTriggers, canEdit }) {
  const [items, setItems] = useState([])
  const [secondsScale, setSecondsScale] = useState(100)
  const draggingItemRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const rulerScrollRef = useRef(null)
  const syncHScrollRef = useRef(false)
  const [scrubberTime, setScrubberTime] = useState(-0.01)
  const scrubberRef = useRef(null)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [snapInterval, setSnapInterval] = useState(0.1)
  const [scrollX, setScrollX] = useState(0)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [playheadViewTime, setPlayheadViewTime] = useState(0)
  const [selectedItemId, setSelectedItemId] = useState(null)

  const scrubberTimeRef = useRef(scrubberTime);
  useEffect(() => {
    scrubberTimeRef.current = scrubberTime;
  }, [scrubberTime]);

  const playbackEngineRef = useRef(null);
  const lastClockCentiseconds = useRef(-1);
  const lastVirtScrollUpdate = useRef(0);
  const timelinePanelRef = useRef(null);

  const [audioReferenceData, setAudioReferenceData] = useState(null); // { waveform, duration, url, fileName }
  const [audioRefIsPlaying, setAudioRefIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const audioElementRef = useRef(null);
  const audioUrlRef = useRef(null);

  const [tracks, setTracks] = useState([]);
  // Load tracks from project
  useEffect(() => {
    const tracksData = project?.tracks || [];
    setTracks(tracksData);
  }, [project])

  // Update tracks in project when they change
  const updateTracks = (updatedTracks) => {
    updateProject(project.name, (currentProject) => ({ ...currentProject, tracks: updatedTracks }));
  }

  const isPlayingRef = useRef(isPlaying);
  const canEditRef = useRef(canEdit);
  const secondsScaleRef = useRef(secondsScale);
  const itemsRef = useRef(items);
  const isHoldingTriggersRef = useRef(isHoldingTriggers);
  const projectRef = useRef(project);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { canEditRef.current = canEdit; }, [canEdit]);
  useEffect(() => { secondsScaleRef.current = secondsScale; }, [secondsScale]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { isHoldingTriggersRef.current = isHoldingTriggers; }, [isHoldingTriggers]);
  useEffect(() => { projectRef.current = project; }, [project]);

  const updateScrubberDOM = useCallback((time) => {
    if (!scrubberRef.current) return;
    const scrubberX = Math.round(time * secondsScaleRef.current);
    scrubberRef.current.style.transform = `translateX(${scrubberX}px)`;
  }, []);

  const dispatchClockUpdate = useCallback((time) => {
    const centiseconds = Math.floor(Math.max(0, time) * 100);
    if (centiseconds === lastClockCentiseconds.current) return;
    lastClockCentiseconds.current = centiseconds;
    window.dispatchEvent(new CustomEvent('playbackTimeUpdate', { detail: { time } }));
  }, []);

  const triggerTrackEffect = useCallback((trackIndex, color) => {
    const el = timelinePanelRef.current?.querySelector(`.timeline-label-item[data-track-index="${trackIndex}"]`);
    if (!el) return;
    el.style.backgroundColor = color;
    el.style.color = '#fff';
    setTimeout(() => {
      el.style.backgroundColor = '';
      el.style.color = '';
    }, 175);
  }, []);

  const fireCue = useCallback((cue, companionConnection) => {
    triggerCompanionButton(cue.pageIndex, cue.row, cue.col, companionConnection);
    triggerTrackEffect(cue.track, cue.color);
  }, [triggerTrackEffect]);

  const handlePlaybackFrame = useCallback((time) => {
    scrubberTimeRef.current = time;
    updateScrubberDOM(time);

    const container = scrollContainerRef.current;
    if (container) {
      const scrubberX = Math.round(time * secondsScaleRef.current);
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      const targetScroll = Math.round(scrubberX - container.clientWidth / 2);
      const scrollLeft = Math.min(maxScroll, Math.max(0, targetScroll));
      container.scrollLeft = scrollLeft;
      if (rulerScrollRef.current) rulerScrollRef.current.scrollLeft = scrollLeft;

      const now = performance.now();
      if (now - lastVirtScrollUpdate.current > 150) {
        lastVirtScrollUpdate.current = now;
        setScrollX(container.scrollLeft);
        setPlayheadViewTime(time);
      }
    }

    dispatchClockUpdate(time);
  }, [updateScrubberDOM, dispatchClockUpdate]);

  useLayoutEffect(() => {
    if (isPlayingRef.current) return;
    updateScrubberDOM(scrubberTime);
  }, [scrubberTime, secondsScale, updateScrubberDOM]);

  useEffect(() => {
    if (isResetPlayback) {
      scrubberTimeRef.current = -0.01;
      setScrubberTime(-0.01);
      if (typeof setPlaybackTime === 'function') setPlaybackTime(0);
      updateScrubberDOM(-0.01);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;
      if (rulerScrollRef.current) rulerScrollRef.current.scrollLeft = 0;
      lastClockCentiseconds.current = -1;
      dispatchClockUpdate(0);
      playbackEngineRef.current?.stop(-0.01);
    }
  }, [isResetPlayback, setPlaybackTime, updateScrubberDOM, dispatchClockUpdate]);

  useEffect(() => {
    if (isPlaying) return;
    const t = scrubberTimeRef.current;
    setScrubberTime(t);
    if (typeof setPlaybackTime === 'function') setPlaybackTime(Math.max(0, t));
    lastClockCentiseconds.current = -1;
    dispatchClockUpdate(Math.max(0, t));
  }, [isPlaying, setPlaybackTime, dispatchClockUpdate]);

  useEffect(() => {
    playbackEngineRef.current = createPlaybackEngine({
      totalDuration: TOTAL_DURATION,
      onFrame: handlePlaybackFrame,
      onCue: fireCue,
      onEnd: () => setIsPlaying(false),
    });
    return () => playbackEngineRef.current?.stop();
  }, [handlePlaybackFrame, fireCue, setIsPlaying]);

  useEffect(() => {
    const engine = playbackEngineRef.current;
    if (!engine) return;

    if (isPlaying) {
      lastClockCentiseconds.current = -1;
      lastVirtScrollUpdate.current = 0;
      setPlayheadViewTime(scrubberTimeRef.current);
      engine.clearFired();
      engine.play(
        scrubberTimeRef.current,
        itemsRef.current,
        projectRef.current?.companion?.connection,
      );
      return () => engine.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    playbackEngineRef.current?.setHold(
      isHoldingTriggers,
      itemsRef.current,
      projectRef.current?.companion?.connection,
    );
  }, [isHoldingTriggers, isPlaying]);

  const snap = (value) => { if (!snapEnabled) return value; return Math.round(value / snapInterval) * snapInterval; }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPlayingRef.current || !canEditRef.current) return;
      const step = e.shiftKey ? 1 : 0.1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); setScrubberTime(prev => Math.max(0, prev - step)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setScrubberTime(prev => Math.min(TOTAL_DURATION, prev + step)); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDeleteItem(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, secondsScale]);

  const handleDeleteItem = () => {
    if (selectedItemId !== null && canEditRef.current) {
      setItems(prev => prev.filter(item => item.id !== selectedItemId));
      handleUpdate(items.filter(item => item.id !== selectedItemId));
      setSelectedItemId(null);
    }
  }

  useEffect(() => {
    const tracksScroll = scrollContainerRef.current
    const rulerScroll = rulerScrollRef.current
    if (!tracksScroll) return

    const syncRulerToTracks = () => {
      if (!isPlayingRef.current) setScrollX(tracksScroll.scrollLeft);
      if (rulerScroll && !syncHScrollRef.current) {
        syncHScrollRef.current = true
        rulerScroll.scrollLeft = tracksScroll.scrollLeft
        syncHScrollRef.current = false
      }
    }

    const syncTracksToRuler = () => {
      if (!syncHScrollRef.current) {
        syncHScrollRef.current = true
        tracksScroll.scrollLeft = rulerScroll.scrollLeft
        if (!isPlayingRef.current) setScrollX(rulerScroll.scrollLeft)
        syncHScrollRef.current = false
      }
    }

    const resizeObserver = new ResizeObserver((entries) => { for (let entry of entries) setContainerWidth(entry.contentRect.width) })
    tracksScroll.addEventListener('scroll', syncRulerToTracks, { passive: true })
    rulerScroll?.addEventListener('scroll', syncTracksToRuler, { passive: true })
    resizeObserver.observe(tracksScroll)
    return () => {
      tracksScroll.removeEventListener('scroll', syncRulerToTracks)
      rulerScroll?.removeEventListener('scroll', syncTracksToRuler)
      resizeObserver.disconnect()
    }
  }, [])

  const viewportSeconds = containerWidth / secondsScale
  const visibleStart = isPlaying
    ? Math.max(0, playheadViewTime - viewportSeconds * 0.55 - 5)
    : scrollX / secondsScale
  const visibleEnd = isPlaying
    ? Math.min(TOTAL_DURATION + 1, playheadViewTime + viewportSeconds * 0.55 + 5)
    : (scrollX + containerWidth) / secondsScale

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
        let newScale = e.deltaY < 0 ? secondsScale * 1.15 : secondsScale / 1.15
        newScale = Math.max(30, Math.min(newScale, 500))
        setSecondsScale(newScale)
        const newScrollLeft = (timeAtMouse * newScale) - mouseX
        container.scrollLeft = newScrollLeft
        if (rulerScrollRef.current) rulerScrollRef.current.scrollLeft = newScrollLeft
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
    if (isPlayingRef.current || !canEditRef.current) return;
    event.preventDefault()
    const previewEl = event.currentTarget.querySelector('.timeline-item-preview')
    if (!previewEl) return
    const duration = 1
    const rect = event.currentTarget.getBoundingClientRect()
    const pixelX = event.clientX - rect.left - ((duration * secondsScale) / 2)
    const exactSeconds = Math.max(0, pixelX / secondsScale)
    const finalSeconds = getValidPosition(snapEnabled ? snap(exactSeconds) : exactSeconds, trackIndex, null)
    previewEl.style.display = 'block'
    previewEl.style.width = `${duration * secondsScale}px`
    previewEl.style.transform = `translate3d(${(finalSeconds ?? (snapEnabled ? snap(exactSeconds) : exactSeconds)) * secondsScale}px, 0, 0)`
    if (finalSeconds === null) previewEl.classList.add('invalid'); else previewEl.classList.remove('invalid')
  }

  const handleDragLeave = (event) => {
    const previewEl = event.currentTarget.querySelector('.timeline-item-preview')
    if (previewEl) { previewEl.style.display = 'none'; previewEl.classList.remove('invalid'); }
  }

  const handleDrop = (event, trackIndex) => {
    if (isPlayingRef.current || !canEditRef.current) return;
    event.preventDefault();

    const previewEl = event.currentTarget.querySelector('.timeline-item-preview');

    const rect = event.currentTarget.getBoundingClientRect();
    const pixelX = event.clientX - rect.left - ((1 * secondsScale) / 2);
    const exactSeconds = Math.max(0, pixelX / secondsScale);
    const finalSeconds = getValidPosition(snapEnabled ? snap(exactSeconds) : exactSeconds, trackIndex, null);

    if (finalSeconds === null) {
      if (previewEl) previewEl.style.display = 'none';
      return;
    }

    if (previewEl) previewEl.style.display = 'none';

    const data = JSON.parse(event.dataTransfer.getData('application/json'));
    const newItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      color: data.color,
      row: data.row,
      col: data.col,
      pageIndex: data.pageIndex,
      description: "description...",
      start: finalSeconds,
      end: finalSeconds + 1,
      track: trackIndex
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    handleUpdate(newItems);
  };

  const handleSelectItem = (id) => { if (isPlayingRef.current || !canEditRef.current) return; setSelectedItemId(id || null) }
  const handleUpdate = (updatedItems) => {
    updateProject(project.name, (currentProject) => ({ ...currentProject, sequences: currentProject.sequences.map((seq, idx) => idx !== selectedSequenceIndex ? seq : { ...seq, items: updatedItems }) }));
  };

  useEffect(() => {
    if (project?.sequences?.[selectedSequenceIndex]?.items) setItems(project.sequences[selectedSequenceIndex].items);
    else setItems([]);
  }, [project, selectedSequenceIndex]);

  const timelineWidth = `${(TOTAL_DURATION + 1) * secondsScale}px`
  const visibleItemsFiltered = useMemo(() => {
    const startLimit = Math.max(0, visibleStart - 2)
    const endLimit = visibleEnd + 2
    return items.map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter(item => item.end >= startLimit && item.start <= endLimit)
  }, [items, visibleStart, visibleEnd])

  // --- Audio reference: persistence load ---
  useEffect(() => {
    const seq = project?.sequences?.[selectedSequenceIndex];
    if (seq?.audioRefId) {
      setIsAudioLoading(true);
      getAudio(seq.audioRefId).then((data) => {
        if (data) {
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          const blob = new Blob([data.arrayBuffer], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;

          if (!audioElementRef.current) audioElementRef.current = new Audio();
          audioElementRef.current.pause();
          audioElementRef.current.src = url;
          audioElementRef.current.currentTime = 0;
          audioElementRef.current.volume = Math.pow(audioVolume, 2);

          setAudioReferenceData({
            waveform: data.waveform,
            duration: data.duration,
            fileName: data.fileName,
          });
          setAudioRefIsPlaying(false);
        }
      }).catch(console.error).finally(() => setIsAudioLoading(false));
    } else {
      // Clear if sequence has no audio
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
      setAudioReferenceData(null);
      setAudioRefIsPlaying(false);
    }
  }, [project?.sequences?.[selectedSequenceIndex]?.audioRefId]);

  // --- Audio reference: file load ---
  const handleSetReferenceAudioFile = useCallback(async (clearSignal) => {
    // If called with null it means "remove audio"
    if (clearSignal === null) {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
      setAudioReferenceData(null);
      setAudioRefIsPlaying(false);

      const seq = project?.sequences?.[selectedSequenceIndex];
      if (seq?.audioRefId) {
        await deleteAudio(seq.audioRefId);
        updateProject(project.name, (p) => {
          const updated = { ...p };
          if (updated.sequences?.[selectedSequenceIndex]) {
            delete updated.sequences[selectedSequenceIndex].audioRefId;
          }
          return updated;
        });
      }
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setIsAudioLoading(true);

        // Create object URL for the <audio> element (no re-encoding)
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const objectUrl = URL.createObjectURL(file);
        audioUrlRef.current = objectUrl;

        // Decode for waveform extraction
        const arrayBuffer = await file.arrayBuffer();
        const arrayBufferCopy = arrayBuffer.slice(0); // clone it before decodeAudioData detaches it
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const samples = 12000;
        const channelData = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(channelData.length / samples);
        const waveform = [];

        for (let i = 0; i < samples; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < blockSize; j++) {
            const datum = channelData[i * blockSize + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          waveform.push({ min, max });
        }

        audioContext.close();

        // Wire up the audio element
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
        }
        audioElementRef.current.pause();
        audioElementRef.current.src = objectUrl;
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.volume = Math.pow(audioVolume, 2);

        // Save to IndexedDB (using the copy that wasn't detached)
        const audioId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await saveAudio(audioId, arrayBufferCopy, audioBuffer.duration, waveform, file.name);

        // Update project sequence to hold reference
        updateProject(project.name, (p) => {
          const updated = { ...p };
          if (updated.sequences?.[selectedSequenceIndex]) {
            updated.sequences[selectedSequenceIndex].audioRefId = audioId;
          }
          return updated;
        });

        // No need to set state here because updating the project will trigger the useEffect above to load it!
        // But we can do it optimistically for immediate feedback:
        setAudioReferenceData({
          waveform,
          duration: audioBuffer.duration,
          fileName: file.name,
        });
        setAudioRefIsPlaying(false);
      } catch (err) {
        console.error("Audio processing failed:", err);
        alert("Failed to process audio file.");
      } finally {
        setIsAudioLoading(false);
      }
    };
    input.click();
  }, [project, selectedSequenceIndex]);

  // --- Audio reference: play/pause (standalone, not tied to main play) ---
  const handleAudioRefPlayPause = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    if (audioRefIsPlaying) {
      audio.pause();
      setAudioRefIsPlaying(false);
    } else {
      audio.currentTime = Math.max(0, scrubberTimeRef.current);
      audio.play().catch(() => { });
      setAudioRefIsPlaying(true);
    }
  }, [audioRefIsPlaying]);

  // Sync audio element with main timeline play state
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio || !audioReferenceData) return;

    if (isPlaying) {
      // Seek to current scrubber position and start playing
      audio.currentTime = Math.max(0, scrubberTimeRef.current);
      audio.play().catch(() => { });
      setAudioRefIsPlaying(true);
    } else {
      audio.pause();
      setAudioRefIsPlaying(false);
    }
    // Only trigger on isPlaying toggle, not every scrubberTime change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // When reset, also reset audio
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio || !isResetPlayback) return;
    audio.pause();
    audio.currentTime = 0;
    setAudioRefIsPlaying(false);
  }, [isResetPlayback]);

  // Sync volume
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = Math.pow(audioVolume, 2);
    }
  }, [audioVolume]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (audioElementRef.current) audioElementRef.current.pause();
    };
  }, []);

  return (
    <div ref={timelinePanelRef} className={`timeline-panel ${isPlaying ? 'is-playing' : ''}`}>
      <div className="timeline-header">
        <div className="timeline-header-corner" aria-hidden="true">
          <div className='timeline-controls'>
            <Trash2Icon
              className={`timeline-controls-control`}
              size={16}
              onClick={() => {
                handleDeleteItem();
              }}
            />

            <MagnetIcon
              className={`timeline-controls-control ${snapEnabled === true ? 'on' : ''}`}
              size={16}
              onClick={() => setSnapEnabled((prev) => !prev)}
            />
          </div>
        </div>
        <div className="timeline-ruler-scroll" ref={rulerScrollRef}>
          <TimelineRuler
            totalDuration={TOTAL_DURATION}
            secondsScale={secondsScale}
            visibleStart={visibleStart}
            visibleEnd={visibleEnd}
            snapEnabled={snapEnabled}
            snapInterval={snapInterval}
            onSnapEnabledChange={setSnapEnabled}
            onSnapIntervalChange={setSnapInterval}
            onClick={(e) => {
              if (isPlayingRef.current || !canEditRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pixelX = e.clientX - rect.left;
              const exactSeconds = Math.max(0, Math.min(TOTAL_DURATION, pixelX / secondsScale));
              setScrubberTime(snapEnabled ? snap(exactSeconds) : exactSeconds);
            }}
          />
        </div>
      </div>

      <div className="timeline-body-scroll">
        <div className="timeline-body-row">
          <div className="timeline-labels">
            {tracks.map((track, index) => (
              <div key={track.name} data-track-index={index} onDoubleClick={() => {
                const newName = prompt('Enter new track name', track.name)
                if (newName) {
                  const updatedTracks = tracks.map((t, i) => i === index ? { ...t, name: newName } : t)
                  setTracks(updatedTracks)
                  updateTracks(updatedTracks)
                }
              }} className="timeline-label-item">{track.name}</div>
            ))}

            <AudioReferenceLabel
              setAudioReferenceFile={handleSetReferenceAudioFile}
              hasAudio={!!audioReferenceData}
              isLoading={isAudioLoading}
              volume={audioVolume}
              onVolumeChange={setAudioVolume}
              isPlaying={isPlaying}
            />
          </div>

          <div className="timeline-scroll-container" ref={scrollContainerRef}>
            <div className="timeline-content" style={{ width: timelineWidth }}>
              <div className="timeline-scrubber" ref={scrubberRef} />
              {tracks.map((track, index) => (
                <div key={index} className={`timeline-track ${index % 2 !== 0 ? 'odd' : ''}`} data-track-index={index} onDragOver={(e) => handleDragOver(e, index)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, index)}>
                  <div className="timeline-item-preview" style={{ display: 'none' }} />
                  {visibleItemsFiltered.filter(item => item.track === index).map((item) => (
                    <TimelineItem key={item.id} index={item.originalIndex} color={item.color} description={item.description} row={item.row} col={item.col} pageIndex={item.pageIndex} start={item.start} end={item.end} project={project} secondsScale={secondsScale} snapEnabled={snapEnabled} snapInterval={snapInterval} trackIndex={index} items={items} canEdit={canEdit && !isPlaying} onStartDrag={(idx) => { if (!canEditRef.current) return; draggingItemRef.current = idx }} onEndDrag={() => { if (!canEditRef.current) return; draggingItemRef.current = null }} onUpdate={(targetIdx, updatedFields) => { if (!canEditRef.current) return; const newItems = items.map((it, i) => i === targetIdx ? { ...it, ...updatedFields } : it); setItems(newItems); handleUpdate(newItems); }} id={item.id} onSelect={handleSelectItem} selected={selectedItemId !== null && selectedItemId === item.id} />
                  ))}
                </div>
              ))}

              <div className="timeline-track odd audio-reference-track">
                <AudioReferenceItem
                  secondsScale={secondsScale}
                  audio={audioReferenceData?.waveform}
                  duration={audioReferenceData?.duration}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default TimelinePanel