// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Your NEW Web App's Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAHbjMTp80cEJxDGABaHebo2mYJh14ineM",
  authDomain: "gut-check-bbc00.firebaseapp.com",
  projectId: "gut-check-bbc00",
  storageBucket: "gut-check-bbc00.appspot.com",
  messagingSenderId: "721709083515",
  appId: "1:721709083515:web:2db2e1879ade2da078abde"
};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Export individual Firebase functions for use in other files ---
export {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
};

// --- Helper for generating a safe app ID for Firestore paths ---
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'gut-check-default';
