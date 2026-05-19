/**
 * ═══════════════════════════════════════════════════════════════
 * CrashStudy — contact.js (Public Mode)
 * Sabhi users ko saare tickets dikhenge
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
            
            // Auto-fill inputs
            document.getElementById('nameEn').value = user.displayName || '';
            document.getElementById('emailEn').value = user.email || '';

            // Admin Check
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().role === 'admin') {
                isAdmin = true;
                historyTitle.innerHTML = "Admin Control - All Tickets";
                historyTitle.style.color = "#FF007A";
            } else {
                historyTitle.innerHTML = "Community Support Board";
                historyTitle.style.color = "#00F0FF";
            }

            historySection.style.display = 'flex';
            loadAllMessages(); // Sabke messages load karega
        } else {
            historySection.style.display = 'flex';
            messageHistory.innerHTML = `<p style="color: var(--text-muted); text-align:center;">Please <a href="auth.html?redirect=contact.html" style="color: var(--accent);">log in</a> to participate in the support board.</p>`;
        }
    });

    // ── 2. Load ALL Messages for Everyone ──
    function loadAllMessages() {
        const messagesRef = collection(db, "messages");
        
        onSnapshot(messagesRef, (snapshot) => {
            messageHistory.innerHTML = "";
            let tickets = [];

            snapshot.forEach((doc) => {
                let data = doc.data();
                data.id = doc.id;
                tickets.push(data); // Bina filter ke saare tickets add honge
            });

            // Newest first
            tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            if (tickets.length === 0) {
                messageHistory.innerHTML = "<p>No tickets yet. Be the first to ask!</p>";
                return;
            }

            tickets.forEach(ticket => {
                const dateString = new Date(ticket.createdAt).toLocaleDateString();
                const isMyTicket = currentUser && ticket.userId === currentUser.uid;
                
                let html = `
                    <div class="ticket-card" style="${isMyTicket ? 'border-left-color: #FF8A00;' : ''}">
                        <div class="ticket-date">
                            ${dateString} | <strong>${ticket.userName}</strong> 
                            ${isMyTicket ? '<span style="color:#FF8A00; font-size:0.7rem; margin-left:5px;">(Your Post)</span>' : ''}
                        </div>
                        <div class="ticket-msg">${ticket.text}</div>
                `;

                // Admin Reply Logic
                if (isAdmin) {
                    if (ticket.adminReply) {
                        html += `<div class="admin-reply-box"><strong style="color: var(--pink);">Your Response:</strong><p class="admin-reply-text">${ticket.adminReply}</p></div>`;
                    } else {
                        html += `
                            <div class="admin-reply-area">
                                <textarea id="reply-${ticket.id}" class="reply-input" rows="2" style="width:100%; margin-bottom:10px; padding:10px;" placeholder="Write a reply..."></textarea>
                                <button onclick="window.sendAdminReply('${ticket.id}')" class="submit-btn" style="padding: 5px 15px; font-size: 0.8rem;">Post Official Reply</button>
                            </div>
                        `;
                    }
                } else if (ticket.adminReply) {
                    html += `<div class="admin-reply-box"><strong>CrashStudy Support:</strong><p class="admin-reply-text">${ticket.adminReply}</p></div>`;
                }

                html += `</div>`;
                messageHistory.innerHTML += html;
            });
        });
    }

    // Submission logic (Same as before)
    window.submitTicket = async (nameId, emailId, msgId, btnId) => {
        const name = document.getElementById(nameId).value;
        const email = document.getElementById(emailId).value;
        const text = document.getElementById(msgId).value;
        const btn = document.getElementById(btnId);

        if (!text) return alert("Message cannot be empty!");

        btn.disabled = true;
        try {
            await addDoc(collection(db, "messages"), {
                userId: currentUser.uid,
                userName: name,
                userEmail: email,
                text: text,
                createdAt: new Date().toISOString(),
                adminReply: ""
            });
            document.getElementById(msgId).value = "";
        } catch (e) { console.error(e); }
        btn.disabled = false;
    };

    document.getElementById('btnEn').addEventListener('click', () => submitTicket('nameEn', 'emailEn', 'msgEn', 'btnEn'));
    document.getElementById('btnHi').addEventListener('click', () => submitTicket('nameHi', 'emailHi', 'msgHi', 'btnHi'));

    window.sendAdminReply = async (id) => {
        const reply = document.getElementById(`reply-${id}`).value;
        if (!reply) return;
        await updateDoc(doc(db, "messages", id), { adminReply: reply });
    };
});
"Type official response..."></textarea>
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
