/**
 * Decoupled playback clock + cue scheduler.
 * Uses performance.now() so position stays accurate when frames drop.
 * Cues fire via setTimeout at wall-clock time, independent of rAF/UI.
 */
export function createPlaybackEngine({ totalDuration, onFrame, onCue, onEnd }) {
  let anchorPerf = null;
  let anchorTime = 0;
  let rafId = null;
  let running = false;
  let holdTriggers = false;
  const cueTimeouts = new Map();
  const firedCueIds = new Set();

  function getTime() {
    if (!running || anchorPerf === null) return anchorTime;
    return Math.min(totalDuration, anchorTime + (performance.now() - anchorPerf) / 1000);
  }

  function clearScheduledCues() {
    for (const id of cueTimeouts.values()) clearTimeout(id);
    cueTimeouts.clear();
  }

  function scheduleCues(cues, fromTime, companionConnection) {
    clearScheduledCues();
    if (holdTriggers) return;

    for (const cue of cues) {
      if (cue.start < fromTime - 0.0005) continue;
      if (firedCueIds.has(cue.id)) continue;

      const delayMs = (cue.start - fromTime) * 1000;
      const timeoutId = setTimeout(() => {
        if (!running || holdTriggers) return;
        if (firedCueIds.has(cue.id)) return;
        firedCueIds.add(cue.id);
        cueTimeouts.delete(cue.id);
        onCue(cue, companionConnection);
      }, Math.max(0, delayMs));

      cueTimeouts.set(cue.id, timeoutId);
    }
  }

  function play(fromTime, cues, companionConnection) {
    anchorTime = fromTime;
    anchorPerf = performance.now();
    running = true;
    scheduleCues(cues, fromTime, companionConnection);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function tick() {
    if (!running) return;

    const t = getTime();
    onFrame(t);

    if (t >= totalDuration) {
      running = false;
      anchorTime = totalDuration;
      anchorPerf = null;
      clearScheduledCues();
      rafId = null;
      onEnd?.(totalDuration);
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    if (!running) return anchorTime;
    const t = getTime();
    anchorTime = t;
    anchorPerf = null;
    running = false;
    clearScheduledCues();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    return t;
  }

  function stop(atTime) {
    const t = atTime ?? getTime();
    running = false;
    anchorTime = t;
    anchorPerf = null;
    clearScheduledCues();
    firedCueIds.clear();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    return t;
  }

  function setHold(hold, cues, companionConnection) {
    holdTriggers = hold;
    if (!running) return;
    if (hold) {
      clearScheduledCues();
    } else {
      scheduleCues(cues, getTime(), companionConnection);
    }
  }

  function clearFired() {
    firedCueIds.clear();
  }

  return {
    play,
    pause,
    stop,
    getTime,
    setHold,
    clearFired,
    isRunning: () => running,
  };
}
