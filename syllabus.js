// Firebase Imports
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase.js'; // Ensure path is correct

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
            // User Logged In Hai
            currentUser = user;
            loginOverlay.style.display = 'none';
            mainApp.style.display = 'flex';

            // Profile UI update
            const name = user.displayName || user.email.split('@')[0];
            userNameDisplay.textContent = name;
            userAvatarDisplay.src = `https://ui-avatars.com/api/?name=${name}&background=00F0FF&color=000`;

            // Load Progress & Streak from Firestore
            await loadUserData(user.uid);

        } else {
            // User Logged Out Hai
            currentUser = null;
            loginOverlay.style.display = 'flex';
            mainApp.style.display = 'none';
        }
    });

    // ── Logout Logic ──
    sidebarLogoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.reload();
        });
    });

    // ── Load User Data from Firestore ──
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
            
            // Streak Calculation Logic
            if (data.lastLogin === yesterdayDate) {
                // Lagatar aaya hai, streak badhao
                userData.streak = (data.streak || 0) + 1;
                userData.lastLogin = todayDate;
            } else if (data.lastLogin !== todayDate) {
                // Gap aa gaya, streak reset
                userData.streak = 1;
                userData.lastLogin = todayDate;
            } else {
                // Aaj hi login kiya hua hai pehle, same rakho
                userData.streak = data.streak || 1;
            }
        }

        // Save updated streak to database
        await setDoc(userRef, userData, { merge: true });

        // Update UI
        streakDisplay.textContent = `🔥 ${userData.streak} Days`;

        // Apply saved checkboxes
        checkboxes.forEach(box => {
            const topicId = box.getAttribute('data-id');
            if (userData.progress[topicId] === true) {
                box.checked = true;
            }
        });

        updateProgressUI();
    }

    // ── Save Checkbox Progress on Click ──
    checkboxes.forEach(box => {
        box.addEventListener('change', async (e) => {
            if (!currentUser) return;

            const topicId = e.target.getAttribute('data-id');
            const isChecked = e.target.checked;

            updateProgressUI();

            // Save to Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                progress: {
                    [topicId]: isChecked
                }
            }, { merge: true });
        });
    });

    // ── Calculate Percentage ──
    function updateProgressUI() {
        const total = checkboxes.length;
        if(total === 0) return;

        let checkedCount = 0;
        checkboxes.forEach(box => {
            if (box.checked) checkedCount++;
        });

        const percentage = Math.round((checkedCount / total) * 100);

        // Update UI Ring and Text
        progressRingText.textContent = `${percentage}%`;
        progressRingCircle.style.setProperty('--percentage', `${percentage}%`);
        
        // Change color based on progress
        if (percentage === 100) {
            progressRingCircle.style.setProperty('--ring-color', '#27C93F'); // Green
        } else {
            progressRingCircle.style.setProperty('--ring-color', '#00F0FF'); // Blue
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
    // 3. CRASH AI TUTOR (STABLE GEMINI PRO INTEGRATION)
    // ═══════════════════════════════════════════════════════════════
    const GEMINI_API_KEY = 'AIzaSyD3Q4SPqncLu0fmYsud8vIVeptl_-17YI4'; 
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    const SYSTEM_PROMPT = "You are 'Crash AI Tutor', a helpful AI study assistant specifically for Indian government competitive exams (like SSC CGL, CAPF, AFCAT, etc.). Provide concise, accurate, and easy-to-understand study-related answers.\n\nUser Question: ";

    const aiTrigger = document.getElementById('aiTrigger');
    const aiChatPanel = document.getElementById('aiChatPanel');
    const closeChatBtn = document.getElementById('closeChat');
    const chatBody = document.querySelector('.chat-body');
    const chatInput = document.querySelector('.chat-footer input');
    const sendBtn = document.querySelector('.btn-send');

    // Toggle Chat Panel
    if(aiTrigger) {
        aiTrigger.addEventListener('click', () => {
            aiChatPanel.classList.toggle('active');
            if(aiChatPanel.classList.contains('active')) chatInput?.focus();
        });
    }

    if(closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            aiChatPanel.classList.remove('active');
        });
    }

    // Chat Message UI
    function appendMessage(text, sender) {
        if (!chatBody) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        
        if (sender === 'ai') {
            messageDiv.classList.add('ai-msg');
        } else {
            // User Styling
            messageDiv.style.background = 'var(--primary-blue)';
            messageDiv.style.color = '#000';
            messageDiv.style.marginLeft = 'auto';
            messageDiv.style.borderBottomRightRadius = '0';
            messageDiv.style.fontWeight = '600';
        }

        // Handle basic markdown formatting (bold)
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedText = formattedText.replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = formattedText;
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight; // Auto-scroll
    }

    function showLoading() {
        if(!chatBody) return;
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'ai-loading';
        loadingDiv.classList.add('message', 'ai-msg');
        loadingDiv.innerHTML = 'Thinking... 🤔';
        chatBody.appendChild(loadingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeLoading() {
        const loadingDiv = document.getElementById('ai-loading');
        if (loadingDiv) chatBody.removeChild(loadingDiv);
    }

    // Call Gemini API (Rock Solid Stable Version)
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

            // 🚨 Deep Error Handling
            if (data.error) {
                console.error("API Error Details:", data.error);
                appendMessage(`API Error: ${data.error.message}`, 'ai');
                return;
            }

            if (data.candidates && data.candidates.length > 0) {
                const candidate = data.candidates[0];
                
                // Blocked by Google Safety filters
                if (candidate.finishReason === 'SAFETY') {
                    appendMessage("I cannot answer that due to safety guidelines. Please ask a different study question.", 'ai');
                    return;
                }
                
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    appendMessage(candidate.content.parts[0].text, 'ai');
                } else {
                    appendMessage("Received an empty response from AI.", 'ai');
                }
            } else {
                appendMessage("Sorry, I couldn't process that properly. Please ask a study-related question.", 'ai');
            }
        } catch (error) {
            console.error("Gemini API Network Error:", error);
            removeLoading();
            appendMessage("Oops! Network issue. Make sure your internet is working.", 'ai');
        }
    }

    // Send Button Logic
    function handleSend() {
        if (!chatInput || !sendBtn) return;
        const question = chatInput.value.trim();
        if (question !== "") {
            appendMessage(question, 'user');
            chatInput.value = '';
            askGemini(question);
        }
    }

    if(sendBtn) sendBtn.addEventListener('click', handleSend);
    if(chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

});
