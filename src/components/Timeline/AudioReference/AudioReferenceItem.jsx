import React, { useMemo } from 'react'
import './AudioReference.css'

const TRACK_HEIGHT = 44;
const pathCache = new Map();

function buildWaveformPath(audio, widthPx) {
  const cacheKey = `${widthPx}:${audio.length}:${audio[0]?.min}:${audio[0]?.max}`;
  if (pathCache.has(cacheKey)) return pathCache.get(cacheKey);

  const centerY = TRACK_HEIGHT / 2;
  const maxH = TRACK_HEIGHT / 2;
  const targetPoints = Math.min(audio.length, Math.ceil(widthPx) * 2);
  const step = Math.max(1, audio.length / targetPoints);

  const topPoints = [];
  const bottomPoints = [];

  for (let i = 0; i < targetPoints; i++) {
    const startIndex = Math.floor(i * step);
    const endIndex = Math.min(audio.length - 1, Math.floor((i + 1) * step));

    let localMax = -Infinity;
    let localMin = Infinity;

    for (let j = startIndex; j <= endIndex; j++) {
      if (audio[j].max > localMax) localMax = audio[j].max;
      if (audio[j].min < localMin) localMin = audio[j].min;
    }

    if (localMax === -Infinity) localMax = 0;
    if (localMin === Infinity) localMin = 0;

    const x = (i / (targetPoints - 1)) * widthPx;
    topPoints.push(`L ${x.toFixed(1)} ${(centerY - (localMax * maxH)).toFixed(1)}`);
    bottomPoints.push(`L ${x.toFixed(1)} ${(centerY - (localMin * maxH)).toFixed(1)}`);
  }

  const path = `M 0 ${centerY} ${topPoints.join(' ')} ${bottomPoints.reverse().join(' ')} Z`;
  pathCache.set(cacheKey, path);
  return path;
}

function AudioReferenceItem({ secondsScale, audio, duration }) {
  const widthPx = duration ? Math.round(duration * secondsScale) : 0;

  const pathData = useMemo(() => {
    if (!audio || audio.length === 0 || widthPx <= 0) return '';
    return buildWaveformPath(audio, widthPx);
  }, [audio, widthPx]);

  if (!audio || widthPx === 0) {
    return null;
  }

  return (
    <div className="timeline-item-audio" style={{ width: `${widthPx}px` }}>
      <svg width={widthPx} height={TRACK_HEIGHT} style={{ display: 'block' }}>
        <path d={pathData} fill="rgb(152, 103, 197)" opacity={0.8} />
      </svg>
    </div>
  );
}

export default React.memo(AudioReferenceItem)