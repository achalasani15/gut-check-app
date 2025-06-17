// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Your Web App's Firebase Configuration ---
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

// --- A unique ID for our app's data paths in Firestore ---
// We use a simple string now instead of the special prototype variable.
export const appId = 'gut-check-app';
