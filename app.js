// -------- app.js (সম্পূর্ণ নতুন কোড) --------

document.addEventListener("DOMContentLoaded", () => {
    // --- গ্লোবাল ভেরিয়েবল ---
    let questions = quizData; // questions.js থেকে আসছে
    let userAnswers = []; // ইউজারের উত্তর ও স্ট্যাটাস ট্র্যাক করবে
    let currentQuestionIndex = 0;
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
        // ## পরিবর্তন: পরীক্ষার সময় ১ ঘণ্টা (60 মিনিট) করা হয়েছে ##
        startTimer(60 * 60);

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
                <label for="${optionId}" class="option ${
                    isChecked ? "selected" : ""
                }">
                    <input type="radio" name="option" id="${optionId}" value="${option}" ${
                        isChecked ? "checked" : ""
                    }>
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
                alert("সময় শেষ! আপনার পরীক্ষা অটোমেটিক সাবমিট করা হচ্ছে।");
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
        renderQuestion();
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
        // ## পরিবর্তন: নেগেটিভ মার্কিং এর সতর্কবার্তা যোগ করা হয়েছে ##
        document.getElementById("summary-table").innerHTML = `
            <tr><th>Status</th><th>Count</th></tr>
            <tr><td>Total Questions</td><td>${questions.length}</td></tr>
            <tr><td>Answered</td><td>${summary.answered}</td></tr>
            <tr><td>Not Answered</td><td>${summary.notAnswered}</td></tr>
            <tr><td>Not Visited</td><td>${summary.notVisited}</td></tr>
        `;
        const modalContent = document.querySelector(".modal-content");
        // পুরনো warning থাকলে রিমুভ করুন
        const oldWarning = modalContent.querySelector(".warning-text");
        if (oldWarning) oldWarning.remove();
        // নতুন warning যোগ করুন
        document.getElementById("summary-table").insertAdjacentHTML(
            "afterend",
            `
            <p class="warning-text">আপনি কি নিশ্চিত? সাবমিট করার পর কোনো পরিবর্তন করতে পারবেন না।<br><b>মনে রাখবেন: প্রতি ৩টি ভুল উত্তরের জন্য ১ নম্বর কাটা হবে।</b></p>
        `,
        );
        document.getElementById("submit-modal").style.display = "flex";
    });

    document.querySelector(".close-btn").addEventListener("click", () => {
        document.getElementById("submit-modal").style.display = "none";
    });

    finalSubmitBtn.addEventListener("click", showFinalResult);

    // --- ## নতুন এবং উন্নত ফলাফল দেখানো এবং সেভ করার ফাংশন ## ---
    function showFinalResult() {
        clearInterval(timerInterval);
        document.getElementById("submit-modal").style.display = "none";
        document.getElementById("exam-container").innerHTML = `
            <div id="loading-spinner" class="loading-spinner">
                <div class="spinner"></div>
                <p>Generating Your Result...</p>
            </div>`;

        setTimeout(() => {
            // ফলাফল গণনা
            let correctCount = 0;
            let wrongCount = 0;
            userAnswers.forEach((ans, index) => {
                // শুধুমাত্র উত্তর দেওয়া প্রশ্নগুলোকেই গণনার মধ্যে আনা হবে
                if (
                    ans.status === "answered" ||
                    ans.status === "marked-answered"
                ) {
                    if (ans.selectedOption === questions[index].correctAnswer) {
                        correctCount++;
                    } else {
                        wrongCount++;
                    }
                }
            });

            // নতুন গণনা
            const totalQuestions = questions.length;
            const attemptedCount = correctCount + wrongCount;
            const unansweredCount = totalQuestions - attemptedCount;
            const positiveMarks = correctCount * 1; // প্রতিটি সঠিক উত্তরের জন্য ১ নম্বর
            const negativeMarks = wrongCount / 3; // প্রতি ৩টি ভুলের জন্য ১ নম্বর কাটা
            const finalScore = positiveMarks - negativeMarks;
            const accuracy =
                attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

            // স্কোর সেভ করা
            saveQuizResult(
                EXAM_ID,
                SET_NAME,
                finalScore, // চূড়ান্ত স্কোর সেভ করা হচ্ছে
                wrongCount,
                totalQuestions,
            );

            // UI-তে ফলাফল দেখানো (নতুন ডিজাইন)
            const container = document.getElementById("exam-container");
            container.innerHTML = `
                <div class="result-page">
                    <div class="result-card">
                        <h2 class="result-title">🎉 পরীক্ষার ফলাফল</h2>
                        <p class="result-score-text">আপনার চূড়ান্ত স্কোর:</p>
                        <p class="result-score">
                            <span class="final-score">${finalScore.toFixed(2)}</span> / ${totalQuestions}
                        </p>

                        <table class="result-details-table">
                            <tbody>
                                <tr><td>মোট প্রশ্ন</td><td>${totalQuestions}</td></tr>
                                <tr><td>উত্তর দিয়েছেন (Attempted)</td><td>${attemptedCount}</td></tr>
                                <tr><td>সঠিক উত্তর</td><td>${correctCount}</td></tr>
                                <tr><td>ভুল উত্তর</td><td>${wrongCount}</td></tr>
                                <tr><td>উত্তর দেননি (Unanswered)</td><td>${unansweredCount}</td></tr>
                                <tr><td>প্রাপ্ত নম্বর</td><td>+${positiveMarks.toFixed(2)}</td></tr>
                                <tr><td>নেগেটিভ মার্কস</td><td>-${negativeMarks.toFixed(2)}</td></tr>
                                <tr class="accuracy-row"><td>সঠিকতার হার (Accuracy)</td><td>${accuracy.toFixed(2)}%</td></tr>
                            </tbody>
                        </table>

                        <div class="result-actions">
                            <button onclick="showReview()" class="action-btn review">রিভিউ দেখুন</button>
                            <a href="../../dashboard.html" class="action-btn dashboard">ড্যাশবোর্ডে যান</a>
                            <button onclick="location.reload()" class="action-btn retry">🔁 আবার দিন</button>
                        </div>
                    </div>
                </div>`;
        }, 1500); // ফলাফল দেখাতে একটু দেরি করা হলো, দেখতে ভালো লাগে
    }

    // রিভিউ ফাংশন (আগের মতোই)
    window.showReview = function () {
        const container = document.getElementById("exam-container");
        let reviewHTML = `
            <div class="review-page">
                <h2 class="review-title">📝 পরীক্ষার রিভিউ</h2>`;

        questions.forEach((q, i) => {
            const userAnswer = userAnswers[i];
            const isCorrect = userAnswer.selectedOption === q.correctAnswer;
            const isAttempted =
                userAnswer.status === "answered" ||
                userAnswer.status === "marked-answered";

            let cardClass = "";
            if (isAttempted) {
                cardClass = isCorrect ? "review-correct" : "review-incorrect";
            } else {
                cardClass = "review-unanswered";
            }

            reviewHTML += `
                <div class="review-card ${cardClass}">
                    <h3 class="review-question">
                        <i class="fas fa-question-circle"></i> প্রশ্ন ${i + 1}: ${q.questionText}
                    </h3>
                    <p class="review-answer correct-ans">
                        <strong><i class="fas fa-check-circle"></i> সঠিক উত্তর:</strong> ${q.correctAnswer}
                    </p>
                    <p class="review-answer your-ans">
                        <strong>
                           ${isAttempted ? (isCorrect ? '<i class="fas fa-check-circle"></i> আপনার উত্তর:' : '<i class="fas fa-times-circle"></i> আপনার উত্তর:') : '<i class="fas fa-minus-circle"></i> আপনার উত্তর:'}
                        </strong> 
                        <span class="font-bold">
                            ${userAnswer.selectedOption || "উত্তর দেননি"}
                        </span>
                    </p>
                </div>`;
        });

        reviewHTML += `
            <div class="review-footer">
                 <a href="../../dashboard.html" class="action-btn dashboard">ড্যাশবোর্ডে যান</a>
                <button onclick="location.reload()" class="action-btn retry">🔁 আবার দিন</button>
            </div></div>`;

        container.innerHTML = reviewHTML;
    };

    // --- স্কোর সেভ করার ফাংশন (অপরিবর্তিত) ---
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
                // এখানে স্কোর গণনা একটু ভিন্ন হবে কারণ এখন finalScore আসছে
                const correctCountBeforeUpdate = oldSetData
                    ? oldSetData.totalQuestions - oldSetData.wrong
                    : 0;

                if (oldSetData) {
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
                chapterData.totalScore += score; // এখানে চূড়ান্ত স্কোর যোগ হচ্ছে

                chapterData.quiz_sets[setKey] = {
                    score: score, // চূড়ান্ত স্কোর
                    wrong: wrong, // ভুল উত্তরের সংখ্যা
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
