/**
 * ═══════════════════════════════════════════════════════════════
 * CrashStudy — contact.js
 * Syncs Support Tickets with Firebase and handles Admin Panel logic
 * ═══════════════════════════════════════════════════════════════
 */

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, addDoc, onSnapshot, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    const historySection = document.getElementById('historySection');
    const messageHistory = document.getElementById('messageHistory');
    const historyTitle = document.getElementById('historyTitle');

    let currentUser = null;
    let isAdmin = false;

    // ── 1. Check Auth & Admin Status ──
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            
            // Auto-fill form fields if logged in
            document.getElementById('nameEn').value = user.displayName || '';
            document.getElementById('emailEn').value = user.email || '';
            document.getElementById('nameHi').value = user.displayName || '';
            document.getElementById('emailHi').value = user.email || '';

            // Check if user is an Admin
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().role === 'admin') {
                isAdmin = true;
                historyTitle.textContent = "Admin Command Center - All Tickets";
                historyTitle.style.color = "#FF007A"; // Pink for admin
            }

            // Show history section and load messages
            historySection.style.display = 'flex';
            loadMessages();
        } else {
            // Not logged in: They can still see the form, but let's encourage login
            historySection.style.display = 'flex';
            messageHistory.innerHTML = `<p style="color: var(--text-muted);">Please <a href="auth.html?redirect=contact.html" style="color: var(--accent);">log in</a> to view your past support tickets and track responses.</p>`;
        }
    });

    // ── 2. Handle Form Submission (English & Hindi) ──
    async function submitTicket(nameId, emailId, msgId, btnId) {
        if (!currentUser) {
            alert("Please log in to submit a support ticket.");
            window.location.href = 'auth.html?redirect=contact.html';
            return;
        }

        const name = document.getElementById(nameId).value.trim();
        const email = document.getElementById(emailId).value.trim();
        const text = document.getElementById(msgId).value.trim();
        const btn = document.getElementById(btnId);

        if (!name || !email || !text) {
            alert("Please fill out all fields.");
            return;
        }

        btn.disabled = true;
        btn.textContent = "Sending...";

        try {
            await addDoc(collection(db, "messages"), {
                userId: currentUser.uid,
                userName: name,
                userEmail: email,
                text: text,
                createdAt: new Date().toISOString(),
                status: "Pending",
                adminReply: ""
            });
            
            document.getElementById(msgId).value = ""; // Clear message box
            alert("Ticket submitted successfully! We will review it shortly.");
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Error sending message. Please try again.");
        } finally {
            btn.disabled = false;
            btn.textContent = nameId === 'nameEn' ? "Submit Ticket" : "टिकट जमा करें";
        }
    }

    document.getElementById('btnEn').addEventListener('click', () => submitTicket('nameEn', 'emailEn', 'msgEn', 'btnEn'));
    document.getElementById('btnHi').addEventListener('click', () => submitTicket('nameHi', 'emailHi', 'msgHi', 'btnHi'));

    // ── 3. Real-Time Message Listener ──
    function loadMessages() {
        const messagesRef = collection(db, "messages");
        
        // Listen to ALL messages. We will filter them locally to avoid 
        // forcing you to set up complex Firestore Indexing rules right now.
        onSnapshot(messagesRef, (snapshot) => {
            messageHistory.innerHTML = "";
            let tickets = [];

            snapshot.forEach((doc) => {
                let data = doc.data();
                data.id = doc.id;
                // If Admin: Push all. If User: Push only theirs.
                if (isAdmin || data.userId === currentUser.uid) {
                    tickets.push(data);
                }
            });

            // Sort by newest first
            tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            if (tickets.length === 0) {
                messageHistory.innerHTML = "<p>No support tickets found.</p>";
                return;
            }

            tickets.forEach(ticket => {
                const dateString = new Date(ticket.createdAt).toLocaleString();
                
                let html = `
                    <div class="ticket-card ${isAdmin ? 'admin-view' : ''}">
                        <div class="ticket-date">${dateString} ${isAdmin ? `| <strong>From: ${ticket.userName}</strong>` : ''}</div>
                        <div class="ticket-msg">${ticket.text}</div>
                `;

                // If Admin: Show Reply Input OR Existing Reply
                if (isAdmin) {
                    if (ticket.adminReply) {
                        html += `<div class="admin-reply-box"><strong style="color: var(--pink);">You Replied:</strong><p class="admin-reply-text">${ticket.adminReply}</p></div>`;
                    } else {
                        html += `
                            <div class="admin-reply-area">
                                <textarea id="reply-${ticket.id}" class="reply-input" rows="2" placeholder="Type official response..."></textarea>
                                <button onclick="window.sendAdminReply('${ticket.id}')" class="submit-btn" style="padding: 8px 15px; font-size: 0.9rem;">Send Reply</button>
                            </div>
                        `;
                    }
                } 
                // If Regular User: Show Admin's Reply or Pending status
                else {
                    if (ticket.adminReply) {
                        html += `<div class="admin-reply-box"><strong>CrashStudy Support:</strong><p class="admin-reply-text">${ticket.adminReply}</p></div>`;
                    } else {
                        html += `<div class="admin-reply-box" style="opacity: 0.6;"><em>Status: Pending Review</em></div>`;
                    }
                }

                html += `</div>`;
                messageHistory.innerHTML += html;
            });
        });
    }

    // ── 4. Admin Reply Function (Attached to window so inline onClick works) ──
    window.sendAdminReply = async (messageId) => {
        const replyText = document.getElementById(`reply-${messageId}`).value.trim();
        if (!replyText) return alert("Reply cannot be empty.");
        
        try {
            const msgRef = doc(db, "messages", messageId);
            await updateDoc(msgRef, {
                adminReply: replyText,
                status: "Replied",
                repliedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error updating reply:", error);
            alert("Failed to send reply.");
        }
    };
});
