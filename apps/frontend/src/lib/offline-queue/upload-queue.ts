const DB_NAME = 'wilms-field-ops';
const DB_VERSION = 1;
const STORE = 'upload-queue';

export interface PendingUploadRecord {
  id: string;
  purpose: string;
  entityId?: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
  attemptCount: number;
  lastError: string | null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

export async function enqueueUpload(record: PendingUploadRecord): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Upload enqueue failed'));
  });
  db.close();
}

export async function listPendingUploads(): Promise<PendingUploadRecord[]> {
  const db = await openDb();
  const records = await new Promise<PendingUploadRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as PendingUploadRecord[]) ?? []);
    request.onerror = () => reject(request.error ?? new Error('Upload list failed'));
  });
  db.close();
  return records.sort((left, right) => left.createdAt - right.createdAt);
}

export async function removePendingUpload(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Upload delete failed'));
  });
  db.close();
}

export async function estimatePendingUploadBytes(): Promise<number> {
  const records = await listPendingUploads();
  return records.reduce((total, record) => total + record.blob.size, 0);
}
