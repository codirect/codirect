const DB_NAME = 'CodirectMediaDB';
const STORE_NAME = 'mediaStore';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a media reference.
 * @param {string} id - Unique ID for this media entry
 * @param {Object} data - Media data object with the following shape:
 *   - {Blob} blob - The raw file blob (video or audio)
 *   - {string} type - 'video' or 'audio'
 *   - {string} fileName - Original file name
 *   - {number} duration - Duration in seconds
 *   - {Array} waveform - Extracted waveform data [{min, max}, ...]
 *   - {ArrayBuffer} [audioBuffer] - Raw audio array buffer (for audio-only files)
 */
export async function saveMedia(id, data) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMedia(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteMedia(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
