import React, { useRef, useEffect, useState, useCallback } from 'react';
import './VideoReference.css';
import { saveMedia, getMedia, deleteMedia } from '../../utils/mediaDB';
import { updateProject } from '../../utils/projectUpdater';
import { Trash2Icon, VideoIcon } from 'lucide-react';

/**
 * Extracts waveform data from an audio/video file.
 * Returns { duration, waveform, audioBuffer } or null if no audio track.
 */
async function extractAudioData(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const arrayBufferCopy = arrayBuffer.slice(0);
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
    return { duration: audioBuffer.duration, waveform, audioBuffer: arrayBufferCopy };
  } catch (err) {
    console.warn('No audio track found or audio extraction failed:', err);
    return null;
  }
}

function VideoReference({ project, selectedSequenceIndex, isPlaying, isResetPlayback, onMediaUpdate }) {
  const [videoData, setVideoData] = useState(null); // { url, fileName }
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);

  // Load video from IndexedDB on mount or sequence change
  useEffect(() => {
    let isSubscribed = true;
    const seq = project?.sequences?.[selectedSequenceIndex];

    const loadMedia = async () => {
      if (seq?.mediaRefId) {
        setIsLoading(true);
        try {
          const data = await getMedia(seq.mediaRefId);
          if (isSubscribed && data && data.type === 'video') {
            if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
            const url = URL.createObjectURL(data.blob);
            videoUrlRef.current = url;
            setVideoData({ url, fileName: data.fileName });
          } else if (isSubscribed && data && data.type === 'audio') {
            // Audio-only media — no video to display
            if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
            videoUrlRef.current = null;
            setVideoData(null);
          }
        } catch (error) {
          console.error('Error loading media:', error);
        } finally {
          if (isSubscribed) setIsLoading(false);
        }
      } else {
        if (videoUrlRef.current) {
          URL.revokeObjectURL(videoUrlRef.current);
          videoUrlRef.current = null;
        }
        setVideoData(null);
      }
    };

    loadMedia();
    return () => { isSubscribed = false; };
  }, [project?.sequences?.[selectedSequenceIndex]?.mediaRefId, selectedSequenceIndex]);

  // Sync playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoData) return;
    if (isPlaying) {
      video.play().catch(e => console.warn('Video play blocked:', e));
    } else {
      video.pause();
    }
  }, [isPlaying, videoData]);

  // Handle reset
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isResetPlayback) return;
    video.pause();
    video.currentTime = 0;
  }, [isResetPlayback]);

  // Sync current time with the timeline scrubber
  useEffect(() => {
    const handlePlaybackTimeUpdate = (e) => {
      const video = videoRef.current;
      if (!video) return;
      if (!isPlaying || Math.abs(video.currentTime - e.detail.time) > 0.5) {
        video.currentTime = Math.max(0, e.detail.time);
      }
    };
    window.addEventListener('playbackTimeUpdate', handlePlaybackTimeUpdate);
    return () => window.removeEventListener('playbackTimeUpdate', handlePlaybackTimeUpdate);
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  const handleUploadVideo = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setIsLoading(true);

        // Extract audio from the video
        const audioData = await extractAudioData(file);

        const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Save unified media object
        await saveMedia(mediaId, {
          blob: file,
          type: 'video',
          fileName: file.name,
          duration: audioData?.duration || 0,
          waveform: audioData?.waveform || [],
          audioBuffer: audioData?.audioBuffer || null,
        });

        // Update project sequence with single mediaRefId
        updateProject(project.name, (p) => {
          const updated = { ...p };
          if (updated.sequences?.[selectedSequenceIndex]) {
            updated.sequences[selectedSequenceIndex].mediaRefId = mediaId;
            // Clean up old split references if they exist
            delete updated.sequences[selectedSequenceIndex].videoRefId;
            delete updated.sequences[selectedSequenceIndex].audioRefId;
          }
          return updated;
        });

        // Optimistic UI update
        if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
        const url = URL.createObjectURL(file);
        videoUrlRef.current = url;
        setVideoData({ url, fileName: file.name });

        // Notify parent about the new media (for audio waveform in timeline)
        if (onMediaUpdate && audioData) {
          onMediaUpdate({
            waveform: audioData.waveform,
            duration: audioData.duration,
            fileName: file.name,
            audioBuffer: audioData.audioBuffer,
          });
        } else if (onMediaUpdate) {
          onMediaUpdate(null);
        }
      } catch (err) {
        console.error('Video processing failed:', err);
        alert('Failed to process video file.');
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  }, [project, selectedSequenceIndex, onMediaUpdate]);

  const handleRemoveMedia = useCallback(async () => {
    const seq = project?.sequences?.[selectedSequenceIndex];
    if (!seq?.mediaRefId) return;

    try {
      // 1. Stop video element
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }

      // 2. Clear local UI
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
        videoUrlRef.current = null;
      }
      setVideoData(null);

      // 3. Delete from DB
      await deleteMedia(seq.mediaRefId);

      // 4. Update project
      updateProject(project.name, (p) => {
        const updated = { ...p };
        if (updated.sequences?.[selectedSequenceIndex]) {
          delete updated.sequences[selectedSequenceIndex].mediaRefId;
          delete updated.sequences[selectedSequenceIndex].videoRefId;
          delete updated.sequences[selectedSequenceIndex].audioRefId;
        }
        return updated;
      });

      // 5. Notify parent to clear audio waveform
      if (onMediaUpdate) onMediaUpdate(null);
    } catch (err) {
      console.error('Failed to remove media:', err);
    }
  }, [project, selectedSequenceIndex, onMediaUpdate]);

  return (
    <div className="video-reference-container">
      {isLoading ? (
        <div className="video-reference-placeholder">Loading Video...</div>
      ) : videoData ? (
        <>
          <video
            ref={videoRef}
            src={videoData.url}
            className="video-reference-element"
            muted
            playsInline
          />
          <div className="video-reference-controls">
            {!isPlaying && (
              <button className="video-control-btn" title="Remove Media" onClick={handleRemoveMedia}>
                <Trash2Icon size={16} />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="video-reference-placeholder">
          <VideoIcon size={48} opacity={0.5} />
          <span>No Video Reference</span>
          <button className="video-reference-button" onClick={handleUploadVideo}>
            Upload Video
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoReference;
