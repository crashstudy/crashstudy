/**
 * ═══════════════════════════════════════════
 *  CrashStudy — firebase.js
 *  Firebase App Initialization
 *  Import this file anywhere you need Firebase
 * ═══════════════════════════════════════════
 */

// ── Firebase CDN (ES Module) ──
import { initializeApp }  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth }        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore }   from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Your Firebase Config ──
const firebaseConfig = {
  apiKey:            "AIzaSyAPRhZlc7HZ5xxaPCFjNA30i4FgegMQ5Bw",
  authDomain:        "crashstudy-8e359.firebaseapp.com",
  projectId:         "crashstudy-8e359",
  storageBucket:     "crashstudy-8e359.firebasestorage.app",
  messagingSenderId: "333464557365",
  appId:             "1:333464557365:web:bc0983d0d8b581dc8f1e7c"
};

// ── Initialize ──
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };
