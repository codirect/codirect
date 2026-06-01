import React from 'react'

function TimelineRuler({
  totalDuration,
  secondsScale,
  visibleStart,
  visibleEnd,
  snapEnabled,
  snapInterval,
  onSnapEnabledChange,
  onSnapIntervalChange,
  onClick
}) {
  const totalWidth = (totalDuration + 1) * secondsScale;
  
  const startTick = Math.max(0, Math.floor(visibleStart) - 2)
  const endTick = Math.min(totalDuration, Math.ceil(visibleEnd) + 2)

  const ticks = []
  for (let i = startTick; i <= endTick; i++) {
    ticks.push(i)
  }

  return (
    <div
      className="timeline-ruler"
      style={{
        width: `${totalWidth}px`,
        minWidth: `${totalWidth}px`, // Force the ruler to match total project width
        position: 'relative'
      }}
      onClick={onClick}
    >
      {ticks.map((second) => (
        <div
          key={second}
          className="time-tick"
          style={{
            width: `${secondsScale}px`,
            position: 'absolute',
            left: `${second * secondsScale}px`,
            height: '100%'
          }}
        >
          <span className="time-label">{second}s</span>
          <div className="tick-mark main-tick" />

          {second < totalDuration &&
            Array.from({ length: 9 }, (_, index) => {
              const subTickNumber = index + 1
              const isHalfSecond = subTickNumber === 5
              const pixelOffset = (secondsScale / 10) * subTickNumber

              return (
                <div
                  key={subTickNumber}
                  className={`tick-mark sub-tick ${isHalfSecond ? 'half-tick' : ''}`}
                  style={{
                    left: `${pixelOffset}px`
                  }}
                />
              )
            })}
        </div>
      ))}
    </div>
  )
}

export default React.memo(TimelineRuler)