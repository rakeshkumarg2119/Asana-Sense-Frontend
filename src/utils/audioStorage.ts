// IndexedDB Persistent Storage for User Ambient Soundscapes
// Ensures uploaded audio files survive session exits, tab navigation, and page refreshes.

export interface StoredSoundscape {
  id: string;
  name: string;
  subtitle: string;
  type: 'file' | 'url';
  url: string; // Active object URL or remote stream URL
  blob?: Blob;
  sizeBytes?: number;
  createdAt: number;
}

const DB_NAME = 'asana_soundscapes_db_v2';
const DB_VERSION = 1;
const STORE_NAME = 'soundscapes';
const LEGACY_STORAGE_KEY = 'asana_custom_soundscapes_v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open audio database'));
  });
}

/**
 * Save a newly uploaded file or URL stream to persistent IndexedDB
 */
export async function saveSoundscapeToDB(
  track: Omit<StoredSoundscape, 'createdAt' | 'url'> & { blob?: Blob; remoteUrl?: string }
): Promise<StoredSoundscape> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: {
        id: string;
        name: string;
        subtitle: string;
        type: 'file' | 'url';
        blob?: Blob;
        remoteUrl?: string;
        sizeBytes?: number;
        createdAt: number;
      } = {
        id: track.id,
        name: track.name,
        subtitle: track.subtitle,
        type: track.type,
        blob: track.blob,
        remoteUrl: track.remoteUrl,
        sizeBytes: track.sizeBytes,
        createdAt: Date.now(),
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        // Generate an active URL for playback
        const activeUrl = record.blob 
          ? URL.createObjectURL(record.blob) 
          : (record.remoteUrl || '');

        resolve({
          id: record.id,
          name: record.name,
          subtitle: record.subtitle,
          type: record.type,
          url: activeUrl,
          blob: record.blob,
          sizeBytes: record.sizeBytes,
          createdAt: record.createdAt,
        });
      };

      putRequest.onerror = () => reject(putRequest.error || new Error('Failed to save audio file'));
    });
  } catch (err) {
    console.warn('[AudioStorage] IndexedDB save failed, using memory fallback:', err);
    const activeUrl = track.blob 
      ? URL.createObjectURL(track.blob) 
      : (track.remoteUrl || '');
    return {
      ...track,
      url: activeUrl,
      createdAt: Date.now(),
    };
  }
}

/**
 * Load all stored tracks and recreate live Blob URLs for all stored audio records
 */
export async function loadAllSoundscapesFromDB(): Promise<StoredSoundscape[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawRecords = request.result || [];
        const activeTracks: StoredSoundscape[] = [];

        for (const rec of rawRecords) {
          let liveUrl = '';
          if (rec.type === 'file' && rec.blob) {
            try {
              liveUrl = URL.createObjectURL(rec.blob);
            } catch (blobErr) {
              console.warn('[AudioStorage] Failed to create blob URL for record:', rec.id, blobErr);
            }
          } else if (rec.type === 'url' && rec.remoteUrl) {
            liveUrl = rec.remoteUrl;
          }

          if (liveUrl) {
            activeTracks.push({
              id: rec.id,
              name: rec.name,
              subtitle: rec.subtitle,
              type: rec.type,
              url: liveUrl,
              blob: rec.blob,
              sizeBytes: rec.sizeBytes,
              createdAt: rec.createdAt || Date.now(),
            });
          }
        }

        // Clean up any stale localStorage items with broken blob URLs
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {
          // ignore
        }

        resolve(activeTracks);
      };

      request.onerror = () => {
        console.warn('[AudioStorage] Failed to read from IndexedDB, returning empty');
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('[AudioStorage] IndexedDB unavailable:', err);
    return [];
  }
}

/**
 * Delete a track permanently from IndexedDB
 */
export async function deleteSoundscapeFromDB(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[AudioStorage] Delete failed:', err);
    return false;
  }
}
