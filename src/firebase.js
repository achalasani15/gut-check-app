import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCupRB4xrnWy0ab6tvgqbca3wy6dDCvz6s",
  authDomain: "gut-check-3769e.firebaseapp.com",
  projectId: "gut-check-3769e",
  storageBucket: "gut-check-3769e.appspot.com",
  messagingSenderId: "779595883139",
  appId: "1:779595883139:web:648ca63da76755673171b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper for generating a safe app ID for Firestore paths
const appId = typeof __app_id !== 'undefined' ? __app_id : 'gut-check-default';

export { auth, db, appId, onAuthStateChanged, signInAnonymously, signInWithCustomToken };

