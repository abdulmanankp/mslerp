import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/integrations/firebase/client";

type AnyObject = Record<string, unknown>;

export type FirestoreQueueOperation =
  | {
      type: "set";
      collection: string;
      docId: string;
      data: AnyObject;
      merge?: boolean;
    }
  | {
      type: "update";
      collection: string;
      docId: string;
      data: AnyObject;
    }
  | {
      type: "delete";
      collection: string;
      docId: string;
    };

interface QueueItem {
  id?: number;
  op: FirestoreQueueOperation;
  createdAt: number;
}

interface CacheItem<T = unknown> {
  key: string;
  rows: T[];
  updatedAt: number;
}

const DB_NAME = "msl_erp_offline";
const DB_VERSION = 1;
const QUEUE_STORE = "queue";
const CACHE_STORE = "collection_cache";

let nativeOnlineState: boolean | null = null;
let connectivityInitialized = false;
let removeNativeNetworkListener: (() => void) | null = null;

function canUseIndexedDb() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB unavailable."));
      return;
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Failed to open IndexedDB."));
  });
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));
  });
}

export function isOnlineNow() {
  if (nativeOnlineState !== null) return nativeOnlineState;
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

async function initializeNativeConnectivity(): Promise<void> {
  if (connectivityInitialized) return;
  connectivityInitialized = true;

  if (typeof window === "undefined") return;

  try {
    const coreModuleName = "@capacitor/core";
    const networkModuleName = "@capacitor/network";

    const coreModule = await import(/* @vite-ignore */ coreModuleName);
    const isNative = !!coreModule?.Capacitor?.isNativePlatform?.();
    if (!isNative) return;

    const networkModule = await import(/* @vite-ignore */ networkModuleName);
    const network = networkModule?.Network;
    if (!network) return;

    const initialStatus = await network.getStatus();
    nativeOnlineState = !!initialStatus?.connected;

    const listenerHandle = await network.addListener("networkStatusChange", (status: { connected: boolean }) => {
      nativeOnlineState = !!status.connected;
      if (nativeOnlineState) {
        void processOfflineQueue();
      }
    });

    removeNativeNetworkListener = () => {
      try {
        listenerHandle.remove();
      } catch {
        // ignore cleanup errors
      }
    };
  } catch {
    // Capacitor network plugin may be unavailable in web; fallback to navigator.onLine.
  }
}

export async function enqueueFirestoreOperation(op: FirestoreQueueOperation): Promise<void> {
  if (!canUseIndexedDb()) return;
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  tx.objectStore(QUEUE_STORE).add({ op, createdAt: Date.now() } as QueueItem);
  await txComplete(tx);
  db.close();
}

export async function saveCollectionCache<T>(key: string, rows: T[]): Promise<void> {
  if (!canUseIndexedDb()) return;
  const db = await openDb();
  const tx = db.transaction(CACHE_STORE, "readwrite");
  tx.objectStore(CACHE_STORE).put({ key, rows, updatedAt: Date.now() } as CacheItem<T>);
  await txComplete(tx);
  db.close();
}

export async function readCollectionCache<T>(key: string): Promise<T[] | null> {
  if (!canUseIndexedDb()) return null;
  const db = await openDb();
  const tx = db.transaction(CACHE_STORE, "readonly");
  const req = tx.objectStore(CACHE_STORE).get(key);

  const result = await new Promise<CacheItem<T> | undefined>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as CacheItem<T> | undefined);
    req.onerror = () => reject(req.error || new Error("Failed reading collection cache."));
  });

  await txComplete(tx);
  db.close();
  return result?.rows ?? null;
}

export async function appendCollectionCacheItem<T extends { id: string }>(key: string, row: T): Promise<void> {
  const current = (await readCollectionCache<T>(key)) || [];
  const idx = current.findIndex((item) => item.id === row.id);
  if (idx >= 0) {
    current[idx] = row;
  } else {
    current.unshift(row);
  }
  await saveCollectionCache(key, current);
}

async function getQueuedItems(): Promise<QueueItem[]> {
  if (!canUseIndexedDb()) return [];
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, "readonly");
  const req = tx.objectStore(QUEUE_STORE).getAll();

  const rows = await new Promise<QueueItem[]>((resolve, reject) => {
    req.onsuccess = () => resolve((req.result || []) as QueueItem[]);
    req.onerror = () => reject(req.error || new Error("Failed reading queue."));
  });

  await txComplete(tx);
  db.close();
  rows.sort((a, b) => (a.id || 0) - (b.id || 0));
  return rows;
}

async function deleteQueuedItem(id: number): Promise<void> {
  if (!canUseIndexedDb()) return;
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  tx.objectStore(QUEUE_STORE).delete(id);
  await txComplete(tx);
  db.close();
}

async function applyOperation(op: FirestoreQueueOperation): Promise<void> {
  const ref = doc(firestore, op.collection, op.docId);

  if (op.type === "set") {
    await setDoc(ref, op.data, { merge: !!op.merge });
    return;
  }

  if (op.type === "update") {
    await updateDoc(ref, op.data);
    return;
  }

  await deleteDoc(ref);
}

let processing = false;

export async function processOfflineQueue(): Promise<{ processed: number; pending: number }> {
  if (processing || !isOnlineNow()) {
    const pendingRows = await getQueuedItems();
    return { processed: 0, pending: pendingRows.length };
  }

  processing = true;
  let processed = 0;

  try {
    const rows = await getQueuedItems();
    for (const item of rows) {
      if (typeof item.id !== "number") continue;
      try {
        await applyOperation(item.op);
        await deleteQueuedItem(item.id);
        processed += 1;
      } catch {
        // Stop on first failure to preserve queue order.
        break;
      }
    }

    const remaining = await getQueuedItems();
    return { processed, pending: remaining.length };
  } finally {
    processing = false;
  }
}

export function startOfflineSync(intervalMs = 12000): () => void {
  if (typeof window === "undefined") return () => undefined;

  void initializeNativeConnectivity();

  const run = () => {
    void processOfflineQueue();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") run();
  };

  window.addEventListener("online", run);
  window.addEventListener("focus", run);
  document.addEventListener("visibilitychange", onVisibilityChange);
  run();
  const timer = window.setInterval(run, intervalMs);

  return () => {
    window.removeEventListener("online", run);
    window.removeEventListener("focus", run);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.clearInterval(timer);
    if (removeNativeNetworkListener) {
      removeNativeNetworkListener();
      removeNativeNetworkListener = null;
    }
  };
}
