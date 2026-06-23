import React from 'react'
import './PlayControls.css'
import { PauseIcon, PlayIcon, SquareIcon } from 'lucide-react'

const formatTime = (totalSeconds) => {
  totalSeconds = Math.max(0, totalSeconds)

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 100);

  const pad = (num) => num.toString().padStart(2, '0');

  return `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`;
};

function PlayControls({ isPlaying, setIsPlaying, setIsResetPlayback, time = '00:00.00', isSidebarVisible, setHold, isHoldingTriggers, enableKeyboardShortcuts }) {

  const timeRef = React.useRef(null);

  const enableKeyboardShortcutsRef = React.useRef(enableKeyboardShortcuts)
  React.useEffect(() => {
    enableKeyboardShortcutsRef.current = enableKeyboardShortcuts
  }, [enableKeyboardShortcuts])

  const formattedTime = formatTime(time);

  React.useEffect(() => {
    if (timeRef.current) {
      timeRef.current.textContent = formattedTime;
    }
  }, [formattedTime]);

  React.useEffect(() => {
    const handlePlaybackTimeUpdate = (e) => {
      if (timeRef.current) {
        timeRef.current.textContent = formatTime(e.detail.time);
      }
    };
    window.addEventListener('playbackTimeUpdate', handlePlaybackTimeUpdate);
    return () => window.removeEventListener('playbackTimeUpdate', handlePlaybackTimeUpdate);
  }, []);

  React.useEffect(() => {
    if (!enableKeyboardShortcutsRef.current) return;

    const handleKeyDown = (e) => {
      // Spacebar toggle
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((current) => !current);
        setIsResetPlayback(false);
      }

      // Set hold to true when 'h' is pressed down
      if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        setHold(true);
        console.log('hold active');
      }

      // Refresh playback when 'r' is pressed
      if (e.key.toLowerCase() === 'r') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setIsPlaying(false);
          setIsResetPlayback(true);
        }
      }
    };

    const handleKeyUp = (e) => {
      // Set hold to false when 'h' is released
      if (e.key.toLowerCase() === "h") {
        setHold(false);
        console.log('hold released');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setIsPlaying, setIsResetPlayback, enableKeyboardShortcuts, setHold]);

  return (
    <div className={`play-controls ${!isSidebarVisible ? 'no-sidebar' : ''}`}>
      <div style={{ flexDirection: 'row', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="button" onClick={() => {
          setIsPlaying((current) => !current);
          setIsResetPlayback(false);
        }}>
          {isPlaying ? (
            <PauseIcon />
          ) : (
            <PlayIcon />
          )}
        </button>
        <button className="button" disabled={!isPlaying && time < 0.01} onClick={() => {
          setIsResetPlayback(true);
          setIsPlaying(false);
        }}>
          <SquareIcon />
        </button>
      </div>

      <p className="time" ref={timeRef}>{formattedTime}</p>
      <button
        className={`button hold-button ${isHoldingTriggers ? 'active' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          setHold(true);
        }}
        onMouseUp={() => setHold(false)}
        onMouseLeave={() => setHold(false)}
      >
        Hold Triggers
      </button>
    </div>
  )
}

export default PlayControls