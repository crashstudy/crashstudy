// --- 1. TOGGLE LOGIC: SLIDE BETWEEN LOGIN & SIGNUP ---
document.addEventListener("DOMContentLoaded", () => {
    const showSignupBtn = document.getElementById("showSignup");
    const showLoginBtn = document.getElementById("showLogin");
    const formWrapper = document.querySelector(".form-wrapper");

    // Sliding Animation Triggers
    if (showSignupBtn) {
        showSignupBtn.addEventListener("click", () => {
            formWrapper.classList.add("show-signup");
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener("click", () => {
            formWrapper.classList.remove("show-signup");
        });
    }

    // Password Strength Meter Logic
    const regPassword = document.getElementById("regPassword");
    const strengthBar = document.querySelector(".strength-bar");

    if (regPassword) {
        regPassword.addEventListener("input", (e) => {
            const val = e.target.value;
            strengthBar.className = "strength-bar"; // Reset classes

            if (val.length === 0) {
                strengthBar.style.width = "0%";
            } else if (val.length <= 5) {
                strengthBar.classList.add("strength-weak");
            } else if (val.length > 5 && val.match(/[0-9]/) && !val.match(/[^a-zA-Z0-9]/)) {
                strengthBar.classList.add("strength-medium");
            } else if (val.length >= 8 && val.match(/[0-9]/) && val.match(/[^a-zA-Z0-9]/)) {
                strengthBar.classList.add("strength-strong");
            } else {
                strengthBar.classList.add("strength-medium");
            }
        });
    }
});


// --- 2. FIREBASE GOOGLE AUTHENTICATION INTEGRATION ---
// We import the specific functions from Firebase SDK via CDN for GitHub Pages

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

/* =========================================================
   🚨 FIREBASE CONFIGURATION 🚨
   MERE BHAI, YAHAN PAR APNI API KEYS PASTE KARNI HAI JO 
   TUMNE FIREBASE CONSOLE SE NIKALI THI.
========================================================= */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPRhZlc7HZ5xxaPCFjNA30i4FgegMQ5Bw",
  authDomain: "crashstudy-8e359.firebaseapp.com",
  projectId: "crashstudy-8e359",
  storageBucket: "crashstudy-8e359.firebasestorage.app",
  messagingSenderId: "333464557365",
  appId: "1:333464557365:web:bc0983d0d8b581dc8f1e7c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Engine
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Handle Google Login Button Click
const googleLoginBtn = document.getElementById("googleLoginBtn");
const googleSignupBtn = document.getElementById("googleSignupBtn");

async function handleGoogleSignIn() {
    try {
        // This triggers the Google Popup
        const result = await signInWithPopup(auth, provider);
        
        // This gives you the Google Access Token & User Info
        const user = result.user;
        
        console.log("Login Success! Welcome:", user.displayName);
        alert(`Welcome to CrashStudy, ${user.displayName}! Let's crack the exam.`);
        
        // Redirect to the Dashboard after successful login
        window.location.href = "syllabus.html";

    } catch (error) {
        console.error("Error during Google Login:", error.message);
        // Error handling (e.g., if user closes the popup)
        if(error.code !== 'auth/popup-closed-by-user') {
            alert("Login Failed: " + error.message);
        }
    }
}

// Attach event to both buttons
if(googleLoginBtn) googleLoginBtn.addEventListener("click", handleGoogleSignIn);
if(googleSignupBtn) googleSignupBtn.addEventListener("click", handleGoogleSignIn);

