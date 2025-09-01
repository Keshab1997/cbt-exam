document.addEventListener('DOMContentLoaded', () => {
    // --- গ্লোবাল ভেরিয়েবল ---
    // quizData ভেরিয়েবলটি এখন questions.js ফাইল থেকে আসছে
    let questions = quizData; 
    let userAnswers = [];
    let currentQuestionIndex = 0;
    const EXAM_ID = "cbt-1";
    let timerInterval;

    // --- UI এলিমেন্ট ---
    const loadingSpinner = document.getElementById('loading-spinner');
    const examContainer = document.getElementById('exam-container');
    const questionTextEl = document.getElementById('question-text');
    const optionsContainerEl = document.getElementById('options-container');
    const questionNumberEl = document.getElementById('question-number');
    const questionPaletteEl = document.getElementById('question-palette');
    const saveNextBtn = document.getElementById('save-next-btn');
    const markReviewBtn = document.getElementById('mark-review-btn');
    const clearResponseBtn = document.getElementById('clear-response-btn');
    const submitBtn = document.getElementById('submit-btn');
    const modal = document.getElementById('submit-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const finalSubmitBtn = document.getElementById('final-submit-btn');

    // --- মূল ফাংশন ---

    // প্রশ্ন লোড করার নতুন এবং সহজ ফাংশন
    function loadExam() {
        if (!questions || questions.length === 0) {
            loadingSpinner.innerHTML = "<p>No questions found in questions.js</p>";
            return;
        }

        userAnswers = questions.map(q => ({
            qNo: q.qNo,
            selectedOption: null,
            status: 'not-visited'
        }));

        renderQuestion();
        createPalette();
        startTimer(90 * 60); // ৯০ মিনিট সময়

        loadingSpinner.classList.add('hidden');
        examContainer.classList.remove('hidden');
    }

    // প্রশ্ন UI-তে দেখানোর ফাংশন (কোনো পরিবর্তন নেই)
    function renderQuestion() {
        if (currentQuestionIndex >= questions.length) return;

        if (userAnswers[currentQuestionIndex].status === 'not-visited') {
            userAnswers[currentQuestionIndex].status = 'not-answered';
        }

        const q = questions[currentQuestionIndex];
        questionNumberEl.textContent = `Question No. ${q.qNo}`;
        questionTextEl.textContent = q.questionText;

        optionsContainerEl.innerHTML = '';
        q.options.forEach(option => {
            const isChecked = userAnswers[currentQuestionIndex].selectedOption === option;
            const optionId = `opt_${q.qNo}_${option.replace(/\s+/g, '')}`;
            optionsContainerEl.innerHTML += `
                <label for="${optionId}" class="option ${isChecked ? 'selected' : ''}">
                    <input type="radio" name="option" id="${optionId}" value="${option}" ${isChecked ? 'checked' : ''}>
                    ${option}
                </label>
            `;
        });

        document.querySelectorAll('input[name="option"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                userAnswers[currentQuestionIndex].selectedOption = e.target.value;
                document.querySelectorAll('.option').forEach(l => l.classList.remove('selected'));
                e.target.parentElement.classList.add('selected');
            });
        });

        updatePalette();
    }
    
    // প্রশ্ন প্যানেল তৈরি এবং আপডেট করার ফাংশন (কোনো পরিবর্তন নেই)
    function createPalette() {
        questionPaletteEl.innerHTML = '';
        questions.forEach((q, index) => {
            const btn = document.createElement('button');
            btn.textContent = q.qNo;
            btn.classList.add('palette-btn');
            btn.dataset.index = index;
            btn.addEventListener('click', () => {
                currentQuestionIndex = index;
                renderQuestion();
            });
            questionPaletteEl.appendChild(btn);
        });
    }

    function updatePalette() {
        document.querySelectorAll('.palette-btn').forEach((btn, index) => {
            const status = userAnswers[index].status;
            btn.className = 'palette-btn'; // Reset classes
            btn.classList.add(status);
            if (index === currentQuestionIndex) {
                btn.classList.add('current');
            }
        });
    }

    // টাইমার ফাংশন (কোনো পরিবর্তন নেই)
    function startTimer(duration) {
        let timer = duration;
        const timerEl = document.getElementById('timer');
        timerInterval = setInterval(() => {
            if (--timer < 0) {
                clearInterval(timerInterval);
                alert("Time's up! Submitting your test automatically.");
                submitTest();
                return;
            }
            let hours = String(Math.floor(timer / 3600)).padStart(2, '0');
            let minutes = String(Math.floor((timer % 3600) / 60)).padStart(2, '0');
            let seconds = String(timer % 60).padStart(2, '0');
            timerEl.textContent = `${hours}:${minutes}:${seconds}`;
        }, 1000);
    }
    
    // বাটনগুলোর কার্যকারিতা (কোনো পরিবর্তন নেই)
    function goToNextQuestion() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    }

    saveNextBtn.addEventListener('click', () => {
        const currentAns = userAnswers[currentQuestionIndex];
        if (currentAns.selectedOption) {
            currentAns.status = 'answered';
        }
        goToNextQuestion();
    });

    markReviewBtn.addEventListener('click', () => {
        const currentAns = userAnswers[currentQuestionIndex];
        currentAns.status = currentAns.selectedOption ? 'marked-answered' : 'marked';
        goToNextQuestion();
    });

    clearResponseBtn.addEventListener('click', () => {
        userAnswers[currentQuestionIndex].selectedOption = null;
        userAnswers[currentQuestionIndex].status = 'not-answered';
        renderQuestion();
    });
    
    // সাবমিট লজিক (কোনো পরিবর্তন নেই)
    submitBtn.addEventListener('click', () => {
        const summary = {
            answered: userAnswers.filter(a => a.status === 'answered' || a.status === 'marked-answered').length,
            notAnswered: userAnswers.filter(a => a.status === 'not-answered' || a.status === 'marked').length,
            notVisited: userAnswers.filter(a => a.status === 'not-visited').length
        };
        const totalQuestions = questions.length;

        document.getElementById('summary-table').innerHTML = `
            <tr><th>Status</th><th>Count</th></tr>
            <tr><td>Total Questions</td><td>${totalQuestions}</td></tr>
            <tr><td>Answered</td><td>${summary.answered}</td></tr>
            <tr><td>Not Answered</td><td>${summary.notAnswered}</td></tr>
            <tr><td>Not Visited</td><td>${summary.notVisited}</td></tr>
        `;
        modal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    finalSubmitBtn.addEventListener('click', () => {
        submitTest();
    });

    // --- নতুন: ফলাফল Firestore-এ সেভ করার ফাংশন ---
    async function submitTest() {
        clearInterval(timerInterval);
        finalSubmitBtn.disabled = true;
        finalSubmitBtn.textContent = 'Submitting...';

        // ফলাফল গণনা
        let correctCount = 0;
        let wrongCount = 0;
        userAnswers.forEach((ans, index) => {
            if (ans.selectedOption) {
                if (ans.selectedOption === questions[index].correctAnswer) {
                    correctCount++;
                } else {
                    wrongCount++;
                }
            }
        });

        // নেগেটিভ মার্কিং: প্রতি ৩টি ভুলের জন্য ১ নম্বর কাটা
        const negativeMarks = Math.floor(wrongCount / 3);
        const finalScore = correctCount - negativeMarks;

        const resultData = {
            examId: EXAM_ID,
            userId: auth.currentUser ? auth.currentUser.uid : "guest", // ইউজার লগইন থাকলে তার আইডি
            totalQuestions: questions.length,
            correctCount: correctCount,
            wrongCount: wrongCount,
            unansweredCount: questions.length - (correctCount + wrongCount),
            finalScore: finalScore,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp() // কখন জমা দিয়েছে
        };

        try {
            // Firestore-এর 'userResults' কালেকশনে ডেটা যোগ করা
            await db.collection("userResults").add(resultData);
            alert(`Test submitted successfully!\nYour score is: ${finalScore}`);
            // এখানে আপনি ফলাফল দেখানোর জন্য একটি নতুন পেজে পাঠাতে পারেন
            window.location.href = "../../index.html"; // আপাতত হোমপেজে ফেরত পাঠানো হলো
        } catch (error) {
            console.error("Error submitting result: ", error);
            alert("Failed to submit result. Please check your internet connection.");
            finalSubmitBtn.disabled = false;
            finalSubmitBtn.textContent = 'Confirm & Submit';
        }
    }
    
    // --- ইনিশিয়ালাইজেশন ---
    loadExam();
});