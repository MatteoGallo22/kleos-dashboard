// Frontend/js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase config (NON è segreta)
const firebaseConfig = {
  apiKey: "AIzaSyAjz-cEaW_6pLI_qng3aetdeRpYu89stCo",
  authDomain: "kleos-dashboard-75834.firebaseapp.com",
  projectId: "kleos-dashboard-75834",
  storageBucket: "kleos-dashboard-75834.firebasestorage.app",
  messagingSenderId: "762844707218",
  appId: "1:762844707218:web:27cad15bb091f90ac8694b",
  measurementId: "G-1F9E7PQVND",
};

// Init app + auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Exports
export {
  auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
};
