/**
 * Minimal IndexedDB blob store for document attachments. Files stay on-device
 * (localStorage's ~5MB cap can't hold scans) — this is the only place binaries live.
 */
const DB = 'handover-files'
const STORE = 'files'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

export async function putFile(key: string, blob: Blob): Promise<void> {
  await tx('readwrite', (s) => s.put(blob, key))
}

export async function getFileURL(key: string): Promise<string | null> {
  try {
    const blob = await tx<Blob | undefined>('readonly', (s) => s.get(key))
    return blob ? URL.createObjectURL(blob) : null
  } catch {
    return null
  }
}

export async function deleteFile(key: string): Promise<void> {
  try {
    await tx('readwrite', (s) => s.delete(key))
  } catch {
    /* ignore */
  }
}
