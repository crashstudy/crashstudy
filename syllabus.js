// syllabus.js - Final AI Integrated & Redesigned UI
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth } from './firebase.js'; // path ensure kar lena sahi ho

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. FIREBASE AUTH LOGIC (UNCHANGED) ---
    const userGreeting = document.getElementById('userNameDisplay');
    const userAvatar = document.getElementById('userAvatarDisplay');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User login hai
            const name = user.displayName || user.email.split('@')[0];
            if (userGreeting) userGreeting.textContent = name;
            // Generate neutral avatar from name
            if (userAvatar) userAvatar.src = `https://ui-avatars.com/api/?name=${name}&background=00F0FF&color=000&bold=true`;
            console.log("Syllabus page: User logged in.");
        } else {
            // User login nahi hai, index pe bhej do
            console.log("No user, redirecting to login.");
            window.location.href = 'index.html'; 
        }
    });

    // --- 2. SIDEBAR & ACCORDION UI LOGIC (UNCHANGED) ---
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

    // Accordion
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

    // --- 3. CRASH AI TUTOR (REDESIGNED UI & GEMINI INTEGRATION) ---
    
    // API CONFIG (⚠️ User provided key - keep secure in production)
    const GEMINI_API_KEY = 'AIzaSyD3Q4SPqncLu0fmYsud8vIVeptl_-17YI4'; 
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    // AI ka personality system prompt
    const SYSTEM_PROMPT = "You are 'Crash AI Tutor', a helpful AI study assistant specifically for Indian government competitive exams (like SSC CGL, CAPF, AFCAT, etc.). Provide concise, accurate, and easy-to-understand study-related answers. Current question: ";

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
            if(aiChatPanel.classList.contains('active')) {
                chatInput?.focus();
            }
        });
    }

    if(closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            aiChatPanel.classList.remove('active');
        });
    }

    // Function to add a message bubble to the UI (With New Design)
    function appendMessage(text, sender) {
        if (!chatBody) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        // Avatar wrapper for AI
        if (sender === 'ai') {
            const avatarDiv = document.createElement('div');
            avatarDiv.classList.add('ai-avatar');
            avatarDiv.textContent = '🧠'; // AI Icon
            messageDiv.appendChild(avatarDiv);
        }

        const textDiv = document.createElement('div');
        textDiv.classList.add('text-bubble');
        
        // Handling line breaks
        textDiv.innerHTML = text.replace(/\n/g, '<br>');
        
        messageDiv.appendChild(textDiv);
        chatBody.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Function to show a loading indicator
    function showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'ai-loading';
        loadingDiv.classList.add('message', 'ai', 'loading');
        
        loadingDiv.innerHTML = `
            <div class="ai-avatar">🧠</div>
            <div class="text-bubble">
                <div class="dot-typing"></div>
            </div>
        `;
        chatBody.appendChild(loadingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeLoading() {
        const loadingDiv = document.getElementById('ai-loading');
        if (loadingDiv) chatBody.removeChild(loadingDiv);
    }

    // Main Function to talk to Gemini API
    async function askGemini(question) {
        try {
            showLoading(); // UI update: loading
            
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: SYSTEM_PROMPT + question // Combining personality with the question
                        }]
                    }]
                })
            });

            const data = await response.json();
            removeLoading(); // UI update: remove loading

            if (data.candidates && data.candidates.length > 0) {
                const answer = data.candidates[0].content.parts[0].text;
                appendMessage(answer, 'ai');
            } else {
                appendMessage("Sorry, I couldn't understand that. Please ask a study-related question.", 'ai');
            }

        } catch (error) {
            console.error("Gemini API Error:", error);
            removeLoading();
            appendMessage("Oops! Network issue. Make sure your internet is working.", 'ai');
        }
    }

    // Handling Send Logic
    function handleSend() {
        if (!chatInput || !sendBtn) return;
        const question = chatInput.value.trim();
        if (question !== "") {
            appendMessage(question, 'user'); // Show User's question
            chatInput.value = ''; // Clear input field
            askGemini(question); // Send to AI
        }
    }

    // Click Send
    sendBtn?.addEventListener('click', handleSend);

    // Press Enter to Send
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });
});
