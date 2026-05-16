/**
 * ═══════════════════════════════════════════════════════════════
 *  CrashStudy — auth.js
 *  Authentication Portal — DOM Interaction Module
 *
 *  Features:
 *   • Butter-smooth slide animation between Login ↔ Signup
 *   • Real-time password strength meter
 *   • Inline field validation
 *   • Password visibility toggle
 *   • Loading states on buttons
 *   • Form message display (error / success)
 *   • Firebase-ready hooks (replace stubs with firebase calls)
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

// ─────────────────────────────────────────────
// § 1. DOM REFERENCES
// ─────────────────────────────────────────────

const DOM = {
  // Wrapper
  formWrapper:    document.getElementById('formWrapper'),

  // Toggle triggers
  showSignup:     document.getElementById('showSignup'),
  showLogin:      document.getElementById('showLogin'),

  // Form boxes
  loginBox:       document.getElementById('loginBox'),
  signupBox:      document.getElementById('signupBox'),

  // Login fields
  loginEmail:     document.getElementById('loginEmail'),
  loginPassword:  document.getElementById('loginPassword'),
  loginBtn:       document.getElementById('loginBtn'),
  loginMessage:   document.getElementById('loginMessage'),
  forgotPassword: document.getElementById('forgotPassword'),

  // Signup fields
  signupFirstName: document.getElementById('signupFirstName'),
  signupLastName:  document.getElementById('signupLastName'),
  signupEmail:     document.getElementById('signupEmail'),
  signupPassword:  document.getElementById('signupPassword'),
  signupBtn:       document.getElementById('signupBtn'),
  signupMessage:   document.getElementById('signupMessage'),
  termsCheckbox:   document.getElementById('termsCheckbox'),

  // Strength meter
  strengthBar:    document.getElementById('strengthBar'),
  strengthLabel:  document.getElementById('strengthLabel'),

  // Google buttons
  googleSignIn:   document.getElementById('googleSignIn'),
  googleSignUp:   document.getElementById('googleSignUp'),

  // All password-toggle buttons
  toggleBtns:     document.querySelectorAll('.toggle-pass'),
};


// ─────────────────────────────────────────────
// § 2. SLIDE ANIMATION — LOGIN ↔ SIGNUP
// ─────────────────────────────────────────────

/**
 * Updates the wrapper height to match the currently active form box.
 * This prevents the container from collapsing when signup is in position:absolute.
 */
function syncWrapperHeight() {
  const isSignup = DOM.formWrapper.classList.contains('show-signup');
  const activeBox = isSignup ? DOM.signupBox : DOM.loginBox;

  // Temporarily make signup relative to measure it
  if (isSignup) {
    DOM.signupBox.style.position = 'relative';
  }

  const h = activeBox.getBoundingClientRect().height;
  DOM.formWrapper.style.height = `${h}px`;

  if (isSignup) {
    DOM.signupBox.style.position = '';
  }
}

/** Switch to the Signup view */
function showSignupView() {
  // Pre-measure signup height before transition
  DOM.signupBox.style.position = 'relative';
  DOM.signupBox.style.opacity = '0';
  DOM.signupBox.style.pointerEvents = 'none';
  const signupH = DOM.signupBox.getBoundingClientRect().height;
  DOM.signupBox.style.position = '';
  DOM.signupBox.style.opacity = '';
  DOM.signupBox.style.pointerEvents = '';

  DOM.formWrapper.style.height = `${DOM.loginBox.getBoundingClientRect().height}px`;

  // Trigger the slide
  requestAnimationFrame(() => {
    DOM.formWrapper.classList.add('show-signup');
    DOM.formWrapper.style.height = `${signupH}px`;

    DOM.loginBox.setAttribute('aria-hidden', 'true');
    DOM.signupBox.setAttribute('aria-hidden', 'false');

    // Focus first input after transition
    setTimeout(() => {
      DOM.signupFirstName?.focus();
      syncWrapperHeight();
    }, 560);
  });

  clearMessages();
}

