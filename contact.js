import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, addDoc, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
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
            
            const nameEn = document.getElementById('nameEn');
            const emailEn = document.getElementById('emailEn');
            if(nameEn) nameEn.value = user.displayName || '';
            if(emailEn) emailEn.value = user.email || '';

            try {
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
            } catch (err) {
                console.error("Admin check failed:", err);
            }

            historySection.style.display = 'flex';
            loadAllMessages();
        } else {
            currentUser = null;
            isAdmin = false;
            historyTitle.innerHTML = "Community Support Board";
            historySection.style.display = 'flex';
            loadAllMessages();
        }
    });

    // ── 2. Load ALL Messages for Everyone ──
    function loadAllMessages() {
        const messagesRef = collection(db, "messages");
        
        onSnapshot(messagesRef, (snapshot) => {
            messageHistory.innerHTML = "";
            let tickets = [];

            snapshot.forEach((docSnap) => {
                let data = docSnap.data();
                data.id = docSnap.id;
                tickets.push(data);
            });

            tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            if (tickets.length === 0) {
                messageHistory.innerHTML = "<p style='color: var(--text-muted); text-align:center;'>No tickets yet. Be the first to ask!</p>";
                return;
            }

            tickets.forEach(ticket => {
                const dateString = new Date(ticket.createdAt).toLocaleDateString();
                const isMyTicket = currentUser && ticket.userId === currentUser.uid;
                
                let html = `
                    <div class="ticket-card" style="${isMyTicket ? 'border-left-color: #FF8A00;' : ''}">
                        <div class="ticket-date">
                            ${dateString} | <strong>${ticket.userName || 'Student'}</strong> 
                            ${isMyTicket ? '<span style="color:#FF8A00; font-size:0.75rem; margin-left:5px;">(Your Post)</span>' : ''}
                        </div>
                        <div class="ticket-msg">${ticket.text}</div>
                `;

                // ── Admin UI (Edit & Delete Included) ──
                if (isAdmin) {
                    if (ticket.adminReply) {
                        html += `
                            <div class="admin-reply-box" id="view-mode-${ticket.id}">
                                <strong style="color: var(--pink);">Your Response:</strong>
                                <p class="admin-reply-text">${ticket.adminReply}</p>
                                <div style="margin-top: 10px; display: flex; gap: 10px;">
                                    <button onclick="window.toggleEdit('${ticket.id}')" style="padding: 5px 12px; font-size: 0.8rem; background: #FF8A00; color: white; border: none; border-radius: 5px; cursor: pointer;">✏️ Edit</button>
                                    <button onclick="window.deleteTicket('${ticket.id}')" style="padding: 5px 12px; font-size: 0.8rem; background: #FF4444; color: white; border: none; border-radius: 5px; cursor: pointer;">🗑️ Delete</button>
                                </div>
                            </div>
                            
                            <div class="admin-reply-area" id="edit-mode-${ticket.id}" style="display: none; margin-top: 10px;">
                                <textarea id="reply-${ticket.id}" class="reply-input" rows="2" style="width:100%; margin-bottom:10px; padding:10px; border-radius:8px;">${ticket.adminReply}</textarea>
                                <div style="display: flex; gap: 10px;">
                                    <button onclick="window.postReply('${ticket.id}')" class="submit-btn" style="padding: 5px 15px; font-size: 0.85rem;">Update</button>
                                    <button onclick="window.toggleEdit('${ticket.id}')" style="padding: 5px 15px; font-size: 0.85rem; background: #555; color: white; border: none; border-radius: 20px; cursor: pointer;">Cancel</button>
                                </div>
                            </div>
                        `;
                    } else {
                        html += `
                            <div class="admin-reply-area" style="margin-top: 10px;">
                                <textarea id="reply-${ticket.id}" class="reply-input" rows="2" style="width:100%; margin-bottom:10px; padding:10px; border-radius:8px;" placeholder="Write official reply..."></textarea>
                                <div style="display: flex; gap: 10px;">
                                    <button onclick="window.postReply('${ticket.id}')" class="submit-btn" style="padding: 5px 15px; font-size: 0.85rem;">Post Reply</button>
                                    <button onclick="window.deleteTicket('${ticket.id}')" style="padding: 5px 12px; font-size: 0.85rem; background: #FF4444; color: white; border: none; border-radius: 20px; cursor: pointer;">🗑️ Delete Ticket</button>
                                </div>
                            </div>
                        `;
                    }
                } 
                // ── User UI ──
                else if (ticket.adminReply) {
                    html += `<div class="admin-reply-box"><strong>CrashStudy Support:</strong><p class="admin-reply-text">${ticket.adminReply}</p></div>`;
                } else {
                    html += `<div class="admin-reply-box" style="opacity: 0.6; font-size: 0.85rem;"><em>Awaiting Response...</em></div>`;
                }

                html += `</div>`;
                messageHistory.innerHTML += html;
            });
        }, (error) => {
            console.error("Firebase Read Error:", error);
            messageHistory.innerHTML = "<p style='color: #FF4444;'>Failed to load tickets. Please check if you are logged in.</p>";
        });
    }

    // ── 3. Submit New Ticket ──
    async function submitTicket(nameId, emailId, msgId, btnId) {
        if (!currentUser) {
            alert("Please log in to submit a ticket!");
            window.location.href = "auth.html?redirect=contact.html";
            return;
        }

        const name = document.getElementById(nameId).value;
        const email = document.getElementById(emailId).value;
        const text = document.getElementById(msgId).value;
        const btn = document.getElementById(btnId);

        if (!text) return alert("Message cannot be empty!");

        btn.disabled = true;
        btn.textContent = "Posting...";

        try {
            await addDoc(collection(db, "messages"), {
                userId: currentUser.uid,
                userName: name || "Aspirant",
                userEmail: email || "No Email",
                text: text,
                createdAt: new Date().toISOString(),
                adminReply: ""
            });
            document.getElementById(msgId).value = "";
        } catch (e) { 
            console.error("Error submitting ticket:", e); 
            alert("Failed to submit. Please try again.");
        }
        
        btn.disabled = false;
        btn.textContent = nameId === 'nameEn' ? "Submit Ticket" : "टिकट जमा करें";
    }

    const btnEn = document.getElementById('btnEn');
    const btnHi = document.getElementById('btnHi');

    if (btnEn) btnEn.addEventListener('click', () => submitTicket('nameEn', 'emailEn', 'msgEn', 'btnEn'));
    if (btnHi) btnHi.addEventListener('click', () => submitTicket('nameHi', 'emailHi', 'msgHi', 'btnHi'));

    // ── 4. Global Admin Functions (Edit, Delete, Reply) ──
    window.postReply = async (id) => {
        const reply = document.getElementById(`reply-${id}`).value;
        if (!reply) return alert("Reply cannot be empty.");
        
        try {
            await updateDoc(doc(db, "messages", id), { 
                adminReply: reply,
                repliedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error(err);
            alert("Failed to post reply.");
        }
    };

    window.toggleEdit = (id) => {
        const viewMode = document.getElementById(`view-mode-${id}`);
        const editMode = document.getElementById(`edit-mode-${id}`);
        if (viewMode.style.display === "none") {
            viewMode.style.display = "block";
            editMode.style.display = "none";
        } else {
            viewMode.style.display = "none";
            editMode.style.display = "block";
        }
    };

    window.deleteTicket = async (id) => {
        if (confirm("Are you sure you want to permanently delete this ticket?")) {
            try {
                await deleteDoc(doc(db, "messages", id));
            } catch (e) {
                console.error("Error deleting:", e);
                alert("Failed to delete ticket. Check permissions.");
            }
        }
    };
});
