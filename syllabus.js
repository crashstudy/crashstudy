// Firebase Imports
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase.js'; 

document.addEventListener('DOMContentLoaded', () => {

    // ─── DOM Elements ───
    const loginOverlay = document.getElementById('loginOverlay');
    const mainApp = document.getElementById('mainApp');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatarDisplay = document.getElementById('userAvatarDisplay');
    const streakDisplay = document.getElementById('streakDisplay');
    const progressRingCircle = document.getElementById('progressRingCircle');
    const progressRingText = document.getElementById('progressRingText');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    const checkboxes = document.querySelectorAll('.topic-checkbox');

    let currentUser = null;

    // ═══════════════════════════════════════════════════════════════
    // 1. FIREBASE AUTHENTICATION & DATABASE LOGIC
    // ═══════════════════════════════════════════════════════════════

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (mainApp) mainApp.style.display = 'flex';

            const name = user.displayName || user.email.split('@')[0];
            if (userNameDisplay) userNameDisplay.textContent = name;
            if (userAvatarDisplay) userAvatarDisplay.src = `https://ui-avatars.com/api/?name=${name}&background=00F0FF&color=000&bold=true`;

            await loadUserData(user.uid);

        } else {
            currentUser = null;
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (mainApp) mainApp.style.display = 'none';
        }
    });

    sidebarLogoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.reload();
        });
    });

    async function loadUserData(uid) {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);

        const todayDate = new Date().toISOString().split('T')[0];
        let yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        yesterdayDate = yesterdayDate.toISOString().split('T')[0];

        let userData = {
            streak: 1,
            lastLogin: todayDate,
            progress: {}
        };

        if (docSnap.exists()) {
            const data = docSnap.data();
            userData.progress = data.progress || {};
            
            if (data.lastLogin === yesterdayDate) {
                userData.streak = (data.streak || 0) + 1;
                userData.lastLogin = todayDate;
            } else if (data.lastLogin !== todayDate) {
                userData.streak = 1;
                userData.lastLogin = todayDate;
            } else {
                userData.streak = data.streak || 1;
            }
        }

        await setDoc(userRef, userData, { merge: true });

        if (streakDisplay) streakDisplay.textContent = `🔥 ${userData.streak} Days`;

        checkboxes.forEach(box => {
            const topicId = box.getAttribute('data-id');
            if (userData.progress[topicId] === true) {
                box.checked = true;
            }
        });

        updateProgressUI();
    }

    checkboxes.forEach(box => {
        box.addEventListener('change', async (e) => {
            if (!currentUser) return;

            const topicId = e.target.getAttribute('data-id');
            const isChecked = e.target.checked;

            updateProgressUI();

            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                progress: {
                    [topicId]: isChecked
                }
            }, { merge: true });
        });
    });

    function updateProgressUI() {
        const total = checkboxes.length;
        if(total === 0) return;

        let checkedCount = 0;
        checkboxes.forEach(box => {
            if (box.checked) checkedCount++;
        });

        const percentage = Math.round((checkedCount / total) * 100);

        if (progressRingText) progressRingText.textContent = `${percentage}%`;
        if (progressRingCircle) progressRingCircle.style.setProperty('--percentage', `${percentage}%`);
        
        if (percentage === 100) {
            progressRingCircle?.style.setProperty('--ring-color', '#27C93F'); // Green
        } else {
            progressRingCircle?.style.setProperty('--ring-color', '#00F0FF'); // Blue
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. ACCORDION & SIDEBAR UI LOGIC
    // ═══════════════════════════════════════════════════════════════
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(acc => {
        acc.addEventListener('click', function() {
            const item = this.parentElement;
            item.classList.toggle('open');
            const body = item.querySelector('.accordion-body');
            if (item.classList.contains('open')) {
                body.style.maxHeight = body.scrollHeight + "px";
            } else {
                body.style.maxHeight = null;
            }
        });
    });

    const menuToggle = document.getElementById('menuToggle');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }
    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. CRASH AI TUTOR (GEMINI INTEGRATION)
    // ═══════════════════════════════════════════════════════════════
    const GEMINI_API_KEY = 'AIzaSyD3Q4SPqncLu0fmYsud8vIVeptl_-17YI4'; 
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    const SYSTEM_PROMPT = "You are 'Crash AI Tutor', a helpful AI study assistant specifically for Indian government competitive exams (like SSC CGL, CAPF, AFCAT, etc.). Provide concise, accurate, and easy-to-understand study-related answers. Current question: ";

    const aiTrigger = document.getElementById('aiTrigger');
    const aiChatPanel = document.getElementById('aiChatPanel');
    const closeChatBtn = document.getElementById('closeChat');
    const chatBody = document.querySelector('.chat-body');
    const chatInput = document.querySelector('.chat-footer input');
    const sendBtn = document.querySelector('.btn-send');

    aiTrigger?.addEventListener('click', () => {
        aiChatPanel?.classList.toggle('active');
        if(aiChatPanel?.classList.contains('active')) chatInput?.focus();
    });

    closeChatBtn?.addEventListener('click', () => aiChatPanel?.classList.remove('active'));

    function appendMessage(text, sender) {
        if (!chatBody) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        if (sender === 'ai') {
            const avatarDiv = document.createElement('div');
            avatarDiv.classList.add('ai-avatar');
            avatarDiv.textContent = '🧠';
            messageDiv.appendChild(avatarDiv);
        }

        const textDiv = document.createElement('div');
        textDiv.classList.add('text-bubble');
        textDiv.innerHTML = text.replace(/\n/g, '<br>');
        messageDiv.appendChild(textDiv);
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function showLoading() {
        if(!chatBody) return;
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'ai-loading';
        loadingDiv.classList.add('message', 'ai', 'loading');
        loadingDiv.innerHTML = `<div class="ai-avatar">🧠</div><div class="text-bubble"><div class="dot-typing"></div></div>`;
        chatBody.appendChild(loadingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeLoading() {
        const loadingDiv = document.getElementById('ai-loading');
        if (loadingDiv) chatBody.removeChild(loadingDiv);
    }

    async function askGemini(question) {
        try {
            showLoading();
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: SYSTEM_PROMPT + question }] }]
                })
            });

            const data = await response.json();
            removeLoading();

            if (data.candidates && data.candidates.length > 0) {
                appendMessage(data.candidates[0].content.parts[0].text, 'ai');
            } else {
                appendMessage("Sorry, I couldn't understand that. Please ask a study-related question.", 'ai');
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            removeLoading();
            appendMessage("Oops! Network issue. Make sure your internet is working.", 'ai');
        }
    }

    function handleSend() {
        if (!chatInput || !sendBtn) return;
        const question = chatInput.value.trim();
        if (question !== "") {
            appendMessage(question, 'user');
            chatInput.value = '';
            askGemini(question);
        }
    }

    sendBtn?.addEventListener('click', handleSend);
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});
