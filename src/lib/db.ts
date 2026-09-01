import type { ClothingItem, BodyMatrix, FeedbackRecord, ScanResult, WishlistItem } from '../types';

const DB_NAME = 'wardrobe-db';
const DB_VERSION = 3;
const STORE_ITEMS = 'items';
const STORE_IMAGES = 'images';
const STORE_BODY = 'body';
const STORE_FEEDBACK = 'feedback';
const STORE_SCANS = 'scans';
const STORE_WISHLIST = 'wishlist';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ITEMS))
        db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_IMAGES))
        db.createObjectStore(STORE_IMAGES);
      if (!db.objectStoreNames.contains(STORE_BODY))
        db.createObjectStore(STORE_BODY);
      if (!db.objectStoreNames.contains(STORE_FEEDBACK))
        db.createObjectStore(STORE_FEEDBACK, { keyPath: 'outfitId' });
      if (!db.objectStoreNames.contains(STORE_SCANS))
        db.createObjectStore(STORE_SCANS, { keyPath: 'timestamp' });
      if (!db.objectStoreNames.contains(STORE_WISHLIST))
        db.createObjectStore(STORE_WISHLIST, { keyPath: 'id' });

      // v2 migration: move imageData from items to separate image store
      if (event.oldVersion < 2) {
        const tx = req.transaction!;
        const itemStore = tx.objectStore(STORE_ITEMS);
        const imageStore = tx.objectStore(STORE_IMAGES);
        const getAllReq = itemStore.getAll();
        getAllReq.onsuccess = () => {
          const allItems = getAllReq.result as ClothingItem[];
          for (const item of allItems) {
            if (item.imageData) {
              imageStore.put(item.imageData, item.id);
              const { imageData: _drop, ...rest } = item;
              itemStore.put(rest);
            }
          }
        };
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export async function getAllItems(): Promise<ClothingItem[]> {
  return tx(STORE_ITEMS, 'readonly', (s) => s.getAll() as IDBRequest<ClothingItem[]>);
}

export async function getItem(id: string): Promise<ClothingItem | null> {
  return tx(STORE_ITEMS, 'readonly', (s) => s.get(id) as IDBRequest<ClothingItem | null>);
}

export async function putItem(item: ClothingItem): Promise<void> {
  const { imageData, ...meta } = item;
  await Promise.all([
    tx(STORE_ITEMS, 'readwrite', (s) => s.put(meta)),
    tx(STORE_IMAGES, 'readwrite', (s) => s.put(imageData, item.id)),
  ]);
}

export async function deleteItem(id: string): Promise<void> {
  await Promise.all([
    tx(STORE_ITEMS, 'readwrite', (s) => s.delete(id)),
    tx(STORE_IMAGES, 'readwrite', (s) => s.delete(id)),
  ]);
}

export async function getImage(id: string): Promise<string | null> {
  return tx(STORE_IMAGES, 'readonly', (s) => s.get(id) as IDBRequest<string | null>);
}

export async function getAllImages(ids: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  await Promise.all(
    ids.map(async (id) => {
      const img = await getImage(id);
      if (img) results[id] = img;
    })
  );
  return results;
}

export async function getBody(): Promise<BodyMatrix | null> {
  return tx(STORE_BODY, 'readonly', (s) => s.get('matrix') as IDBRequest<BodyMatrix | null>);
}

export async function putBody(body: BodyMatrix): Promise<void> {
  await tx(STORE_BODY, 'readwrite', (s) => s.put(body, 'matrix'));
}

export async function getAllFeedback(): Promise<FeedbackRecord[]> {
  return tx(STORE_FEEDBACK, 'readonly', (s) => s.getAll() as IDBRequest<FeedbackRecord[]>);
}

export async function putFeedback(rec: FeedbackRecord): Promise<void> {
  await tx(STORE_FEEDBACK, 'readwrite', (s) => s.put(rec));
}

export async function putScan(scan: ScanResult): Promise<void> {
  await tx(STORE_SCANS, 'readwrite', (s) => s.put(scan));
}

export async function getAllScans(): Promise<ScanResult[]> {
  return tx(STORE_SCANS, 'readonly', (s) => s.getAll() as IDBRequest<ScanResult[]>);
}

export async function getAllWishlist(): Promise<WishlistItem[]> {
  return tx(STORE_WISHLIST, 'readonly', (s) => s.getAll() as IDBRequest<WishlistItem[]>);
}

export async function putWishlistItem(item: WishlistItem): Promise<void> {
  await tx(STORE_WISHLIST, 'readwrite', (s) => s.put(item));
}

export async function deleteWishlistItem(id: string): Promise<void> {
  await tx(STORE_WISHLIST, 'readwrite', (s) => s.delete(id));
}

export async function clearAll(): Promise<void> {
  await Promise.all([
    tx(STORE_ITEMS, 'readwrite', (s) => s.clear()),
    tx(STORE_IMAGES, 'readwrite', (s) => s.clear()),
    tx(STORE_BODY, 'readwrite', (s) => s.clear()),
    tx(STORE_FEEDBACK, 'readwrite', (s) => s.clear()),
    tx(STORE_SCANS, 'readwrite', (s) => s.clear()),
    tx(STORE_WISHLIST, 'readwrite', (s) => s.clear()),
  ]);
}
