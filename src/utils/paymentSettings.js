import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { PAYMENT_METHODS as DEFAULTS } from '../constants/categories';

const CACHE_KEY = 'kakeibo_paymentMethods';

function settingsRef(uid) {
  return doc(firestore, 'users', uid, 'settings', 'paymentMethods');
}

export async function initPaymentMethods(uid) {
  if (navigator.onLine) {
    try {
      const snap = await getDoc(settingsRef(uid));
      if (snap.exists()) {
        const methods = snap.data().methods;
        localStorage.setItem(CACHE_KEY, JSON.stringify(methods));
        return methods;
      }
      // 初回ログイン: 現在のデフォルト設定をそのまま保存
      await setDoc(settingsRef(uid), { methods: DEFAULTS });
      localStorage.setItem(CACHE_KEY, JSON.stringify(DEFAULTS));
      return DEFAULTS;
    } catch (e) {
      console.warn('initPaymentMethods failed', e);
    }
  }
  const cached = localStorage.getItem(CACHE_KEY);
  return cached ? JSON.parse(cached) : DEFAULTS;
}

export function getPaymentMethods() {
  const cached = localStorage.getItem(CACHE_KEY);
  return cached ? JSON.parse(cached) : DEFAULTS;
}

export async function savePaymentMethods(uid, methods) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(methods));
  if (navigator.onLine) {
    await setDoc(settingsRef(uid), { methods });
  }
}
