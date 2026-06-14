import {
  collection, doc, setDoc, deleteDoc, getDocs, writeBatch,
} from 'firebase/firestore';
import { firestore } from '../firebase';
import {
  getAllTransactions, getUnsyncedTransactions, markSynced,
  getPendingDeletes, clearPendingDelete, bulkSetFromFirestore,
} from '../db';

let _uid = null;

export function initSync(uid) {
  _uid = uid;
}

function txCol() {
  return collection(firestore, 'users', _uid, 'transactions');
}

function txDoc(firestoreId) {
  return doc(firestore, 'users', _uid, 'transactions', firestoreId);
}

// 書き込み後・online 復帰時に呼ぶ
export async function syncNow() {
  if (!_uid || !navigator.onLine) return;
  await _pushUnsynced();
  await _processPendingDeletes();
}

// 新端末初回ログイン時: IndexedDB が空なら Firestore から全件取得
export async function initFromFirestore() {
  if (!_uid || !navigator.onLine) return;
  const all = await getAllTransactions();
  if (all.length > 0) return;
  try {
    const snap = await getDocs(txCol());
    if (snap.empty) return;
    const records = snap.docs.map((d) => ({ firestoreId: d.id, synced: true, ...d.data() }));
    await bulkSetFromFirestore(records);
  } catch (e) {
    console.warn('initFromFirestore failed', e);
  }
}

// 全データ削除時に Firestore 側も消す
export async function clearFirestoreTransactions() {
  if (!_uid || !navigator.onLine) return;
  try {
    const snap = await getDocs(txCol());
    if (snap.empty) return;
    const batch = writeBatch(firestore);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (e) {
    console.warn('clearFirestoreTransactions failed', e);
  }
}

async function _pushUnsynced() {
  const unsynced = await getUnsyncedTransactions();
  for (const record of unsynced) {
    try {
      const { id: localId, firestoreId, synced, ...data } = record;
      const ref = firestoreId ? txDoc(firestoreId) : doc(txCol());
      await setDoc(ref, data);
      await markSynced(localId, ref.id);
    } catch (e) {
      console.warn('sync push failed', record.id, e);
    }
  }
}

async function _processPendingDeletes() {
  const deletes = await getPendingDeletes();
  for (const { id: pendingId, firestoreId } of deletes) {
    try {
      await deleteDoc(txDoc(firestoreId));
      await clearPendingDelete(pendingId);
    } catch (e) {
      console.warn('sync delete failed', firestoreId, e);
    }
  }
}
