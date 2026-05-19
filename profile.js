/**
 * ═══════════════════════════════════════════════════════════════
 * CrashStudy — profile.js
 * Syncs user data securely with Firebase Auth & Firestore
 * ═══════════════════════════════════════════════════════════════
 */

import { onAuthStateChanged, updateProfile, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileStreak = document.getElementById('profileStreak');
    
    const inputName = document.getElementById('inputName');
    const inputAge = document.getElementById('inputAge');
    const inputGender = document.getElementById('inputGender');
    const inputExam = document.getElementById('inputExam');
    
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const statusMessage = document.getElementById('statusMessage');
    const logoutBtn = document.getElementById('logoutBtn');

    let currentUser = null;

    // ── 1. Auth State & Smart Routing ──
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            
            // Set base auth info
            const displayName = user.displayName || user.email.split('@')[0];
            profileName.textContent = displayName;
            profileEmail.textContent = user.email;
            inputName.value = displayName;
            profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00F0FF&color=000`;

            // Fetch extra data from Firestore
            await loadFirestoreData(user.uid);
            
            // Initialize Chart after verifying user
            initChart();
        } else {
            // Not logged in? Kick them to auth page with a return redirect
            window.location.href = 'auth.html?redirect=profile.html';
        }
    });

    // ── 2. Load Firestore Data ──
    async function loadFirestoreData(uid) {
        try {
            const userRef = doc(db, 'users', uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Update UI with stored data
                if (data.streak) profileStreak.textContent = `🔥 ${data.streak} Days`;
                if (data.age) inputAge.value = data.age;
                if (data.gender) inputGender.value = data.gender;
                if (data.targetExam) inputExam.value = data.targetExam;
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        }
    }

    // ── 3. Save / Sync Data ──
    saveProfileBtn.addEventListener('click', async () => {
        if (!currentUser) return;

        saveProfileBtn.textContent = 'Syncing...';
        statusMessage.textContent = '';
        statusMessage.className = 'status-msg';

        const newName = inputName.value.trim();
        const newAge = inputAge.value.trim();
        const newGender = inputGender.value;
        const newExam = inputExam.value;

        try {
            // 1. Update Auth Profile (if name changed)
            if (newName && newName !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: newName });
                profileName.textContent = newName;
                profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=00F0FF&color=000`;
            }

            // 2. Update Firestore Document (merge:true preserves streak/progress from syllabus.js)
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                age: newAge || null,
                gender: newGender || null,
                targetExam: newExam || null,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // Success State
            statusMessage.textContent = '✓ Profile synchronized successfully.';
            statusMessage.classList.add('success');
            
        } catch (error) {
            console.error("Update error:", error);
            statusMessage.textContent = 'Failed to sync data. Please try again.';
            statusMessage.classList.add('error');
        } finally {
            saveProfileBtn.textContent = 'Sync Data to Server';
            setTimeout(() => { statusMessage.textContent = ''; }, 4000);
        }
    });

    // ── 4. Logout Logic ──
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        });
    });

    // ── 5. Analytics Chart.js Rendering ──
    function initChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        // Neon Gradient for Chart Line
        let gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255, 0, 122, 0.4)'); // Pink
        gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)'); // Cyan fade

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                datasets: [{
                    label: 'Mock Test Score (%)',
                    data: [42, 48, 55, 53, 68, 75], // Placeholder data
                    borderColor: '#FF007A',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#070913',
                    pointBorderColor: '#00F0FF',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.4 // Smooth waves
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        max: 100, 
                        grid: { color: 'rgba(255,255,255,0.05)' }, 
                        ticks: { color: 'rgba(140, 155, 200, 0.5)' } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: 'rgba(140, 155, 200, 0.5)' } 
                    }
                }
            }
        });
    }
});
