import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, setPersistence, browserSessionPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcH9rkD-KYKJPq5yncexa_kuKi2_Q3w1Y",
  authDomain: "abhita-undangan.firebaseapp.com",
  projectId: "abhita-undangan",
  storageBucket: "abhita-undangan.firebasestorage.app",
  messagingSenderId: "149742784006",
  appId: "1:149742784006:web:f6ee0a2233cb5dfe4f3d87"
};

// Initialize Primary App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Secondary App (KHUSUS untuk Admin agar bisa membuat user baru tanpa ter-logout)
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export { 
    app, auth, db, secondaryAuth, storage,
    setPersistence, browserSessionPersistence, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged, createUserWithEmailAndPassword,
    doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where,
    ref, uploadString, getDownloadURL
};
