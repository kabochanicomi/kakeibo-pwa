import {
  collection, doc, setDoc, deleteDoc, getDocs, writeBatch,
} from 'firebase/firestore';
import { firestore } from '../firebase';
import {
  getAllTransactions, getUnsyncedTransactions, markSynced, saveTransactionFirestoreId,
  getPendingDeletes, clearPendingDelete, bulkSetFromFirestore,
  getUnsyncedFixedTemplates, markFixedTemplateSynced, saveTemplateFirestoreId,
  getAllFixedTemplates, bulkSetFixedTemplatesFromFirestore,
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
  await _pushUnsyncedTemplates();
}

// ログイン時: Firestore にあってローカルにないレコードを取り込む
export async function initFromFirestore() {
  if (!_uid || !navigator.onLine) return;
  try {
    const snap = await getDocs(txCol());
    if (snap.empty) return;
    const all = await getAllTransactions();
    const localIds = new Set(all.map((r) => r.firestoreId).filter(Boolean));
    const newRecords = snap.docs
      .filter((d) => !localIds.has(d.id))
      .map((d) => ({ firestoreId: d.id, synced: true, ...d.data() }));
    if (newRecords.length > 0) await bulkSetFromFirestore(newRecords);
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
      // FirestoreIDをsetDocの前に保存しておく → ネットワーク障害で応答が来なくても
      // 次回リトライ時に同じIDでsetDocするため冪等になり重複を防ぐ
      if (!firestoreId) await saveTransactionFirestoreId(localId, ref.id);
      await setDoc(ref, data);
      await markSynced(localId, ref.id);
    } catch (e) {
      console.warn('sync push failed', record.id, e);
    }
  }
}

// ログイン時: Firestore にあってローカルにないテンプレートを取り込む
export async function initFixedTemplatesFromFirestore() {
  if (!_uid || !navigator.onLine) return;
  try {
    const col = collection(firestore, 'users', _uid, 'fixed_templates');
    const snap = await getDocs(col);
    if (snap.empty) return;
    const all = await getAllFixedTemplates();
    const localIds = new Set(all.map((t) => t.firestoreId).filter(Boolean));
    const newTemplates = snap.docs
      .filter((d) => !localIds.has(d.id))
      .map((d) => ({ firestoreId: d.id, synced: true, ...d.data() }));
    if (newTemplates.length > 0) await bulkSetFixedTemplatesFromFirestore(newTemplates);
  } catch (e) {
    console.warn('initFixedTemplatesFromFirestore failed', e);
  }
}

async function _pushUnsyncedTemplates() {
  const unsynced = await getUnsyncedFixedTemplates();
  for (const template of unsynced) {
    try {
      const { id: localId, firestoreId, synced, ...data } = template;
      const col = collection(firestore, 'users', _uid, 'fixed_templates');
      const ref = firestoreId ? doc(firestore, 'users', _uid, 'fixed_templates', firestoreId) : doc(col);
      if (!firestoreId) await saveTemplateFirestoreId(localId, ref.id);
      await setDoc(ref, data);
      await markFixedTemplateSynced(localId, ref.id);
    } catch (e) {
      console.warn('template sync push failed', template.id, e);
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
