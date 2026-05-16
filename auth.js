// =========================================================
// 1. UI LOGIC: SLIDE ANIMATION & PASSWORD METER
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    const showSignupBtn = document.getElementById("showSignup");
    const showLoginBtn = document.getElementById("showLogin");
    const formWrapper = document.querySelector(".form-wrapper");

    // Sliding Animation Triggers (Try-catch to prevent blockages)
    try {
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
    } catch (e) {
        console.log("UI Toggle Error:", e);
    }

    // Password Strength Meter
    const regPassword = document.getElementById("regPassword");
    const strengthBar = document.querySelector(".strength-bar");

    if (regPassword) {
        regPassword.addEventListener("input", (e) => {
            const val = e.target.value;
            strengthBar.className = "strength-bar"; 
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

// =========================================================
// 2. FIREBASE INTEGRATION (Google + Email/Password)
// =========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 👉 APNI API KEYS YAHAN PASTE KAREIN
// Import the functions you need from the SDKs you need


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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- A. GOOGLE LOGIN LOGIC ---
async function handleGoogleSignIn() {
    try {
        const result = await signInWithPopup(auth, provider);
        alert(`Welcome to CrashStudy, ${result.user.displayName}!`);
        window.location.href = "syllabus.html";
    } catch (error) {
        if(error.code !== 'auth/popup-closed-by-user') {
            alert("Google Login Failed: " + error.message);
        }
    }
}
document.getElementById("googleLoginBtn")?.addEventListener("click", handleGoogleSignIn);
document.getElementById("googleSignupBtn")?.addEventListener("click", handleGoogleSignIn);


// --- B. EMAIL/PASSWORD SIGNUP (Create Account) ---
const signupBtn = document.querySelector("#signupBox .btn-primary-glow");
const signupEmail = document.querySelector("#signupBox input[type='email']");
const signupPassword = document.querySelector("#regPassword");

if(signupBtn) {
    signupBtn.addEventListener("click", async (e) => {
        e.preventDefault(); // Form reload rokne ke liye
        const email = signupEmail.value;
        const password = signupPassword.value;

        if(!email || !password) {
            alert("Please fill both Email and Password fields!");
            return;
        }

        try {
            signupBtn.innerText = "Creating..."; // Loading text
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            alert("Account Created Successfully! Welcome to CrashStudy.");
            window.location.href = "syllabus.html";
        } catch (error) {
            alert("Signup Error: " + error.message);
            signupBtn.innerText = "Create Account";
        }
    });
}

// --- C. EMAIL/PASSWORD LOGIN (Sign In) ---
const loginBtn = document.querySelector("#loginBox .btn-primary-glow");
const loginEmail = document.querySelector("#loginBox input[type='email']");
const loginPassword = document.querySelector("#loginBox input[type='password']");

if(loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const email = loginEmail.value;
        const password = loginPassword.value;

        if(!email || !password) {
            alert("Please enter your Email and Password!");
            return;
        }

        try {
            loginBtn.innerText = "Signing in...";
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            alert("Login Successful!");
            window.location.href = "syllabus.html";
        } catch (error) {
            alert("Login Failed: Incorrect Email or Password.");
            loginBtn.innerText = "Sign In";
        }
    });
} "syllabus.html";
        } catch (error) {
            alert("Login Failed: Incorrect Email or Password.");
            loginBtn.innerText = "Sign In";
        }
    });
}
