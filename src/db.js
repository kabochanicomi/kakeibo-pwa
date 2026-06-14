const DB_NAME = 'kakeibo-db';
const DB_VERSION = 2;
const STORE = 'transactions';
const DELETES_STORE = 'pending_deletes';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('yearMonth', 'yearMonth', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(DELETES_STORE)) {
        db.createObjectStore(DELETES_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addTransaction(data) {
  const db = await openDB();
  const yearMonth = data.date.slice(0, 7);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.add({ ...data, yearMonth, synced: false, firestoreId: null, created_at: new Date().toISOString() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getTransactionsByDate(date) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const index = tx.objectStore(STORE).index('date');
    const req = index.getAll(date);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function updateTransaction(id, data) {
  const db = await openDB();
  const yearMonth = data.date.slice(0, 7);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      const putReq = store.put({ ...existing, ...data, id, yearMonth, synced: false, updated_at: new Date().toISOString() });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getTransactionsByMonth(year, month) {
  const db = await openDB();
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const index = tx.objectStore(STORE).index('yearMonth');
    const req = index.getAll(yearMonth);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTransaction(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE, DELETES_STORE], 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      store.delete(id);
      if (record?.firestoreId) {
        tx.objectStore(DELETES_STORE).add({
          firestoreId: record.firestoreId,
          deletedAt: new Date().toISOString(),
        });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function bulkAddTransactions(dataArray) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const now = new Date().toISOString();
    for (const data of dataArray) {
      const yearMonth = data.date.slice(0, 7);
      store.add({ ...data, yearMonth, synced: false, firestoreId: null, created_at: now });
    }
    tx.oncomplete = () => resolve(dataArray.length);
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllTransactions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE, DELETES_STORE], 'readwrite');
    tx.objectStore(STORE).clear();
    tx.objectStore(DELETES_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllTransactions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getUnsyncedTransactions() {
  const all = await getAllTransactions();
  return all.filter((r) => !r.synced);
}

export async function markSynced(localId, firestoreId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(localId);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) { resolve(); return; }
      store.put({ ...record, synced: true, firestoreId });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getPendingDeletes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DELETES_STORE, 'readonly');
    const req = tx.objectStore(DELETES_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearPendingDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DELETES_STORE, 'readwrite');
    const req = tx.objectStore(DELETES_STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function bulkSetFromFirestore(records) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const now = new Date().toISOString();
    for (const { firestoreId, ...data } of records) {
      const yearMonth = data.date ? data.date.slice(0, 7) : data.yearMonth;
      store.add({ ...data, yearMonth, firestoreId, synced: true, created_at: data.created_at ?? now });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
