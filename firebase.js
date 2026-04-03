/* ═══════════════════════════════════════════
   js/firebase.js
   Firebase initialisation + shared state
   ═══════════════════════════════════════════ */

import { initializeApp }           from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ── Firebase config ──────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDeu2oIs5ZMhCniCuCZmG0tz1MT8p_-2ho",
  authDomain:        "viet-flashcards.firebaseapp.com",
  projectId:         "viet-flashcards",
  storageBucket:     "viet-flashcards.firebasestorage.app",
  messagingSenderId: "764070119844",
  appId:             "1:764070119844:web:0c9090dcaf6916a0929931"
};

// ── Cloudinary config ────────────────────────
export const CLOUDINARY_CLOUD  = 'dnfyowjso';
export const CLOUDINARY_PRESET = 'Learn Viet';
export const CLOUDINARY_URL    = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`;

// ── Firebase instances ───────────────────────
const fbApp = initializeApp(firebaseConfig);
export const db = getFirestore(fbApp);

// ── Re-export Firestore helpers ──────────────
export { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc };

// ── Fixed category list (display order) ──────
export const FIXED_CATS = ['verbes', 'expressions', 'vocabulaire'];

// ── Shared reactive state ────────────────────
export const state = {
  categories: [],
  words:      [],
  scores:     {},
  dbReady:    false,
  username:   localStorage.getItem('viet_username') || '',
};
