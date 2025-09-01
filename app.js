document.addEventListener("DOMContentLoaded", () => {
    // --- গ্লোবাল ভেরিয়েবল ---
    let questions = quizData; // questions.js থেকে আসছে
    let userAnswers = []; // ইউজারের উত্তর ও স্ট্যাটাস ট্র্যাক করবে
    let currentQuestionIndex = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let timerInterval;

    const EXAM_ID = "RRB NTPC CBT-1"; // পরীক্ষার নাম, স্কোর সেভের জন্য
    const SET_NAME = "Mock Test 1"; // সেটের নাম, স্কোর সেভের জন্য

    // --- UI এলিমেন্ট ---
    const loadingSpinner = document.getElementById("loading-spinner");
    const examContainer = document.getElementById("exam-container");
    const questionTextEl = document.getElementById("question-text");
    const optionsContainerEl = document.getElementById("options-container");
    const questionNumberEl = document.getElementById("question-number");
    const questionPaletteEl = document.getElementById("question-palette");
    const saveNextBtn = document.getElementById("save-next-btn");
    const markReviewBtn = document.getElementById("mark-review-btn");
    const clearResponseBtn = document.getElementById("clear-response-btn");
    const submitBtn = document.getElementById("submit-btn");
    const finalSubmitBtn = document.getElementById("final-submit-btn");
    const userDisplayNameEl = document.getElementById("user-display-name");

    // --- অ্যাপ শুরু ---
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            userDisplayNameEl.textContent = user.displayName || "User";
            initializeApp();
        } else {
            alert("এই পরীক্ষা দিতে হলে আপনাকে লগইন করতে হবে!");
            // আপনার লগইন পেজের সঠিক পাথ দিন
            window.location.href = "../../login.html";
        }
    });

    function initializeApp() {
        if (!questions || questions.length === 0) {
            loadingSpinner.innerHTML = "<p>No questions found.</p>";
            return;
        }

        userAnswers = questions.map((q) => ({
            qNo: q.qNo,
            selectedOption: null,
            status: "not-visited",
        }));

        renderQuestion();
        createPalette();
        startTimer(90 * 60); // ৯০ মিনিট

        loadingSpinner.classList.add("hidden");
        examContainer.classList.remove("hidden");
    }

    // --- মূল পরীক্ষার লজিক ---

    function renderQuestion() {
        if (currentQuestionIndex >= questions.length) return;

        const currentAnswer = userAnswers[currentQuestionIndex];
        if (currentAnswer.status === "not-visited") {
            currentAnswer.status = "not-answered";
        }

        const q = questions[currentQuestionIndex];
        questionNumberEl.textContent = `Question No. ${q.qNo}`;
        questionTextEl.textContent = q.questionText;

        optionsContainerEl.innerHTML = "";
        q.options.forEach((option) => {
            const isChecked = currentAnswer.selectedOption === option;
            const optionId = `opt_${q.qNo}_${option.replace(/\s+/g, "")}`;
            optionsContainerEl.innerHTML += `
                <label for="${optionId}" class="option ${isChecked ? "selected" : ""}">
                    <input type="radio" name="option" id="${optionId}" value="${option}" ${isChecked ? "checked" : ""}>
                    ${option}
                </label>
            `;
        });

        document.querySelectorAll('input[name="option"]').forEach((radio) => {
            radio.addEventListener("change", (e) => {
                currentAnswer.selectedOption = e.target.value;
                document
                    .querySelectorAll(".option")
                    .forEach((l) => l.classList.remove("selected"));
                e.target.parentElement.classList.add("selected");
            });
        });

        updatePalette();
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
            });
            questionPaletteEl.appendChild(btn);
        });
    }

    function updatePalette() {
        document.querySelectorAll(".palette-btn").forEach((btn, index) => {
            btn.className = "palette-btn " + userAnswers[index].status;
            if (index === currentQuestionIndex) btn.classList.add("current");
        });
    }

    function startTimer(duration) {
        let timer = duration;
        const timerEl = document.getElementById("timer");
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (--timer < 0) {
                clearInterval(timerInterval);
                alert("Time's up! Submitting your test automatically.");
                showFinalResult();
                return;
            }
            let h = String(Math.floor(timer / 3600)).padStart(2, "0");
            let m = String(Math.floor((timer % 3600) / 60)).padStart(2, "0");
            let s = String(timer % 60).padStart(2, "0");
            timerEl.textContent = `${h}:${m}:${s}`;
        }, 1000);
    }

    // --- বাটনগুলোর কার্যকারিতা ---
    function goToNextQuestion() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    }

    saveNextBtn.addEventListener("click", () => {
        const currentAns = userAnswers[currentQuestionIndex];
        if (currentAns.selectedOption) {
            currentAns.status = "answered";
        }
        goToNextQuestion();
    });

    markReviewBtn.addEventListener("click", () => {
        const currentAns = userAnswers[currentQuestionIndex];
        currentAns.status = currentAns.selectedOption
            ? "marked-answered"
            : "marked";
        goToNextQuestion();
    });

    clearResponseBtn.addEventListener("click", () => {
        userAnswers[currentQuestionIndex].selectedOption = null;
        userAnswers[currentQuestionIndex].status = "not-answered";
        renderQuestion(); // Re-render to clear selection
    });

    submitBtn.addEventListener("click", () => {
        const summary = {
            answered: userAnswers.filter(
                (a) =>
                    a.status === "answered" || a.status === "marked-answered",
            ).length,
            notAnswered: userAnswers.filter(
                (a) => a.status === "not-answered" || a.status === "marked",
            ).length,
            notVisited: userAnswers.filter((a) => a.status === "not-visited")
                .length,
        };
        document.getElementById("summary-table").innerHTML = `
            <tr><th>Status</th><th>Count</th></tr>
            <tr><td>Total Questions</td><td>${questions.length}</td></tr>
            <tr><td>Answered</td><td>${summary.answered}</td></tr>
            <tr><td>Not Answered</td><td>${summary.notAnswered}</td></tr>
            <tr><td>Not Visited</td><td>${summary.notVisited}</td></tr>
        `;
        document.getElementById("submit-modal").style.display = "flex";
    });

    document.querySelector(".close-btn").addEventListener("click", () => {
        document.getElementById("submit-modal").style.display = "none";
    });

    finalSubmitBtn.addEventListener("click", showFinalResult);

    // --- ফলাফল দেখানো এবং সেভ করা ---
    function showFinalResult() {
        clearInterval(timerInterval);
        finalSubmitBtn.disabled = true;
        finalSubmitBtn.textContent = "Submitting...";

        // ফলাফল গণনা
        correctCount = 0;
        wrongCount = 0;
        userAnswers.forEach((ans, index) => {
            if (ans.status === "answered" || ans.status === "marked-answered") {
                if (ans.selectedOption === questions[index].correctAnswer) {
                    correctCount++;
                } else {
                    wrongCount++;
                }
            }
        });

        // কাউন্টার আপডেট করা
        document.getElementById("correct-count").textContent =
            `✔️ ${correctCount}`;
        document.getElementById("wrong-count").textContent = `❌ ${wrongCount}`;

        // ফলাফল সেভ করা
        saveQuizResult(
            EXAM_ID,
            SET_NAME,
            correctCount,
            wrongCount,
            questions.length,
        );

        // UI-তে ফলাফল দেখানো
        const container = document.getElementById("exam-container");
        container.innerHTML = `
            <div class="text-center space-y-5 p-8">
                <h2 class="text-3xl font-bold text-green-600">🎉 পরীক্ষা শেষ!</h2>
                <p class="text-xl">আপনার স্কোর: <strong class="text-blue-600">${correctCount}</strong> / ${questions.length}</p>
                <p class="text-gray-600">আপনার ফলাফল ড্যাশবোর্ডের জন্য সেভ করা হয়েছে।</p>
                <div class="flex flex-wrap justify-center gap-3 mt-4">
                    <button onclick="showReview()" class="action-btn green">রিভিউ দেখুন</button>
                    <a href="../../dashboard.html" class="action-btn">ড্যাশবোর্ডে যান</a>
                    <button onclick="location.reload()" class="action-btn gray">🔁 আবার দিন</button>
                </div>
            </div>`;
    }

    window.showReview = function () {
        const container = document.getElementById("exam-container");
        let reviewHTML = `<div class="p-8"><h2 class="text-2xl font-bold text-center text-blue-700 mb-4">📚 পরীক্ষার রিভিউ</h2>`;
        questions.forEach((q, i) => {
            const userAnswer = userAnswers[i];
            const isCorrect = userAnswer.selectedOption === q.correctAnswer;
            reviewHTML += `
                <div class="review-card ${isCorrect ? "review-correct" : "review-incorrect"}">
                    <h3 class="font-semibold mb-2">📝 প্রশ্ন ${i + 1}: ${q.questionText}</h3>
                    <p><strong>সঠিক উত্তর:</strong> ${q.correctAnswer}</p>
                    <p><strong>আপনার উত্তর:</strong> 
                        <span class="font-bold ${isCorrect ? "text-green-700" : "text-red-700"}">
                            ${userAnswer.selectedOption || "উত্তর দেননি"}
                        </span>
                    </p>
                </div>`;
        });
        reviewHTML += `<div class="text-center mt-6"><button onclick="location.reload()" class="action-btn gray">🔁 আবার দিন</button></div></div>`;
        container.innerHTML = reviewHTML;
    };

    // --- আপনার আগের স্কোর সেভ করার ফাংশন (সামান্য পরিবর্তিত) ---
    function saveQuizResult(
        chapterName,
        setName,
        score,
        wrong,
        totalQuestions,
    ) {
        const user = firebase.auth().currentUser;
        if (!user) return console.error("User not logged in.");

        const userDocRef = db.collection("users").doc(user.uid);
        const chapterKey = chapterName.replace(/\s/g, "_");
        const setKey = setName.replace(/\s/g, "_");

        db.runTransaction((transaction) => {
            return transaction.get(userDocRef).then((doc) => {
                if (!doc.exists)
                    return console.error("User document does not exist!");

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
                    chapterData.totalCorrect -= oldSetData.score;
                    chapterData.totalWrong -=
                        oldSetData.totalQuestions - oldSetData.score;
                    chapterData.totalScore -= oldSetData.score;
                } else {
                    chapterData.completedQuizzesCount += 1;
                }

                chapterData.totalCorrect += score;
                chapterData.totalWrong += wrong;
                chapterData.totalScore += score;

                chapterData.quiz_sets[setKey] = {
                    score: score,
                    totalQuestions: totalQuestions,
                    attemptedAt:
                        firebase.firestore.FieldValue.serverTimestamp(),
                };

                const updateData = { [`chapters.${chapterKey}`]: chapterData };
                transaction.update(userDocRef, updateData);
            });
        })
            .then(() => {
                console.log("Result saved successfully!");
            })
            .catch((error) => {
                console.error("Error saving result: ", error);
            });
    }
});