/** Switch to the Login view */
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

    setTimeout(() => {
      DOM.loginEmail?.focus();
      syncWrapperHeight();
    }, 560);
  });

  clearMessages();
}

// Bind toggle clicks
DOM.showSignup?.addEventListener('click', showSignupView);
DOM.showLogin?.addEventListener('click', showLoginView);

// Keyboard accessibility (Enter/Space triggers toggle)
[DOM.showSignup, DOM.showLogin].forEach(el => {
  el?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.click();
    }
  });
});

// Set initial wrapper height after page load
window.addEventListener('load', () => {
  syncWrapperHeight();
});

// Recalculate on resize
window.addEventListener('resize', () => {
  syncWrapperHeight();
});


// ─────────────────────────────────────────────
// § 3. PASSWORD STRENGTH METER
// ─────────────────────────────────────────────

/**
 * Evaluates password strength and returns a score 0–3.
 * Criteria:
 *  +1  length ≥ 8
 *  +1  contains numbers AND letters
 *  +1  contains special chars AND length ≥ 10
 */
function getPasswordStrength(password) {
  if (!password) return 0;

  let score = 0;

  const hasLength    = password.length >= 8;
  const hasLetter    = /[a-zA-Z]/.test(password);
  const hasNumber    = /\d/.test(password);
  const hasSpecial   = /[^a-zA-Z0-9]/.test(password);
  const hasLongLen   = password.length >= 10;

  if (hasLength) score++;
  if (hasLetter && hasNumber) score++;
  if (hasSpecial && hasLongLen) score++;

  return score; // 0 = none | 1 = weak | 2 = medium | 3 = strong
}

const STRENGTH_MAP = {
  1: { cls: 'weak',   label: 'Weak'   },
  2: { cls: 'medium', label: 'Medium' },
  3: { cls: 'strong', label: 'Strong' },
};

function updateStrengthMeter(password) {
  const { strengthBar, strengthLabel } = DOM;
  if (!strengthBar || !strengthLabel) return;

  // Remove all state classes
  strengthBar.classList.remove('weak', 'medium', 'strong');
  strengthLabel.classList.remove('weak', 'medium', 'strong');

  if (!password) {
    strengthLabel.textContent = '';
    return;
  }

  const score = getPasswordStrength(password);
  const info  = STRENGTH_MAP[score];

  if (info) {
    strengthBar.classList.add(info.cls);
    strengthLabel.classList.add(info.cls);
    strengthLabel.textContent = info.label;
  }
}

DOM.signupPassword?.addEventListener('input', (e) => {
  updateStrengthMeter(e.target.value);
});


// ─────────────────────────────────────────────
// § 4. PASSWORD VISIBILITY TOGGLE
// ─────────────────────────────────────────────

