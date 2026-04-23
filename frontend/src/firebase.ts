import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCTXsnZYNQyPQDsaOof-_XjqN0jLcf3m6A",
  authDomain: "manthan-52693.firebaseapp.com",
  projectId: "manthan-52693",
  storageBucket: "manthan-52693.firebasestorage.app",
  messagingSenderId: "721763120869",
  appId: "1:721763120869:web:e2ff6e5d66e3147779860c",
  measurementId: "G-6G0M0JE6RG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
