import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlMz64wqwmsfL2ZlRmI8DP5I9NlxEF5aA",
  authDomain: "kakeibo-pwa-d3b9c.firebaseapp.com",
  projectId: "kakeibo-pwa-d3b9c",
  storageBucket: "kakeibo-pwa-d3b9c.firebasestorage.app",
  messagingSenderId: "446234220805",
  appId: "1:446234220805:web:cf1fd40fafec3553937f6c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);