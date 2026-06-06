import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA1KwVXRrA7HHed0VmW632e5ZiY51KzbMo",
  authDomain: "my-kakeibo-1bde9.firebaseapp.com",
  projectId: "my-kakeibo-1bde9",
  storageBucket: "my-kakeibo-1bde9.firebasestorage.app",
  messagingSenderId: "288902774543",
  appId: "1:288902774543:web:326059aa293c9b11fd887a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);