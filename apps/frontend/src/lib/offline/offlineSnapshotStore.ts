const DB_NAME = 'wilms-offline-cache';
const DB_VERSION = 1;
const STORE = 'snapshots';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open offline cache'));
  });
}

export async function writeOfflineSnapshot<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ value, savedAt: Date.now() }, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to write offline snapshot'));
    });
    db.close();
  } catch {
    // Best-effort cache; ignore storage failures.
  }
}

export async function readOfflineSnapshot<T>(
  key: string,
): Promise<{ value: T; savedAt: number } | null> {
  try {
    const db = await openDb();
    const result = await new Promise<{ value: T; savedAt: number } | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve((request.result as { value: T; savedAt: number } | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('Failed to read offline snapshot'));
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

export const OFFLINE_CACHE_KEYS = {
  dashboardSummary: 'dashboard-summary',
  documentationCatalog: 'documentation-catalog',
  notificationsList: 'notifications-list',
  locationRegions: 'location-regions',
  locationDistrictsPrefix: 'location-districts:',
  locationCommunitiesPrefix: 'location-communities:',
  locationHierarchy: 'location-hierarchy',
} as const;
