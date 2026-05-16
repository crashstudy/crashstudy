/**
 * ═══════════════════════════════════════════════════════════════
 *  CrashStudy — auth.js
 *  Authentication Portal — FULLY FIREBASE INTEGRATED
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

// ── Firebase SDKs (CDN ES Modules) ──
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Your initialized Firebase instances ──
import { auth, db } from './firebase.js';


// ═══════════════════════════════════════════════════════════════
// § 1. DOM REFERENCES
// ═══════════════════════════════════════════════════════════════

const DOM = {
  formWrapper:     document.getElementById('formWrapper'),
  showSignup:      document.getElementById('showSignup'),
  showLogin:       document.getElementById('showLogin'),
  loginBox:        document.getElementById('loginBox'),
  signupBox:       document.getElementById('signupBox'),

  // Login
  loginEmail:      document.getElementById('loginEmail'),
  loginPassword:   document.getElementById('loginPassword'),
  loginBtn:        document.getElementById('loginBtn'),
  loginMessage:    document.getElementById('loginMessage'),
  forgotPassword:  document.getElementById('forgotPassword'),

  // Signup
  signupFirstName: document.getElementById('signupFirstName'),
  signupLastName:  document.getElementById('signupLastName'),
  signupEmail:     document.getElementById('signupEmail'),
  signupPassword:  document.getElementById('signupPassword'),
  signupBtn:       document.getElementById('signupBtn'),
  signupMessage:   document.getElementById('signupMessage'),
  termsCheckbox:   document.getElementById('termsCheckbox'),

  // Strength meter
  strengthBar:     document.getElementById('strengthBar'),
  strengthLabel:   document.getElementById('strengthLabel'),

  // Google
  googleSignIn:    document.getElementById('googleSignIn'),
  googleSignUp:    document.getElementById('googleSignUp'),

  // All eye-toggle buttons
  toggleBtns:      document.querySelectorAll('.toggle-pass'),
};


// ═══════════════════════════════════════════════════════════════
// § 2. AUTH STATE LISTENER
// If already logged in → redirect straight to dashboard
// ═══════════════════════════════════════════════════════════════

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = '/index.html';
  }
});


// ═══════════════════════════════════════════════════════════════
// § 3. SLIDE ANIMATION — LOGIN ↔ SIGNUP
// ═══════════════════════════════════════════════════════════════

function syncWrapperHeight() {
  const isSignup  = DOM.formWrapper.classList.contains('show-signup');
  const activeBox = isSignup ? DOM.signupBox : DOM.loginBox;

  if (isSignup) DOM.signupBox.style.position = 'relative';
  const h = activeBox.getBoundingClientRect().height;
  DOM.formWrapper.style.height = `${h}px`;
  if (isSignup) DOM.signupBox.style.position = '';
}

function showSignupView() {
  DOM.signupBox.style.position      = 'relative';
  DOM.signupBox.style.opacity       = '0';
  DOM.signupBox.style.pointerEvents = 'none';
  const signupH = DOM.signupBox.getBoundingClientRect().height;
  DOM.signupBox.style.position      = '';
  DOM.signupBox.style.opacity       = '';
  DOM.signupBox.style.pointerEvents = '';

  DOM.formWrapper.style.height = `${DOM.loginBox.getBoundingClientRect().height}px`;

  requestAnimationFrame(() => {
    DOM.formWrapper.classList.add('show-signup');
    DOM.formWrapper.style.height = `${signupH}px`;
    DOM.loginBox.setAttribute('aria-hidden', 'true');
    DOM.signupBox.setAttribute('aria-hidden', 'false');
    setTimeout(() => { DOM.signupFirstName?.focus(); syncWrapperHeight(); }, 560);
  });

  clearMessages();
}

function showLoginView() {
  DOM.signupBox.style.position = 'relative';
  const signupH = DOM.signupBox.getBoundingClientRect().height;
  DOM.signupBox.style.position = '';

  DOM.formWrapper.style.height = `${signupH}px`;

  requestAnimationFrame(() => {
    DOM.formWrapper.classList.remove('show-signup');
    DOM.formWrapper.style.height = `${DOM.loginBox.getBoundingClientRect().height}px`;
    DOM.loginBox.setAttribute('aria-hidden', 'false');
    DOM.signupBox.setAttribute('aria-hidden', 'true');
    setTimeout(() => { DOM.loginEmail?.focus(); syncWrapperHeight(); }, 560);
  });

  clearMessages();
}

DOM.showSignup?.addEventListener('click', showSignupView);
DOM.showLogin?.addEventListener('click',  showLoginView);

[DOM.showSignup, DOM.showLogin].forEach(el => {
  el?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
  });
});

window.addEventListener('load',   syncWrapperHeight);
window.addEventListener('resize', syncWrapperHeight);


// ═══════════════════════════════════════════════════════════════
// § 4. PASSWORD STRENGTH METER
// ═══════════════════════════════════════════════════════════════

function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)                                          score++;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password))             score++;
  if (/[^a-zA-Z0-9]/.test(password) && password.length >= 10)       score++;
  return score;
}

const STRENGTH_MAP = {
  1: { cls: 'weak',   label: 'Weak'   },
  2: { cls: 'medium', label: 'Medium' },
  3: { cls: 'strong', label: 'Strong' },
};

function updateStrengthMeter(password) {
  const { strengthBar, strengthLabel } = DOM;
  if (!strengthBar || !strengthLabel) return;

  strengthBar.classList.remove('weak', 'medium', 'strong');
  strengthLabel.classList.remove('weak', 'medium', 'strong');

  if (!password) { strengthLabel.textContent = ''; return; }

  const info = STRENGTH_MAP[getPasswordStrength(password)];
  if (info) {
    strengthBar.classList.add(info.cls);
    strengthLabel.classList.add(info.cls);
    strengthLabel.textContent = info.label;
  }
}

DOM.signupPassword?.addEventListener('input', (e) => updateStrengthMeter(e.target.value));


// ═══════════════════════════════════════════════════════════════
// § 5. PASSWORD VISIBILITY TOGGLE
// ═══════════════════════════════════════════════════════════════

const EYE_OPEN  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>`;
const EYE_CLOSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

DOM.toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type   = isPass ? 'text' : 'password';
    btn.innerHTML = isPass ? EYE_CLOSE : EYE_OPEN;
    btn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
  });
});


// ═══════════════════════════════════════════════════════════════
// § 6. VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════

const Validators = {
  email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  password: (v) => v.length >= 8,
  name:     (v) => v.trim().length >= 2,
};

function setFieldState(field, isValid) {
  if (!field) return;
  field.classList.toggle('field-error', !isValid);
  field.classList.toggle('field-ok',    isValid);
}

function addBlurValidation(field, validatorFn) {
  if (!field) return;
  field.addEventListener('blur',  () => { if (field.value !== '') setFieldState(field, validatorFn(field.value)); });
  field.addEventListener('input', () => { if (field.classList.contains('field-error')) setFieldState(field, validatorFn(field.value)); });
}

addBlurValidation(DOM.loginEmail,      Validators.email);
addBlurValidation(DOM.loginPassword,   Validators.password);
addBlurValidation(DOM.signupEmail,     Validators.email);
addBlurValidation(DOM.signupPassword,  Validators.password);
addBlurValidation(DOM.signupFirstName, Validators.name);
addBlurValidation(DOM.signupLastName,  Validators.name);


// ═══════════════════════════════════════════════════════════════
// § 7. MESSAGE DISPLAY
// ═══════════════════════════════════════════════════════════════

function showMessage(msgEl, text, type = 'error') {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className   = `form-message ${type}`;
}

function clearMessages() {
  [DOM.loginMessage, DOM.signupMessage].forEach(el => {
    if (el) { el.textContent = ''; el.className = 'form-message'; }
  });
}


// ═══════════════════════════════════════════════════════════════
// § 8. LOADING STATE
// ═══════════════════════════════════════════════════════════════

function setLoading(btn, isLoading, originalText) {
  if (!btn) return;
  btn.classList.toggle('loading', isLoading);
  btn.disabled = isLoading;
  if (!isLoading) btn.querySelector('.btn-text').textContent = originalText;
}


// ═══════════════════════════════════════════════════════════════
// § 9. LOGIN — Firebase Email/Password
// ═══════════════════════════════════════════════════════════════

function validateLoginForm() {
  const email    = DOM.loginEmail?.value    ?? '';
  const password = DOM.loginPassword?.value ?? '';
  let valid = true;

  if (!Validators.email(email))       { setFieldState(DOM.loginEmail,    false); valid = false; }
  if (!Validators.password(password)) { setFieldState(DOM.loginPassword, false); valid = false; }
  if (!valid) showMessage(DOM.loginMessage, 'Please enter a valid email and password (min. 8 chars).', 'error');

  return valid;
}

async function handleLogin() {
  if (!validateLoginForm()) return;

  const email    = DOM.loginEmail.value.trim();
  const password = DOM.loginPassword.value;

  setLoading(DOM.loginBtn, true, 'Sign In');
  clearMessages();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage(DOM.loginMessage, '✓ Signed in! Redirecting…', 'success');
    setTimeout(() => { window.location.href = '/index.html'; }, 900);

  } catch (err) {
    showMessage(DOM.loginMessage, mapFirebaseError(err.code), 'error');
  } finally {
    setLoading(DOM.loginBtn, false, 'Sign In');
  }
}

DOM.loginBtn?.addEventListener('click', handleLogin);
DOM.loginBox?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });


// ═══════════════════════════════════════════════════════════════
// § 10. SIGNUP — Firebase Create Account + Firestore Profile
// ═══════════════════════════════════════════════════════════════

function validateSignupForm() {
  const firstName = DOM.signupFirstName?.value ?? '';
  const lastName  = DOM.signupLastName?.value  ?? '';
  const email     = DOM.signupEmail?.value     ?? '';
  const password  = DOM.signupPassword?.value  ?? '';
  const terms     = DOM.termsCheckbox?.checked ?? false;

  let valid = true;
  const errors = [];

  if (!Validators.name(firstName))    { setFieldState(DOM.signupFirstName, false); errors.push('First name must be at least 2 characters.');    valid = false; }
  if (!Validators.name(lastName))     { setFieldState(DOM.signupLastName,  false); errors.push('Last name must be at least 2 characters.');     valid = false; }
  if (!Validators.email(email))       { setFieldState(DOM.signupEmail,     false); errors.push('Please enter a valid email address.');           valid = false; }
  if (!Validators.password(password)) { setFieldState(DOM.signupPassword,  false); errors.push('Password must be at least 8 characters.');      valid = false; }
  if (!terms)                         { errors.push('Please accept the Terms of Service to continue.'); valid = false; }

  if (!valid) showMessage(DOM.signupMessage, errors[0], 'error');
  return valid;
}

async function handleSignup() {
  if (!validateSignupForm()) return;

  const firstName = DOM.signupFirstName.value.trim();
  const lastName  = DOM.signupLastName.value.trim();
  const email     = DOM.signupEmail.value.trim();
  const password  = DOM.signupPassword.value;

  setLoading(DOM.signupBtn, true, 'Create Free Account');
  clearMessages();

  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Set display name in Auth profile
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });

    // 3. Save user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid:         user.uid,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      email,
      photoURL:    user.photoURL ?? null,
      createdAt:   serverTimestamp(),
      plan:        'free',
      exams:       [],
    });

    showMessage(DOM.signupMessage, `✓ Welcome, ${firstName}! Setting up your account…`, 'success');
    setTimeout(() => { window.location.href = '/syllabus.html'; }, 1000);

  } catch (err) {
    showMessage(DOM.signupMessage, mapFirebaseError(err.code), 'error');
  } finally {
    setLoading(DOM.signupBtn, false, 'Create Free Account');
  }
}

DOM.signupBtn?.addEventListener('click', handleSignup);
DOM.signupBox?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSignup(); });


// ═══════════════════════════════════════════════════════════════
// § 11. GOOGLE SSO — Login & Signup unified
// ═══════════════════════════════════════════════════════════════

async function handleGoogleAuth(btn) {
  const spanEl   = btn.querySelector('span');
  const origText = spanEl?.textContent ?? 'Continue with Google';

  btn.disabled = true;
  if (spanEl) spanEl.textContent = 'Connecting…';

  const provider = new GoogleAuthProvider();

  try {
    const result   = await signInWithPopup(auth, provider);
    const user     = result.user;

    const userRef  = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // New user — save profile, go to onboarding
      const nameParts = (user.displayName ?? '').split(' ');
      await setDoc(userRef, {
        uid:         user.uid,
        firstName:   nameParts[0] ?? '',
        lastName:    nameParts.slice(1).join(' ') ?? '',
        displayName: user.displayName ?? '',
        email:       user.email,
        photoURL:    user.photoURL ?? null,
        createdAt:   serverTimestamp(),
        plan:        'free',
        exams:       [],
      });
      window.location.href = '/syllabus.html';
    } else {
      // Returning user — go to dashboard
      window.location.href = '/index.html';
    }

  } catch (err) {
    const msgEl = DOM.formWrapper.classList.contains('show-signup')
      ? DOM.signupMessage
      : DOM.loginMessage;
    showMessage(msgEl, mapFirebaseError(err.code), 'error');
  } finally {
    btn.disabled = false;
    if (spanEl) spanEl.textContent = origText;
  }
}

DOM.googleSignIn?.addEventListener('click', () => handleGoogleAuth(DOM.googleSignIn));
DOM.googleSignUp?.addEventListener('click', () => handleGoogleAuth(DOM.googleSignUp));


// ═══════════════════════════════════════════════════════════════
// § 12. FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════

DOM.forgotPassword?.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = DOM.loginEmail?.value?.trim();

  if (!email || !Validators.email(email)) {
    setFieldState(DOM.loginEmail, false);
    showMessage(DOM.loginMessage, 'Enter your email above first, then click Forgot Password.', 'error');
    DOM.loginEmail?.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(DOM.loginMessage, `✓ Reset link sent to ${email}. Check your inbox.`, 'success');
  } catch (err) {
    showMessage(DOM.loginMessage, mapFirebaseError(err.code), 'error');
  }
});


// ═══════════════════════════════════════════════════════════════
// § 13. FIREBASE ERROR MAP
// ═══════════════════════════════════════════════════════════════

function mapFirebaseError(code) {
  const ERRORS = {
    'auth/user-not-found':          'No account found with this email. Please sign up.',
    'auth/wrong-password':          'Incorrect password. Try again or reset it.',
    'auth/invalid-credential':      'Invalid email or password. Please check and try again.',
    'auth/email-already-in-use':    'This email is already registered. Try signing in instead.',
    'auth/weak-password':           'Password is too weak. Please use at least 8 characters.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/too-many-requests':       'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed':  'Network error. Check your connection and retry.',
    'auth/popup-closed-by-user':    'Google sign-in was cancelled. Please try again.',
    'auth/cancelled-popup-request': 'Only one sign-in window allowed at a time.',
    'auth/operation-not-allowed':   'This sign-in method is disabled. Contact support.',
    'auth/user-disabled':           'This account has been disabled. Contact support.',
  };
  return ERRORS[code] ?? 'Something went wrong. Please try again.';
}


// ═══════════════════════════════════════════════════════════════
// § 14. PUBLIC EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  showSignupView,
  showLoginView,
  showMessage,
  clearMessages,
  mapFirebaseError,
  getPasswordStrength,
};wordStrength,
};
