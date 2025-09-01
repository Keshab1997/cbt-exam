document.addEventListener("DOMContentLoaded", () => {
    // --- গ্লোবাল ভেরিয়েবল ---
    let questions = quizData;
    let userAnswers = [];
    let currentQuestionIndex = 0;
    let timerInterval;
    let remainingTime;
    let isPaused = false;

    const EXAM_ID = "RRB NTPC CBT-1";
    const SET_NAME = "Mock Test 1";
    const progressKey = `examProgress_${EXAM_ID}_${SET_NAME}`;

    // --- UI এলিমেন্ট ---
    const loadingSpinner = document.getElementById("loading-spinner");
    const examContainer = document.getElementById("exam-container");
    const questionTextEl = document.getElementById("question-text");
    const optionsContainerEl = document.getElementById("options-container");
    const questionNumberEl = document.getElementById("question-number");
    const questionPaletteEl = document.getElementById("question-palette");
    const userDisplayNameEl = document.getElementById("user-display-name");
    const pauseBtn = document.getElementById("pause-btn");
    const restartBtn = document.getElementById("restart-btn"); // রিস্টার্ট বাটন
    const pauseOverlay = document.getElementById("pause-overlay");
    const resumeBtnOverlay = document.getElementById("resume-btn-overlay");
    const examBody = document.getElementById("exam-body");
    const togglePaletteBtn = document.getElementById("toggle-palette-btn");
    const backToQuestionBtn = document.getElementById("back-to-question-btn");

    // --- অ্যাপ শুরু ---
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            userDisplayNameEl.textContent = user.displayName || "User";
            initializeApp();
        } else {
            alert("এই পরীক্ষা দিতে হলে আপনাকে লগইন করতে হবে!");
            window.location.href = "../../login.html";
        }
    });

    function initializeApp() {
        if (!questions || questions.length === 0) {
            loadingSpinner.innerHTML = "<p>No questions found.</p>";
            return;
        }

        if (!loadProgress()) {
            resetExamState(); // নতুন করে শুরু
        }

        renderQuestion();
        createPalette();
        startTimer(remainingTime);

        // --- ## সমস্ত বাটনের ইভেন্ট লিসেনার এখানে যোগ করা হয়েছে ## ---
        addEventListeners();

        loadingSpinner.classList.add("hidden");
        examContainer.classList.remove("hidden");
    }

    // --- পরীক্ষা রিসেট করার ফাংশন ---
    function resetExamState() {
        currentQuestionIndex = 0;
        userAnswers = questions.map((q) => ({
            qNo: q.qNo,
            selectedOption: null,
            status: "not-visited",
        }));
        remainingTime = 60 * 60;
        isPaused = false;
        localStorage.removeItem(progressKey);
    }

    // --- সমস্ত ইভেন্ট লিসেনার যোগ করার ফাংশন ---
    function addEventListeners() {
        document
            .getElementById("save-next-btn")
            .addEventListener("click", () => handleButtonClick("saveNext"));
        document
            .getElementById("mark-review-btn")
            .addEventListener("click", () => handleButtonClick("markReview"));
        document
            .getElementById("clear-response-btn")
            .addEventListener("click", () => handleButtonClick("clear"));
        document
            .getElementById("submit-btn")
            .addEventListener("click", () => handleButtonClick("submit"));
        document
            .getElementById("final-submit-btn")
            .addEventListener("click", showFinalResult);
        document.querySelector(".close-btn").addEventListener("click", () => {
            document.getElementById("submit-modal").style.display = "none";
        });

        pauseBtn.addEventListener("click", togglePause);
        resumeBtnOverlay.addEventListener("click", togglePause);

        // রিস্টার্ট বাটন
        restartBtn.addEventListener("click", () => {
            if (
                confirm(
                    "আপনি কি পরীক্ষাটি নতুন করে শুরু করতে চান? আপনার সমস্ত উত্তর মুছে যাবে।",
                )
            ) {
                resetExamState();
                location.reload(); // পেজ রিলোড করে নতুন করে শুরু
            }
        });

        // মোবাইল প্যালেট টগল
        if (togglePaletteBtn && backToQuestionBtn) {
            togglePaletteBtn.addEventListener("click", () =>
                examBody.classList.add("show-palette"),
            );
            backToQuestionBtn.addEventListener("click", () =>
                examBody.classList.remove("show-palette"),
            );
        }
    }

    function handleButtonClick(action) {
        const currentAns = userAnswers[currentQuestionIndex];
        switch (action) {
            case "saveNext":
                if (currentAns.selectedOption) currentAns.status = "answered";
                goToNextQuestion();
                break;
            case "markReview":
                currentAns.status = currentAns.selectedOption
                    ? "marked-answered"
                    : "marked";
                goToNextQuestion();
                break;
            case "clear":
                currentAns.selectedOption = null;
                currentAns.status = "not-answered";
                renderQuestion();
                saveProgress();
                break;
            case "submit":
                const summary = {
                    answered: userAnswers.filter(
                        (a) =>
                            a.status === "answered" ||
                            a.status === "marked-answered",
                    ).length,
                    notAnswered: userAnswers.filter(
                        (a) =>
                            a.status === "not-answered" ||
                            a.status === "marked",
                    ).length,
                    notVisited: userAnswers.filter(
                        (a) => a.status === "not-visited",
                    ).length,
                };
                document.getElementById("summary-table").innerHTML =
                    `<tr><th>Status</th><th>Count</th></tr><tr><td>Total Questions</td><td>${questions.length}</td></tr><tr><td>Answered</td><td>${summary.answered}</td></tr><tr><td>Not Answered</td><td>${summary.notAnswered}</td></tr><tr><td>Not Visited</td><td>${summary.notVisited}</td></tr>`;
                document.getElementById("submit-modal").style.display = "flex";
                break;
        }
    }

    // --- Save/Load, Pause/Resume, এবং অন্যান্য ফাংশন অপরিবর্তিত ---
    function saveProgress() {
        /* ... */
    }
    function loadProgress() {
        /* ... */
    }
    function togglePause() {
        /* ... */
    }
    function renderQuestion() {
        /* ... */
    }
    function createPalette() {
        questionPaletteEl.innerHTML = "";
        questions.forEach((q, index) => {
            const btn = document.createElement("button");
            btn.textContent = q.qNo;
            btn.className = "palette-btn";
            btn.dataset.index = index;
            btn.addEventListener("click", () => {
                currentQuestionIndex = index;
                renderQuestion();
                saveProgress();
                if (window.innerWidth <= 992) {
                    examBody.classList.remove("show-palette");
                }
            });
            questionPaletteEl.appendChild(btn);
        });
    }
    function updatePalette() {
        /* ... */
    }
    function startTimer(duration) {
        /* ... */
    }
    function goToNextQuestion() {
        /* ... */
    }
    function showFinalResult() {
        /* ... */
    }
    window.showReview = function () {
        /* ... */
    };
    function saveQuizResult(
        chapterName,
        setName,
        score,
        wrong,
        totalQuestions,
    ) {
        /* ... */
    }

    // --- অপরিবর্তিত ফাংশনগুলোর কোড এখানে পেস্ট করুন ---
    // (নিচের কোডগুলো আগের উত্তর থেকে কপি করে এখানে বসান, কোনো পরিবর্তন ছাড়াই)

    function saveProgress() {
        const progress = {
            answers: userAnswers,
            index: currentQuestionIndex,
            time: remainingTime,
        };
        localStorage.setItem(progressKey, JSON.stringify(progress));
    }
    function loadProgress() {
        const savedProgress = localStorage.getItem(progressKey);
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            userAnswers = progress.answers;
            currentQuestionIndex = progress.index;
            remainingTime = progress.time;
            return true;
        }
        return false;
    }
    function togglePause() {
        isPaused = !isPaused;
        if (isPaused) {
            clearInterval(timerInterval);
            pauseOverlay.classList.remove("hidden");
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            startTimer(remainingTime);
            pauseOverlay.classList.add("hidden");
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }
    function renderQuestion() {
        if (currentQuestionIndex >= questions.length) return;
        const currentAnswer = userAnswers[currentQuestionIndex];
        if (currentAnswer.status === "not-visited")
            currentAnswer.status = "not-answered";
        const q = questions[currentQuestionIndex];
        questionNumberEl.textContent = `Question No. ${q.qNo}`;
        questionTextEl.textContent = q.questionText;
        optionsContainerEl.innerHTML = "";
        q.options.forEach((option) => {
            const isChecked = currentAnswer.selectedOption === option;
            const optionId = `opt_${q.qNo}_${option.replace(/\s+/g, "")}`;
            optionsContainerEl.innerHTML += `<label for="${optionId}" class="option ${isChecked ? "selected" : ""}"><input type="radio" name="option" id="${optionId}" value="${option}" ${isChecked ? "checked" : ""}>${option}</label>`;
        });
        document.querySelectorAll('input[name="option"]').forEach((radio) => {
            radio.addEventListener("change", (e) => {
                userAnswers[currentQuestionIndex].selectedOption =
                    e.target.value;
                document
                    .querySelectorAll(".option")
                    .forEach((l) => l.classList.remove("selected"));
                e.target.parentElement.classList.add("selected");
                saveProgress();
            });
        });
        updatePalette();
    }
    function updatePalette() {
        document.querySelectorAll(".palette-btn").forEach((btn, index) => {
            btn.className = "palette-btn " + userAnswers[index].status;
            if (index === currentQuestionIndex) btn.classList.add("current");
        });
    }
    function startTimer(duration) {
        remainingTime = duration;
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (--remainingTime < 0) {
                clearInterval(timerInterval);
                alert("সময় শেষ! আপনার পরীক্ষা অটোমেটিক সাবমিট করা হচ্ছে।");
                showFinalResult();
                return;
            }
            saveProgress();
            let h = String(Math.floor(remainingTime / 3600)).padStart(2, "0");
            let m = String(Math.floor((remainingTime % 3600) / 60)).padStart(
                2,
                "0",
            );
            let s = String(remainingTime % 60).padStart(2, "0");
            document.getElementById("timer").textContent = `${h}:${m}:${s}`;
        }, 1000);
    }
    function goToNextQuestion() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
            saveProgress();
        }
    }
    function showFinalResult() {
        clearInterval(timerInterval);
        localStorage.removeItem(progressKey);
        let correctCount = 0,
            wrongCount = 0;
        userAnswers.forEach((ans, index) => {
            if (ans.status === "answered" || ans.status === "marked-answered") {
                if (ans.selectedOption === questions[index].correctAnswer)
                    correctCount++;
                else wrongCount++;
            }
        });
        const totalQuestions = questions.length;
        const attemptedCount = correctCount + wrongCount;
        const unansweredCount = totalQuestions - attemptedCount;
        const positiveMarks = correctCount * 1;
        const negativeMarks = wrongCount / 3;
        const finalScore = positiveMarks - negativeMarks;
        const accuracy =
            attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
        saveQuizResult(
            EXAM_ID,
            SET_NAME,
            finalScore,
            wrongCount,
            totalQuestions,
        );
        const container = document.getElementById("exam-container");
        container.innerHTML = `<div class="result-page"><div class="result-card"><h2 class="result-title"><i class="fas fa-poll"></i> পরীক্ষার ফলাফল</h2><div class="result-summary"><p class="result-score-text">আপনার চূড়ান্ত স্কোর</p><p class="result-score">${finalScore.toFixed(2)} / ${totalQuestions}</p></div><div class="stats-grid"><div class="stat-item stat-attempted"><h4>Attempted</h4><p>${attemptedCount}</p></div><div class="stat-item stat-unanswered"><h4>Unanswered</h4><p>${unansweredCount}</p></div><div class="stat-item stat-correct"><h4>Correct</h4><p>${correctCount} (+${positiveMarks.toFixed(2)})</p></div><div class="stat-item stat-wrong"><h4>Wrong</h4><p>${wrongCount} (-${negativeMarks.toFixed(2)})</p></div></div><div class="accuracy-section"><div class="accuracy-label"><span>Accuracy</span><span>${accuracy.toFixed(1)}%</span></div><div class="progress-bar"><div class="progress-fill" style="width: ${accuracy.toFixed(1)}%;"></div></div></div><div class="result-actions"><button onclick="showReview()" class="action-btn review"><i class="fas fa-search"></i> রিভিউ দেখুন</button><a href="../../dashboard.html" class="action-btn dashboard"><i class="fas fa-tachometer-alt"></i> ড্যাশবোর্ডে যান</a><button onclick="location.reload()" class="action-btn retry"><i class="fas fa-redo"></i> আবার দিন</button></div></div></div>`;
    }
    window.showReview = function () {
        const container = document.getElementById("exam-container");
        let reviewHTML = `<div class="review-page"><h2 class="review-title"><i class="fas fa-clipboard-list"></i> পরীক্ষার রিভিউ</h2>`;
        questions.forEach((q, i) => {
            const userAnswer = userAnswers[i];
            const isCorrect = userAnswer.selectedOption === q.correctAnswer;
            const isAttempted =
                userAnswer.status === "answered" ||
                userAnswer.status === "marked-answered";
            let cardClass = "";
            let yourAnswerIcon = "";
            if (isAttempted) {
                if (isCorrect) {
                    cardClass = "review-correct";
                    yourAnswerIcon = '<i class="fas fa-check-circle"></i>';
                } else {
                    cardClass = "review-incorrect";
                    yourAnswerIcon = '<i class="fas fa-times-circle"></i>';
                }
            } else {
                cardClass = "review-unanswered";
                yourAnswerIcon = '<i class="far fa-circle"></i>';
            }
            reviewHTML += `<div class="review-card ${cardClass}"><h3 class="review-question"><i class="fas fa-question-circle"></i> প্রশ্ন ${i + 1}: ${q.questionText}</h3><div class="review-answers-container"><p class="review-answer correct-ans"><strong><i class="fas fa-check-circle"></i> সঠিক উত্তর:</strong> <span>${q.correctAnswer}</span></p><p class="review-answer your-ans"><strong>${yourAnswerIcon} আপনার উত্তর:</strong> <span>${userAnswer.selectedOption || "উত্তর দেননি"}</span></p></div></div>`;
        });
        reviewHTML += `<div class="review-footer"><a href="../../dashboard.html" class="action-btn dashboard"><i class="fas fa-tachometer-alt"></i> ড্যাশবোর্ডে যান</a><button onclick="location.reload()" class="action-btn retry"><i class="fas fa-redo"></i> আবার দিন</button></div></div>`;
        container.innerHTML = reviewHTML;
    };
    function saveQuizResult(
        chapterName,
        setName,
        score,
        wrong,
        totalQuestions,
    ) {
        const user = firebase.auth().currentUser;
        if (!user) return;
        const userDocRef = db.collection("users").doc(user.uid);
        const chapterKey = chapterName.replace(/\s/g, "_");
        const setKey = setName.replace(/\s/g, "_");
        db.runTransaction((transaction) => {
            return transaction.get(userDocRef).then((doc) => {
                if (!doc.exists) return;
                const data = doc.data();
                const chapters = data.chapters || {};
                const chapterData = chapters[chapterKey] || {
                    completedQuizzesCount: 0,
                    totalCorrect: 0,
                    totalWrong: 0,
                    totalScore: 0,
                    quiz_sets: {},
                };
                const oldSetData = chapterData.quiz_sets[setKey];
                if (oldSetData) {
                    const correctCountBeforeUpdate =
                        oldSetData.totalQuestions -
                        oldSetData.wrong -
                        (oldSetData.totalQuestions -
                            userAnswers.filter((a) => a.selectedOption).length);
                    chapterData.totalCorrect -= correctCountBeforeUpdate;
                    chapterData.totalWrong -= oldSetData.wrong;
                    chapterData.totalScore -= oldSetData.score;
                } else {
                    chapterData.completedQuizzesCount += 1;
                }
                const correctCountAfterUpdate =
                    totalQuestions -
                    wrong -
                    (totalQuestions -
                        userAnswers.filter((a) => a.selectedOption).length);
                chapterData.totalCorrect += correctCountAfterUpdate;
                chapterData.totalWrong += wrong;
                chapterData.totalScore += score;
                chapterData.quiz_sets[setKey] = {
                    score: score,
                    wrong: wrong,
                    totalQuestions: totalQuestions,
                    attemptedAt:
                        firebase.firestore.FieldValue.serverTimestamp(),
                };
                const updateData = { [`chapters.${chapterKey}`]: chapterData };
                transaction.update(userDocRef, updateData);
            });
        })
            .then(() => console.log("Result saved successfully!"))
            .catch((error) => console.error("Error saving result: ", error));
    }
});