const EYE_OPEN  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>`;
const EYE_CLOSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

DOM.toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.innerHTML = isPassword ? EYE_CLOSE : EYE_OPEN;
    btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });
});


// ─────────────────────────────────────────────
// § 5. FIELD VALIDATION HELPERS
// ─────────────────────────────────────────────

const Validators = {
  email:     (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  password:  (v) => v.length >= 8,
  name:      (v) => v.trim().length >= 2,
};

/**
 * Sets visual error/ok state on an input field.
 * @param {HTMLElement} field
 * @param {boolean} isValid
 */
function setFieldState(field, isValid) {
  if (!field) return;
  field.classList.toggle('field-error', !isValid);
  field.classList.toggle('field-ok',    isValid);
}

/** Live-validate a field on blur */
function addBlurValidation(field, validatorFn) {
  if (!field) return;
  field.addEventListener('blur', () => {
    if (field.value !== '') {
      setFieldState(field, validatorFn(field.value));
    }
  });
  field.addEventListener('input', () => {
    if (field.classList.contains('field-error')) {
      setFieldState(field, validatorFn(field.value));
    }
  });
}

// Attach blur validators
addBlurValidation(DOM.loginEmail,     Validators.email);
addBlurValidation(DOM.loginPassword,  Validators.password);
addBlurValidation(DOM.signupEmail,    Validators.email);
addBlurValidation(DOM.signupPassword, Validators.password);
addBlurValidation(DOM.signupFirstName, Validators.name);
addBlurValidation(DOM.signupLastName,  Validators.name);


// ─────────────────────────────────────────────
// § 6. FORM MESSAGE DISPLAY
// ─────────────────────────────────────────────

/**
 * Shows a message in a form's message slot.
 * @param {HTMLElement} msgEl - The message container
 * @param {string} text       - Message text
 * @param {'error'|'success'} type
 */
function showMessage(msgEl, text, type = 'error') {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className = `form-message ${type}`;
}

function clearMessages() {
  [DOM.loginMessage, DOM.signupMessage].forEach(el => {
    if (el) {
      el.textContent = '';
      el.className = 'form-message';
    }
  });
}


// ─────────────────────────────────────────────
// § 7. LOADING STATE HELPERS
// ─────────────────────────────────────────────

function setLoading(btn, isLoading, originalText) {
  if (!btn) return;
  btn.classList.toggle('loading', isLoading);
  btn.disabled = isLoading;
  if (!isLoading) {
    btn.querySelector('.btn-text').textContent = originalText;
  }
}


// ─────────────────────────────────────────────
// § 8. LOGIN FORM — Validation & Firebase hook
// ─────────────────────────────────────────────

/**
 * Validates login fields. Returns true if valid, false otherwise.
 */
function validateLoginForm() {
  const email    = DOM.loginEmail?.value  ?? '';
  const password = DOM.loginPassword?.value ?? '';
  let valid = true;

  if (!Validators.email(email)) {
    setFieldState(DOM.loginEmail, false);
    valid = false;
  }

  if (!Validators.password(password)) {
    setFieldState(DOM.loginPassword, false);
    valid = false;
  }

  if (!valid) {
    showMessage(DOM.loginMessage, 'Please enter a valid email and password (min. 8 chars).', 'error');
  }

  return valid;
}

/**
 * handleLogin — DOM layer only.
 * Replace the TODO block with your Firebase call.
 */
async function handleLogin() {
  if (!validateLoginForm()) return;

  const email    = DOM.loginEmail.value.trim();
  const password = DOM.loginPassword.value;

  setLoading(DOM.loginBtn, true, 'Sign In');
  clearMessages();

  try {
    // ── TODO: Firebase Email/Password Login ──────────────────────
    // import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
    // const auth = getAuth();
    // const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // const user = userCredential.user;
    // window.location.href = '/dashboard';
    // ─────────────────────────────────────────────────────────────

    // STUB (remove when Firebase is integrated)
    await fakeDemoDelay(1200);
    showMessage(DOM.loginMessage, '✓ Signed in successfully! Redirecting…', 'success');

    setTimeout(() => {
      console.log('[CrashStudy] Login success stub — redirect to /dashboard');
    }, 1000);

  } catch (err) {
    const msg = mapFirebaseError(err?.code);
    showMessage(DOM.loginMessage, msg, 'error');
  } finally {
    setLoading(DOM.loginBtn, false, 'Sign In');
  }
}

DOM.loginBtn?.addEventListener('click', handleLogin);


// ─────────────────────────────────────────────
// § 9. SIGNUP FORM — Validation & Firebase hook
// ─────────────────────────────────────────────

/**
 * Validates signup fields. Returns true if valid.
 */
function validateSignupForm() {
  const firstName = DOM.signupFirstName?.value ?? '';
  const lastName  = DOM.signupLastName?.value  ?? '';
  const email     = DOM.signupEmail?.value     ?? '';
  const password  = DOM.signupPassword?.value  ?? '';
  const terms     = DOM.termsCheckbox?.checked ?? false;

  let valid = true;
  const errors = [];

  if (!Validators.name(firstName)) {
    setFieldState(DOM.signupFirstName, false);
    errors.push('First name must be at least 2 characters.');
    valid = false;
  }

  if (!Validators.name(lastName)) {
    setFieldState(DOM.signupLastName, false);
    errors.push('Last name must be at least 2 characters.');
    valid = false;
  }

  if (!Validators.email(email)) {
    setFieldState(DOM.signupEmail, false);
    errors.push('Please enter a valid email address.');
    valid = false;
  }

  if (!Validators.password(password)) {
    setFieldState(DOM.signupPassword, false);
    errors.push('Password must be at least 8 characters.');
    valid = false;
  }

  if (!terms) {
    errors.push('Please accept the Terms of Service to continue.');
    valid = false;
  }

  if (!valid) {
    showMessage(DOM.signupMessage, errors[0], 'error');
  }

  return valid;
}

/**
 * handleSignup — DOM layer only.
 * Replace the TODO block with your Firebase call.
 */
async function handleSignup() {
  if (!validateSignupForm()) return;

  const firstName = DOM.signupFirstName.value.trim();
  const lastName  = DOM.signupLastName.value.trim();
  const email     = DOM.signupEmail.value.trim();
  const password  = DOM.signupPassword.value;

  setLoading(DOM.signupBtn, true, 'Create Free Account');
  clearMessages();

  try {
    // ── TODO: Firebase Email/Password Signup ─────────────────────
    // import {
    //   getAuth,
    //   createUserWithEmailAndPassword,
    //   updateProfile
    // } from 'firebase/auth';
    // import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
    //
    // const auth = getAuth();
    // const db   = getFirestore();
    //
    // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // const user = userCredential.user;
    //
    // // Set display name in Auth
    // await updateProfile(user, { displayName: `${firstName} ${lastName}` });
    //
    // // Save user profile in Firestore
    // await setDoc(doc(db, 'users', user.uid), {
    //   uid:       user.uid,
    //   firstName,
    //   lastName,
    //   email,
    //   createdAt: serverTimestamp(),
    //   plan:      'free',
    // });
    //
    // window.location.href = '/onboarding';
    // ─────────────────────────────────────────────────────────────

    // STUB (remove when Firebase is integrated)
    await fakeDemoDelay(1400);
    showMessage(
      DOM.signupMessage,
      `✓ Account created for ${firstName}! Redirecting…`,
      'success'
    );

    setTimeout(() => {
      console.log('[CrashStudy] Signup success stub — redirect to /onboarding');
    }, 1000);

  } catch (err) {
    const msg = mapFirebaseError(err?.code);
    showMessage(DOM.signupMessage, msg, 'error');
  } finally {
    setLoading(DOM.signupBtn, false, 'Create Free Account');
  }
}

DOM.signupBtn?.addEventListener('click', handleSignup);


// ─────────────────────────────────────────────
// § 10. GOOGLE SSO — Firebase hook
// ─────────────────────────────────────────────

/**
 * handleGoogleAuth — works for both sign-in and sign-up.
 * Replace the TODO block with your Firebase call.
 */
async function handleGoogleAuth(btn) {
  const origText = btn.querySelector('span')?.textContent ?? 'Continue with Google';
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Connecting…';

  try {
    // ── TODO: Firebase Google Sign-In ────────────────────────────
    // import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
    // import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
    //
    // const auth     = getAuth();
    // const db       = getFirestore();
    // const provider = new GoogleAuthProvider();
    //
    // const result   = await signInWithPopup(auth, provider);
    // const user     = result.user;
    //
    // // Create Firestore profile only if new user
    // const userRef  = doc(db, 'users', user.uid);
    // const userSnap = await getDoc(userRef);
    //
    // if (!userSnap.exists()) {
    //   await setDoc(userRef, {
    //     uid:       user.uid,
    //     firstName: user.displayName?.split(' ')[0] ?? '',
    //     lastName:  user.displayName?.split(' ').slice(1).join(' ') ?? '',
    //     email:     user.email,
    //     photoURL:  user.photoURL,
    //     createdAt: serverTimestamp(),
    //     plan:      'free',
    //   });
    //   window.location.href = '/onboarding';
    // } else {
    //   window.location.href = '/dashboard';
    // }
    // ─────────────────────────────────────────────────────────────

    // STUB
    await fakeDemoDelay(1000);
    console.log('[CrashStudy] Google Auth stub — redirect to /dashboard');

  } catch (err) {
    const msgEl = DOM.formWrapper.classList.contains('show-signup')
      ? DOM.signupMessage
      : DOM.loginMessage;
    showMessage(msgEl, mapFirebaseError(err?.code), 'error');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = origText;
  }
}

DOM.googleSignIn?.addEventListener('click', () => handleGoogleAuth(DOM.googleSignIn));
DOM.googleSignUp?.addEventListener('click', () => handleGoogleAuth(DOM.googleSignUp));


// ─────────────────────────────────────────────
// § 11. FORGOT PASSWORD
// ─────────────────────────────────────────────

DOM.forgotPassword?.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = DOM.loginEmail?.value?.trim();

  if (!email || !Validators.email(email)) {
    setFieldState(DOM.loginEmail, false);
    showMessage(DOM.loginMessage, 'Enter your email above to reset your password.', 'error');
    DOM.loginEmail?.focus();
    return;
  }

  try {
    // ── TODO: Firebase Password Reset ────────────────────────────
    // import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
    // const auth = getAuth();
    // await sendPasswordResetEmail(auth, email);
    // ─────────────────────────────────────────────────────────────

    // STUB
    await fakeDemoDelay(800);
    showMessage(DOM.loginMessage, `✓ Reset link sent to ${email}. Check your inbox.`, 'success');

  } catch (err) {
    showMessage(DOM.loginMessage, mapFirebaseError(err?.code), 'error');
  }
});


// ─────────────────────────────────────────────
// § 12. KEYBOARD — ENTER KEY SUBMIT
// ─────────────────────────────────────────────

DOM.loginBox?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});

DOM.signupBox?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSignup();
});


// ─────────────────────────────────────────────
// § 13. UTILITIES
// ─────────────────────────────────────────────

/** Simulates async delay for stub demos. Remove in production. */
function fakeDemoDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Maps Firebase error codes to human-readable messages.
 * @param {string|undefined} code - Firebase error code
 * @returns {string} User-friendly message
 */
function mapFirebaseError(code) {
  const ERRORS = {
    'auth/user-not-found':        'No account found with this email. Please sign up.',
    'auth/wrong-password':        'Incorrect password. Try again or reset it.',
    'auth/invalid-credential':    'Invalid email or password. Please check and try again.',
    'auth/email-already-in-use':  'This email is already registered. Try signing in.',
    'auth/weak-password':         'Password is too weak. Use at least 8 characters.',
    'auth/invalid-email':         'Please enter a valid email address.',
    'auth/too-many-requests':     'Too many attempts. Please wait and try again.',
    'auth/network-request-failed':'Network error. Check your connection and try again.',
    'auth/popup-closed-by-user':  'Google sign-in was cancelled. Please try again.',
    'auth/cancelled-popup-request': 'Only one sign-in window allowed at a time.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Contact support.',
  };

  return ERRORS[code] ?? 'Something went wrong. Please try again.';
}


// ─────────────────────────────────────────────
// § 14. PUBLIC API (module exports)
// ─────────────────────────────────────────────

export {
  showSignupView,
  showLoginView,
  showMessage,
  clearMessages,
  mapFirebaseError,
  getPasswordStrength,
};
