import './AudioReference.css'
import { UploadIcon, Trash2Icon, Loader2Icon, Volume2Icon, MusicIcon } from 'lucide-react'

function AudioReferenceLabel({ setAudioReferenceFile, hasAudio, isLoading, volume, onVolumeChange, isPlaying }) {
  return (
    <div className="timeline-label-item audio-reference-label" style={{border: 'none'}}>
      <div style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row', gap: '7px'}}>
        <MusicIcon size={17} style={{ color: '#8A8A8A' }} />
        {!hasAudio && (<p style={{fontSize: '0.9rem'}}>Reference</p>)}
      </div>

      <div className="audio-controls">
        {isLoading ? (
          <Loader2Icon size={14} className="loading-spinner" />
        ) : (
          <>
            {!hasAudio && !isPlaying && (
              <button
                className="icon-btn"
                onClick={() => setAudioReferenceFile()}
                title="Upload audio reference"
              >
                <UploadIcon size={14} />
              </button>
            )}
            {hasAudio && (
              <>
                <div className="volume-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume} 
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="volume-slider"
                    title="Volume"
                    style={{ background: `linear-gradient(to right, #c084fc ${volume * 100}%, #3A3A3A ${volume * 100}%)` }}
                  />
                </div>
                <button
                  className={`icon-btn ${isPlaying ? 'hidden-btn' : ''}`}
                  onClick={() => setAudioReferenceFile(null)}
                  title="Remove audio reference"
                  disabled={isPlaying}
                >
                  <Trash2Icon size={14} />
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AudioReferenceLabel