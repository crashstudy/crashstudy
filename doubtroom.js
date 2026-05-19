import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, addDoc, onSnapshot, doc, getDoc, updateDoc, deleteDoc, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    let currentUser = null;
    let isAdmin = false;

    // ── 1. Check Auth & Admin Status ──
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.placeholder = "Ask a doubt or help someone...";
            
            // Safe Admin verification
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists() && userSnap.data().role === 'admin') {
                    isAdmin = true;
                }
            } catch (err) {
                console.error("Admin verification failed:", err);
            }
        } else {
            currentUser = null;
            chatInput.disabled = true;
            sendBtn.disabled = true;
            chatInput.placeholder = "🔒 Please log in to join the discussion room.";
        }
        // Load messages once auth is stable
        listenChatRoom();
    });

    // ── 2. Helper: Generate Unique Muted Background Color Based on String ──
    function getUniqueUserColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Keeping colors in pleasant desaturated spectrum
        const h = Math.abs(hash % 360);
        return `hsl(${h}, 65%, 40%)`;
    }

    // ── 3. Listen to Live Messages (Ordered by Time) ──
    function listenChatRoom() {
        // Last 60 messages fetch karenge optimized tracking ke liye
        const chatQuery = query(collection(db, "room_messages"), orderBy("createdAt", "asc"), limit(60));
        
        onSnapshot(chatQuery, (snapshot) => {
            chatMessages.innerHTML = "";
            
            if (snapshot.empty) {
                chatMessages.innerHTML = "<p style='color: var(--text-muted); text-align:center; margin: auto;'>Room is empty. Drop a greeting to start the room!</p>";
                return;
            }

            snapshot.forEach((docSnap) => {
                const msgData = docSnap.data();
                const msgId = docSnap.id;
                
                const isMyMsg = currentUser && msgData.userId === currentUser.uid;
                const userColor = getUniqueUserColor(msgData.userId || 'guest');
                const firstLetter = (msgData.userName || 'A').charAt(0);
                
                const timeString = msgData.createdAt ? new Date(msgData.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

                // Outer Wrapper
                const msgWrapper = document.createElement('div');
                msgWrapper.className = `msg-wrapper ${isMyMsg ? 'my-msg' : ''}`;

                // Avatar Element (Only if not deleted)
                let avatarHtml = `<div class="user-avatar" style="background: ${userColor}">${firstLetter}</div>`;
                if(msgData.isDeleted) avatarHtml = `<div class="user-avatar" style="background: #2C3045; opacity:0.5;">🚫</div>`;

                // Content Bubble Builders
                let innerBubbleHtml = '';
                
                if (msgData.isDeleted) {
                    // Soft Deleted UI
                    innerBubbleHtml = `
                        <div class="msg-bubble">
                            <div class="msg-meta">
                                <span class="msg-username">${msgData.userName || 'Aspirant'}</span>
                                <span>${timeString}</span>
                            </div>
                            <div class="msg-text msg-deleted">🚫 This message was deleted by the user</div>
                        </div>
                    `;
                } else {
                    // Standard Active Message UI
                    let deleteActionBtn = '';
                    if (isMyMsg || isAdmin) {
                        deleteActionBtn = `
                            <div class="msg-actions">
                                <button class="del-btn" data-id="${msgId}" data-owner="${isMyMsg ? 'true' : 'false'}">
                                    🗑️ Delete
                                </button>
                            </div>
                        `;
                    }

                    const roleBadge = msgData.userRole === 'admin' ? `<span class="admin-badge">ADMIN</span>` : '';

                    innerBubbleHtml = `
                        <div class="msg-bubble">
                            <div class="msg-meta">
                                <span class="msg-username">${msgData.userName || 'Aspirant'}</span>
                                ${roleBadge}
                                <span>${timeString}</span>
                            </div>
                            <div class="msg-text">${escapeHtml(msgData.text)}</div>
                            ${deleteActionBtn}
                        </div>
                    `;
                }

                msgWrapper.innerHTML = avatarHtml + innerBubbleHtml;
                chatMessages.appendChild(msgWrapper);
            });

            // Auto Scroll to latest bottom message
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Link Event listeners for deletion dynamically
            document.querySelectorAll('.del-btn').forEach(btn => {
                btn.addEventListener('click', handleMessageDelete);
            });

        }, (error) => {
            console.error("Room Read Error:", error);
            chatMessages.innerHTML = "<p style='color: #FF4444; text-align:center;'>Room loading failed. Check access token.</p>";
        });
    }

    // ── 4. Trigger Post Message ──
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        if (!currentUser) return alert("Please sign-in.");

        sendBtn.disabled = true;

        try {
            await addDoc(collection(db, "room_messages"), {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email.split('@')[0],
                userRole: isAdmin ? 'admin' : 'student',
                text: text,
                createdAt: new Date().toISOString(),
                isDeleted: false
            });
            chatInput.value = "";
        } catch (err) {
            console.error("Failed to sync room message:", err);
            alert("Message transmission error.");
        }
        sendBtn.disabled = false;
        chatInput.focus();
    }

    // Listeners for triggers
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });

    // ── 5. Advanced Dynamic Destruction Handling ──
    async function handleMessageDelete(e) {
        const id = e.target.getAttribute('data-id');
        const isOwner = e.target.getAttribute('data-owner') === 'true';

        if (isAdmin) {
            // ADMIN: Absolute Permanent Clean-up (Hard Delete)
            if (confirm("Admin Command: Do you want to permanently erase this message from database?")) {
                try {
                    await deleteDoc(doc(db, "room_messages", id));
                } catch (err) {
                    alert("Admin authorization error.");
                }
            }
        } else if (isOwner) {
            // STUDENT/USER: Soft Delete (Text changes to "Deleted")
            if (confirm("Are you sure you want to withdraw your message?")) {
                try {
                    await updateDoc(doc(db, "room_messages", id), {
                        isDeleted: true,
                        text: "" // Clear out content safely
                    });
                } catch (err) {
                    alert("Action verification failed.");
                }
            }
        }
    }

    // XSS Security helper injection protection
    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
