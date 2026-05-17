/**
 * ═══════════════════════════════════════════════════════════════
 * CrashStudy — auth.js  (SMART ROUTING ADDED)
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import { auth } from './firebase.js';

const DOM = {
  formWrapper:     document.getElementById('formWrapper'),
  showSignup:      document.getElementById('showSignup'),
  showLogin:       document.getElementById('showLogin'),
  loginBox:        document.getElementById('loginBox'),
  signupBox:       document.getElementById('signupBox'),

  loginEmail:      document.getElementById('loginEmail'),
  loginPassword:   document.getElementById('loginPassword'),
  loginBtn:        document.getElementById('loginBtn'),
  loginMessage:    document.getElementById('loginMessage'),
  forgotPassword:  document.getElementById('forgotPassword'),

  signupFirstName: document.getElementById('signupFirstName'),
  signupLastName:  document.getElementById('signupLastName'),
  signupEmail:     document.getElementById('signupEmail'),
  signupPassword:  document.getElementById('signupPassword'),
  signupBtn:       document.getElementById('signupBtn'),
  signupMessage:   document.getElementById('signupMessage'),
  termsCheckbox:   document.getElementById('termsCheckbox'),

  strengthBar:     document.getElementById('strengthBar'),
  strengthLabel:   document.getElementById('strengthLabel'),

  googleSignIn:    document.getElementById('googleSignIn'),
  googleSignUp:    document.getElementById('googleSignUp'),
  toggleBtns:      document.querySelectorAll('.toggle-pass'),
};

// ✏️ SMART ROUTING FUNCTION
// Yeh URL check karta hai ki user kis page se aaya tha. Default: index.html
function getRedirectUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('redirect') || 'index.html';
}

// ═══════════════════════════════════════════════════════════════
// § 2. AUTH STATE LISTENER
// ═══════════════════════════════════════════════════════════════

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ Logged in as:', user.email, '| UID:', user.uid);
    window.location.href = getRedirectUrl(); // Smart Redirect
  }
});


// ═══════════════════════════════════════════════════════════════
// § 3. SLIDE ANIMATION
// ═══════════════════════════════════════════════════════════════

function syncWrapperHeight() {
  const isSignup  = DOM.formWrapper.classList.contains('show-signup');
  const activeBox = isSignup ? DOM.signupBox : DOM.loginBox;
  if (isSignup) DOM.signupBox.style.position = 'relative';
  DOM.formWrapper.style.height = `${activeBox.getBoundingClientRect().height}px`;
  if (isSignup) DOM.signupBox.style.position = '';
}

function showSignupView() {
  DOM.signupBox.style.cssText = 'position:relative;opacity:0;pointer-events:none';
  const signupH = DOM.signupBox.getBoundingClientRect().height;
  DOM.signupBox.style.cssText = '';

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

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)                                      s++;
  if (/[a-zA-Z]/.test(pw) && /\d/.test(pw))               s++;
  if (/[^a-zA-Z0-9]/.test(pw) && pw.length >= 10)         s++;
  return s;
}

const STRENGTH_MAP = {
  1: { cls: 'weak',   label: 'Weak'   },
  2: { cls: 'medium', label: 'Medium' },
  3: { cls: 'strong', label: 'Strong' },
};

function updateStrengthMeter(pw) {
  const { strengthBar: bar, strengthLabel: lbl } = DOM;
  if (!bar || !lbl) return;
  bar.classList.remove('weak','medium','strong');
  lbl.classList.remove('weak','medium','strong');
  if (!pw) { lbl.textContent = ''; return; }
  const info = STRENGTH_MAP[getPasswordStrength(pw)];
  if (info) { bar.classList.add(info.cls); lbl.classList.add(info.cls); lbl.textContent = info.label; }
}

DOM.signupPassword?.addEventListener('input', (e) => updateStrengthMeter(e.target.value));


// ═══════════════════════════════════════════════════════════════
// § 5. PASSWORD TOGGLE
// ═══════════════════════════════════════════════════════════════

const EYE_OPEN  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>`;
const EYE_CLOSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

DOM.toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const isPass   = input.type === 'password';
    input.type     = isPass ? 'text' : 'password';
    btn.innerHTML  = isPass ? EYE_CLOSE : EYE_OPEN;
    btn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
  });
});


// ═══════════════════════════════════════════════════════════════
// § 6. VALIDATORS
// ═══════════════════════════════════════════════════════════════

const V = {
  email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  password: (v) => v.length >= 8,
  name:     (v) => v.trim().length >= 2,
};

function setFieldState(field, isValid) {
  if (!field) return;
  field.classList.toggle('field-error', !isValid);
  field.classList.toggle('field-ok',    isValid);
}

function addBlurValidation(field, fn) {
  if (!field) return;
  field.addEventListener('blur',  () => { if (field.value) setFieldState(field, fn(field.value)); });
  field.addEventListener('input', () => { if (field.classList.contains('field-error')) setFieldState(field, fn(field.value)); });
}

addBlurValidation(DOM.loginEmail,      V.email);
addBlurValidation(DOM.loginPassword,   V.password);
addBlurValidation(DOM.signupEmail,     V.email);
addBlurValidation(DOM.signupPassword,  V.password);
addBlurValidation(DOM.signupFirstName, V.name);
addBlurValidation(DOM.signupLastName,  V.name);


// ═══════════════════════════════════════════════════════════════
// § 7. MESSAGES & LOADING
// ═══════════════════════════════════════════════════════════════

function showMessage(el, text, type = 'error') {
  if (!el) return;
  el.textContent = text;
  el.className   = `form-message ${type}`;
}

function clearMessages() {
  [DOM.loginMessage, DOM.signupMessage].forEach(el => {
    if (el) { el.textContent = ''; el.className = 'form-message'; }
  });
}

function setLoading(btn, on, label) {
  if (!btn) return;
  btn.classList.toggle('loading', on);
  btn.disabled = on;
  if (!on) btn.querySelector('.btn-text').textContent = label;
}


// ═══════════════════════════════════════════════════════════════
// § 8. LOGIN
// ═══════════════════════════════════════════════════════════════

async function handleLogin() {
  const email    = DOM.loginEmail?.value.trim()   ?? '';
  const password = DOM.loginPassword?.value       ?? '';
  let ok = true;

  if (!V.email(email))    { setFieldState(DOM.loginEmail,    false); ok = false; }
  if (!V.password(password)) { setFieldState(DOM.loginPassword, false); ok = false; }
  if (!ok) { showMessage(DOM.loginMessage, 'Valid email aur min. 8-char password daalo.'); return; }

  setLoading(DOM.loginBtn, true, 'Sign In');
  clearMessages();

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    showMessage(
      DOM.loginMessage,
      `✓ Welcome back, ${cred.user.displayName || cred.user.email}!`,
      'success'
    );
     setTimeout(() => { window.location.href = getRedirectUrl(); }, 900); // Smart Redirect

  } catch (err) {
    showMessage(DOM.loginMessage, mapError(err.code));
  } finally {
    setLoading(DOM.loginBtn, false, 'Sign In');
  }
}

DOM.loginBtn?.addEventListener('click', handleLogin);
DOM.loginBox?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });


// ═══════════════════════════════════════════════════════════════
// § 9. SIGNUP  (Auth only — no Firestore needed)
// ═══════════════════════════════════════════════════════════════

async function handleSignup() {
  const firstName = DOM.signupFirstName?.value ?? '';
  const lastName  = DOM.signupLastName?.value  ?? '';
  const email     = DOM.signupEmail?.value     ?? '';
  const password  = DOM.signupPassword?.value  ?? '';
  const terms     = DOM.termsCheckbox?.checked ?? false;

  let ok = true;
  let firstError = '';

  if (!V.name(firstName))    { setFieldState(DOM.signupFirstName, false); firstError = firstError || 'First name min. 2 characters.';    ok = false; }
  if (!V.name(lastName))     { setFieldState(DOM.signupLastName,  false); firstError = firstError || 'Last name min. 2 characters.';     ok = false; }
  if (!V.email(email))       { setFieldState(DOM.signupEmail,     false); firstError = firstError || 'Valid email address daalo.';        ok = false; }
  if (!V.password(password)) { setFieldState(DOM.signupPassword,  false); firstError = firstError || 'Password min. 8 characters hona chahiye.'; ok = false; }
  if (!terms)                { firstError = firstError || 'Terms of Service accept karo.'; ok = false; }

  if (!ok) { showMessage(DOM.signupMessage, firstError); return; }

  setLoading(DOM.signupBtn, true, 'Create Free Account');
  clearMessages();

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(cred.user, {
      displayName: `${firstName} ${lastName}`,
    });

    showMessage(
      DOM.signupMessage,
      `🎉 Account ban gaya, ${firstName}! Ab sign in karo.`,
      'success'
    );

    setTimeout(() => {
      showLoginView();
      DOM.loginEmail.value = email;   
      showMessage(DOM.loginMessage, '✓ Account ready hai — ab sign in karo!', 'success');
    }, 1500);

    setTimeout(() => { window.location.href = getRedirectUrl(); }, 1200); // Smart Redirect

  } catch (err) {
    showMessage(DOM.signupMessage, mapError(err.code));
  } finally {
    setLoading(DOM.signupBtn, false, 'Create Free Account');
  }
}

DOM.signupBtn?.addEventListener('click', handleSignup);
DOM.signupBox?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSignup(); });


// ═══════════════════════════════════════════════════════════════
// § 10. GOOGLE SSO
// ═══════════════════════════════════════════════════════════════

async function handleGoogleAuth(btn) {
  const span     = btn.querySelector('span');
  const origText = span?.textContent ?? 'Continue with Google';

  btn.disabled = true;
  if (span) span.textContent = 'Connecting…';

  try {
    const provider = new GoogleAuthProvider();
    const result   = await signInWithPopup(auth, provider);
    const user     = result.user;

    const isNew = result._tokenResponse?.isNewUser ?? false;

    showMessage(
      DOM.loginMessage,
      `✓ Welcome${isNew ? '' : ' back'}, ${user.displayName || user.email}!`,
      'success'
    );

    console.log('Google Auth success:', user.email, '| New user:', isNew);

     setTimeout(() => {
       window.location.href = getRedirectUrl(); // Smart Redirect
     }, 900);

  } catch (err) {
    const msgEl = DOM.formWrapper.classList.contains('show-signup')
      ? DOM.signupMessage
      : DOM.loginMessage;
    showMessage(msgEl, mapError(err.code));
  } finally {
    btn.disabled = false;
    if (span) span.textContent = origText;
  }
}

DOM.googleSignIn?.addEventListener('click', () => handleGoogleAuth(DOM.googleSignIn));
DOM.googleSignUp?.addEventListener('click', () => handleGoogleAuth(DOM.googleSignUp));


// ═══════════════════════════════════════════════════════════════
// § 11. FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════

DOM.forgotPassword?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = DOM.loginEmail?.value?.trim();

  if (!email || !V.email(email)) {
    setFieldState(DOM.loginEmail, false);
    showMessage(DOM.loginMessage, 'Pehle upar apna email daalo, phir click karo.');
    DOM.loginEmail?.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(DOM.loginMessage, `✓ Reset link bhej diya ${email} pe. Inbox check karo.`, 'success');
  } catch (err) {
    showMessage(DOM.loginMessage, mapError(err.code));
  }
});


// ═══════════════════════════════════════════════════════════════
// § 12. FIREBASE ERROR MESSAGES
// ═══════════════════════════════════════════════════════════════

function mapError(code) {
  const MAP = {
    'auth/user-not-found':          'Is email ka koi account nahi mila. Pehle sign up karo.',
    'auth/wrong-password':          'Password galat hai. Dobara try karo ya reset karo.',
    'auth/invalid-credential':      'Email ya password galat hai. Check karke retry karo.',
    'auth/email-already-in-use':    'Yeh email already registered hai. Sign in karo.',
    'auth/weak-password':           'Password bahut weak hai. Min. 8 characters use karo.',
    'auth/invalid-email':           'Valid email address daalo.',
    'auth/too-many-requests':       'Bahut zyada attempts. Thodi der baad try karo.',
    'auth/network-request-failed':  'Network error. Internet connection check karo.',
    'auth/popup-closed-by-user':    'Google sign-in cancel ho gaya. Dobara try karo.',
    'auth/cancelled-popup-request': 'Ek waqt mein sirf ek sign-in window allowed hai.',
    'auth/operation-not-allowed':   'Yeh sign-in method enable nahi hai. Support se contact karo.',
    'auth/user-disabled':           'Yeh account disabled hai. Support se contact karo.',
  };
  return MAP[code] ?? 'Kuch galat ho gaya. Dobara try karo.';
}

// ═══════════════════════════════════════════════════════════════
// § 13. EXPORTS
// ═══════════════════════════════════════════════════════════════

export { showSignupView, showLoginView, showMessage, clearMessages, mapError, getPasswordStrength };
