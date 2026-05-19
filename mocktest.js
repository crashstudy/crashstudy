// FIREBASE IMPORTS
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase.js';

document.addEventListener("DOMContentLoaded", () => {
    
    // --- MOCK DATA ---
    const mockQuestions = [
        {
            id: 1, section: "quant",
            question: "A reduction of 20% in the price of sugar enables a purchaser to obtain 4 kg more for $160. What is the original price per kg of sugar?",
            options: ["$8.00 per kg", "$10.00 per kg", "$12.50 per kg", "$9.00 per kg"],
            correctAnswer: 1, 
            aiInsight: "Shortcut Hack: Price ∝ 1/Quantity. Reduction of 20% means price ratio is 5:4, so quantity ratio becomes 4:5. Change is 1 unit = 4kg. Original qty = 16kg. Price = 160/16 = $10."
        },
        {
            id: 2, section: "quant",
            question: "If tan θ + sec θ = 3, where θ is an acute angle, then what is the value of sin θ?",
            options: ["3/5", "4/5", "1/3", "2/3"],
            correctAnswer: 1, 
            aiInsight: "Trick: sec²θ - tan²θ = 1. So sec θ - tan θ = 1/3. Adding gives 2 sec θ = 10/3 => sec θ = 5/3. Triplet is 3-4-5. sin θ = 4/5."
        },
        {
            id: 3, section: "english",
            question: "Identify the part of the sentence containing a grammatical error: 'Neither the team captain nor the players was present at the press conference.'",
            options: ["Neither the team captain", "nor the players", "was present", "at the press conference"],
            correctAnswer: 2, 
            aiInsight: "Rule of Proximity: Verb agrees with closer subject. 'players' is plural, so 'was' should be 'were'."
        },
        {
            id: 4, section: "english",
            question: "Choose the exact antonym for the high-frequency word: **EPHEMERAL**",
            options: ["Transient", "Perpetual", "Evanescent", "Fugacious"],
            correctAnswer: 1, 
            aiInsight: "Ephemeral = Short-lived. Antonym is Perpetual = Everlasting."
        },
        {
            id: 5, section: "gk",
            question: "Which specific atmospheric layer contains the highest concentration of Ozone?",
            options: ["Troposphere", "Mesosphere", "Stratosphere", "Thermosphere"],
            correctAnswer: 2, 
            aiInsight: "Ozone is in the Stratosphere, protecting from UV rays."
        }
    ];

    // --- STATE MANAGEMENT ---
    let currentQuestionIndex = 0;
    let userAnswers = new Array(mockQuestions.length).fill(null);
    let questionStates = new Array(mockQuestions.length).fill("unvisited"); 
    let isPracticeMode = false;
    let totalSecondsLeft = 3600; // 60 minutes
    let questionSecondsSpent = 0;
    let streakMultiplier = 0;
    let globalTimerInterval = null;
    let perQuestionTimerInterval = null;

    // --- FIREBASE AUTH & EXAM STATE ---
    let currentUser = null;
    let hasAttemptedRealTest = false;
    const TEST_ID = "mock_cgl_24"; // Unique ID for this test

    // --- DOM ELEMENT CACHE TARGETS ---
    const loginOverlay = document.getElementById("loginOverlay");
    const startScreen = document.getElementById("startScreen");
    const arenaMain = document.getElementById("arenaMain");
    const enterArenaBtn = document.getElementById("enterArenaBtn");
    const modeToggle = document.getElementById("modeToggle");
    const practiceBadge = document.getElementById("practiceBadge");
    const questionContentText = document.getElementById("questionContentText");
    const qNumberText = document.getElementById("qNumberText");
    const optionsContainer = document.getElementById("optionsContainer");
    const aiExplanationDrawer = document.getElementById("aiExplanationDrawer");
    const aiExplanationText = document.getElementById("aiExplanationText");
    const questionPaletteGrid = document.getElementById("questionPaletteGrid");
    
    const globalTimer = document.getElementById("globalTimer");
    const qTimer = document.getElementById("qTimer");
    const streakCount = document.getElementById("streakCount");
    
    const saveNextBtn = document.getElementById("saveNextBtn");
    const markReviewBtn = document.getElementById("markReviewBtn");
    const clearResponseBtn = document.getElementById("clearResponseBtn");
    const submitTestBtn = document.getElementById("submitTestBtn");
    
    const submitModal = document.getElementById("submitModal");
    const cancelSubmitBtn = document.getElementById("cancelSubmitBtn");
    const confirmSubmitBtn = document.getElementById("confirmSubmitBtn");
    const reportDashboard = document.getElementById("reportDashboard");
    
    const mobilePaletteToggle = document.getElementById("mobilePaletteToggle");
    const palettePane = document.getElementById("palettePane");
    const userGreetingText = document.getElementById("userGreetingText");
    const sidebarUserName = document.getElementById("sidebarUserName");


    // ═══════════════════════════════════════════════════════════════
    // FIREBASE AUTH & ATTEMPT CHECK
    // ═══════════════════════════════════════════════════════════════
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            loginOverlay.style.display = 'none';
            const name = user.displayName || user.email.split('@')[0];
            userGreetingText.innerText = `Welcome, ${name}!`;
            sidebarUserName.innerText = name;

            // Check if user already took the test
            const attemptRef = doc(db, 'leaderboard', TEST_ID, 'entries', user.uid);
            const snap = await getDoc(attemptRef);
            if (snap.exists()) {
                hasAttemptedRealTest = true;
            }
        } else {
            currentUser = null;
            loginOverlay.style.display = 'flex';
        }
    });


    // --- 1. CORE ARENA INITIALIZATION & FULLSCREEN HANDLING ---
    enterArenaBtn.addEventListener("click", () => {
        isPracticeMode = modeToggle.checked;
        
        // Blocking multiple attempts in Real Mode
        if (!isPracticeMode && hasAttemptedRealTest) {
            alert("⚠️ You have already submitted the Live Test! You can only retake this test in 'Practice Mode'. Enable Practice Mode to continue.");
            return;
        }

        if(isPracticeMode) {
            practiceBadge.classList.remove("hidden");
        }

        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("Fullscreen request rejected.", err);
            });
        }

        startScreen.classList.add("hidden");
        arenaMain.classList.remove("hidden");
        
        initPaletteMatrix();
        loadQuestion(0);
        startTimers();
    });

    // --- 2. TIMER SYSTEM MECHANICS ---
    function startTimers() {
        globalTimerInterval = setInterval(() => {
            if (totalSecondsLeft <= 0) {
                autoSubmitExam();
            } else {
                totalSecondsLeft--;
                let mins = Math.floor(totalSecondsLeft / 60);
                let secs = totalSecondsLeft % 60;
                globalTimer.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        }, 1000);

        perQuestionTimerInterval = setInterval(() => {
            questionSecondsSpent++;
            let qMins = Math.floor(questionSecondsSpent / 60);
            let qSecs = questionSecondsSpent % 60;
            qTimer.innerText = `${qMins.toString().padStart(2, '0')}:${qSecs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    function resetQuestionTimer() {
        questionSecondsSpent = 0;
        qTimer.innerText = "00:00";
    }

    // --- 3. PALETTE MATRIX POPULATION ENGINE ---
    function initPaletteMatrix() {
        questionPaletteGrid.innerHTML = "";
        mockQuestions.forEach((q, index) => {
            const node = document.createElement("div");
            node.className = `p-node ${questionStates[index]}`;
            node.innerText = index + 1;
            node.setAttribute("data-index", index);
            node.addEventListener("click", () => {
                saveCurrentStateWithoutAdvancing();
                loadQuestion(index);
            });
            questionPaletteGrid.appendChild(node);
        });
    }

    function updatePaletteUI() {
        const nodes = questionPaletteGrid.querySelectorAll(".p-node");
        nodes.forEach((node, idx) => {
            node.className = `p-node ${questionStates[idx]}`;
            if(idx === currentQuestionIndex) {
                node.classList.add("active");
            }
        });
    }

    // --- 4. DATA RENDER PIPELINE ---
    function loadQuestion(index) {
        currentQuestionIndex = index;
        const qData = mockQuestions[index];
        
        qNumberText.innerText = `Question #${index + 1}`;
        questionContentText.innerText = qData.question;
        
        if(questionStates[index] === "unvisited") {
            questionStates[index] = "unanswered";
        }

        optionsContainer.innerHTML = "";
        qData.options.forEach((optText, optIdx) => {
            const optNode = document.createElement("div");
            optNode.className = "option-node";
            if(userAnswers[index] === optIdx) optNode.classList.add("selected");
            
            optNode.innerHTML = `
                <span class="opt-index">${String.fromCharCode(65 + optIdx)}</span>
                <span class="opt-text">${optText}</span>
            `;

            optNode.addEventListener("click", () => {
                selectOption(optIdx);
            });
            optionsContainer.appendChild(optNode);
        });

        if(isPracticeMode) {
            aiExplanationDrawer.classList.remove("hidden");
            if(userAnswers[index] !== null) {
                aiExplanationText.innerText = qData.aiInsight;
            } else {
                aiExplanationText.innerText = "Selecting an option will reveal the concept calculation immediately.";
            }
        } else {
            aiExplanationDrawer.classList.add("hidden");
        }

        resetQuestionTimer();
        updatePaletteUI();
    }

    function selectOption(optIndex) {
        userAnswers[currentQuestionIndex] = optIndex;
        questionStates[currentQuestionIndex] = "answered";
        
        const nodes = optionsContainer.querySelectorAll(".option-node");
        nodes.forEach((n, idx) => {
            if(idx === optIndex) n.classList.add("selected");
            else n.classList.remove("selected");
        });

        if(isPracticeMode) {
            aiExplanationText.innerText = mockQuestions[currentQuestionIndex].aiInsight;
            if(optIndex === mockQuestions[currentQuestionIndex].correctAnswer) {
                streakMultiplier++;
                streakCount.innerText = `${streakMultiplier}x Active`;
            } else {
                streakMultiplier = 0;
                streakCount.innerText = `0x Multiplier`;
            }
        }
        updatePaletteUI();
    }

    function advanceToNextQuestion() {
        if(currentQuestionIndex < mockQuestions.length - 1) {
            loadQuestion(currentQuestionIndex + 1);
        } else {
            alert("You have reached the end of the test. Please review your matrix or submit.");
        }
    }

    function saveCurrentStateWithoutAdvancing() {
        if(userAnswers[currentQuestionIndex] !== null && questionStates[currentQuestionIndex] !== "review") {
            questionStates[currentQuestionIndex] = "answered";
        }
    }

    saveNextBtn.addEventListener("click", () => {
        if(userAnswers[currentQuestionIndex] !== null) {
            questionStates[currentQuestionIndex] = "answered";
        } else {
            questionStates[currentQuestionIndex] = "unanswered";
        }
        advanceToNextQuestion();
    });

    markReviewBtn.addEventListener("click", () => {
        questionStates[currentQuestionIndex] = "review";
        advanceToNextQuestion();
    });

    clearResponseBtn.addEventListener("click", () => {
        userAnswers[currentQuestionIndex] = null;
        questionStates[currentQuestionIndex] = "unanswered";
        const nodes = optionsContainer.querySelectorAll(".option-node");
        nodes.forEach(n => n.classList.remove("selected"));
        if(isPracticeMode) {
            aiExplanationText.innerText = "Selecting an option will reveal the concept calculation immediately.";
        }
        updatePaletteUI();
    });

    // --- 6. KEYBOARD EVENT SYSTEM ---
    document.addEventListener("keydown", (e) => {
        if(!startScreen.classList.contains("hidden") || !reportDashboard.classList.contains("hidden")) return;
        if(["1", "2", "3", "4"].includes(e.key)) {
            const targetIdx = parseInt(e.key) - 1;
            selectOption(targetIdx);
        } else if (e.key === "Enter") {
            saveNextBtn.click();
        }
    });

    mobilePaletteToggle.addEventListener("click", () => {
        palettePane.classList.toggle("mobile-open");
    });
    questionPaletteGrid.addEventListener("click", (e) => {
        if(e.target.classList.contains("p-node")) {
            palettePane.classList.remove("mobile-open");
        }
    });

    // --- 8. SUBMISSION & DATABASE LOGIC ---
    submitTestBtn.addEventListener("click", () => {
        let ansCount = userAnswers.filter(a => a !== null).length;
        let revCount = questionStates.filter(s => s === "review").length;
        let unansCount = mockQuestions.length - ansCount;

        document.getElementById("summaryAnswered").innerText = ansCount;
        document.getElementById("summaryUnanswered").innerText = unansCount;
        document.getElementById("summaryMarked").innerText = revCount;

        submitModal.classList.remove("hidden");
    });

    cancelSubmitBtn.addEventListener("click", () => submitModal.classList.add("hidden"));

    confirmSubmitBtn.addEventListener("click", () => {
        submitModal.classList.add("hidden");
        executeFinalEvaluation();
    });

    function autoSubmitExam() {
        submitModal.classList.add("hidden");
        executeFinalEvaluation();
    }

    function formatTimeDisplay(seconds) {
        let m = Math.floor(seconds / 60);
        let s = seconds % 60;
        return `${m}m ${s}s`;
    }

    async function executeFinalEvaluation() {
        clearInterval(globalTimerInterval);
        clearInterval(perQuestionTimerInterval);
        
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }

        let rawScore = 0;
        let correctTally = 0;
        let attemptedTally = 0;

        mockQuestions.forEach((q, idx) => {
            if(userAnswers[idx] !== null) {
                attemptedTally++;
                if(userAnswers[idx] === q.correctAnswer) {
                    rawScore += 2;
                    correctTally++;
                } else {
                    rawScore -= 0.5;
                }
            }
        });

        let totalPossibleMarks = mockQuestions.length * 2;
        let accuracyPct = attemptedTally > 0 ? Math.round((correctTally / attemptedTally) * 100) : 0;
        let timeTakenSecs = 3600 - totalSecondsLeft;

        document.getElementById("finalScoreVal").innerText = `${rawScore.toFixed(2)} / ${totalPossibleMarks}`;
        document.getElementById("accuracyVal").innerText = `${accuracyPct}%`;
        
        arenaMain.classList.add("hidden");
        reportDashboard.classList.remove("hidden");

        // 📝 Database Save & Leaderboard Generation
        if (!isPracticeMode && currentUser) {
            try {
                // Save attempt
                const attemptRef = doc(db, 'leaderboard', TEST_ID, 'entries', currentUser.uid);
                await setDoc(attemptRef, {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName || currentUser.email.split('@')[0],
                    score: rawScore,
                    timeSpent: timeTakenSecs,
                    accuracy: accuracyPct,
                    timestamp: new Date().toISOString()
                });
                hasAttemptedRealTest = true; 
            } catch (err) {
                console.error("Error saving score:", err);
            }
        }

        fetchAndRenderLeaderboard(isPracticeMode);
    }

    async function fetchAndRenderLeaderboard(isPracticeMode) {
        const tbody = document.getElementById("leaderboardBody");
        const myRankElement = document.getElementById("rankVal");

        if (isPracticeMode) {
            myRankElement.innerText = "N/A (Practice)";
        }

        try {
            const lbRef = collection(db, 'leaderboard', TEST_ID, 'entries');
            // Sorting Logic: Highest score first. If tie, lowest time first.
            const q = query(lbRef, orderBy('score', 'desc'), orderBy('timeSpent', 'asc'), limit(50));
            const snapshot = await getDocs(q);
            
            let html = '';
            let rank = 1;
            let myRankNum = '-';

            if(snapshot.empty) {
                tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>No attempts yet. Be the first!</td></tr>";
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const isMe = currentUser && data.uid === currentUser.uid;
                if(isMe) myRankNum = rank;
                
                let rankStyle = rank <= 3 ? `rank-${rank}` : "";
                let rowStyle = isMe ? "current-user-row" : "";
                let namePrefix = rank === 1 ? '👑 ' : '';

                html += `<tr class="${rowStyle}">
                    <td class="${rankStyle}">#${rank}</td>
                    <td>${namePrefix}${data.displayName} ${isMe ? '(You)' : ''}</td>
                    <td style="color:var(--primary-neon-blue); font-weight:bold;">${data.score}</td>
                    <td>${formatTimeDisplay(data.timeSpent)}</td>
                </tr>`;
                rank++;
            });

            tbody.innerHTML = html;
            
            if (!isPracticeMode) {
                myRankElement.innerText = `#${myRankNum}`;
            }

        } catch (error) {
            console.error("Failed to load leaderboard:", error);
            tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:#FF007A;'>Failed to load leaderboard.</td></tr>";
        }
    }
});
