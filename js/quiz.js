/* ============================================
   QUIZ MODULE
   ============================================ */

// Quiz state management
class QuizManager {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswers = {};
        this.startTime = null;
        this.endTime = null;
        this.score = 0;
    }

    // Load quiz
    async loadQuiz(quizId) {
        try {
            const response = await getQuizQuestions(quizId);
            if (response.success) {
                this.questions = response.questions;
                this.startTime = Date.now();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading quiz:', error);
            return false;
        }
    }

    // Get current question
    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex] || null;
    }

    // Go to next question
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }

    // Go to previous question
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return true;
        }
        return false;
    }

    // Set selected answer
    setAnswer(questionIndex, answer) {
        this.selectedAnswers[questionIndex] = answer;
    }

    // Get selected answer for question
    getAnswer(questionIndex) {
        return this.selectedAnswers[questionIndex] || null;
    }

    // Calculate score
    calculateScore() {
        let correct = 0;
        this.questions.forEach((question, index) => {
            if (this.selectedAnswers[index] === question.answer) {
                correct++;
            }
        });
        this.score = correct;
        return correct;
    }

    // Get percentage
    getPercentage() {
        return Math.round((this.score / this.questions.length) * 100);
    }

    // Get time taken
    getTimeTaken() {
        this.endTime = Date.now();
        const ms = this.endTime - this.startTime;
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return {
            minutes: minutes,
            seconds: seconds % 60,
            formatted: `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
        };
    }

    // Get performance details
    getPerformanceDetails() {
        const details = [];
        this.questions.forEach((question, index) => {
            const userAnswer = this.selectedAnswers[index];
            const isCorrect = userAnswer === question.answer;
            
            details.push({
                questionNumber: index + 1,
                question: question.question,
                userAnswer: userAnswer,
                correctAnswer: question.answer,
                isCorrect: isCorrect,
                correctOption: this.getOptionLabel(question.answer)
            });
        });
        return details;
    }

    // Get option label from value
    getOptionLabel(value) {
        const options = {
            'A': 'A',
            'B': 'B',
            'C': 'C',
            'D': 'D'
        };
        return options[value] || value;
    }

    // Save quiz result
    async saveResult(userId, quizId) {
        try {
            const response = await saveQuizScore(
                userId,
                quizId,
                this.score,
                this.getPercentage()
            );
            return response;
        } catch (error) {
            console.error('Error saving quiz result:', error);
            return { success: false };
        }
    }
}

// Create global quiz manager
let quizManager = new QuizManager();

// Quiz UI utilities
const QuizUI = {
    // Render question
    renderQuestion(question, questionIndex, totalQuestions) {
        const html = `
            <div class="question-container">
                <div class="question-text">Q${questionIndex + 1} of ${totalQuestions}: ${question.question}</div>
                <div class="options">
                    <label class="option-label">
                        <input type="radio" name="answer" value="A" ${quizManager.getAnswer(questionIndex) === 'A' ? 'checked' : ''}>
                        <span>${question.optionA}</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="answer" value="B" ${quizManager.getAnswer(questionIndex) === 'B' ? 'checked' : ''}>
                        <span>${question.optionB}</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="answer" value="C" ${quizManager.getAnswer(questionIndex) === 'C' ? 'checked' : ''}>
                        <span>${question.optionC}</span>
                    </label>
                    <label class="option-label">
                        <input type="radio" name="answer" value="D" ${quizManager.getAnswer(questionIndex) === 'D' ? 'checked' : ''}>
                        <span>${question.optionD}</span>
                    </label>
                </div>
            </div>

            <div class="quiz-actions">
                <button class="btn btn-secondary" id="prevBtn" ${questionIndex === 0 ? 'disabled' : ''}>← Previous</button>
                <button class="btn btn-primary" id="nextBtn">${questionIndex === totalQuestions - 1 ? 'Submit' : 'Next'} →</button>
            </div>
        `;
        return html;
    },

    // Update progress
    updateProgress(current, total) {
        const percentage = ((current + 1) / total) * 100;
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressText) progressText.textContent = `Question ${current + 1} of ${total}`;
    },

    // Show results
    showResults(score, total, percentage, timeTaken, details) {
        const resultHtml = `
            <div class="result-header">
                <h2>Quiz Completed!</h2>
            </div>

            <div class="result-stats">
                <div class="result-stat">
                    <div class="stat-label">Your Score</div>
                    <div class="stat-value">${score}/${total}</div>
                </div>
                <div class="result-stat">
                    <div class="stat-label">Percentage</div>
                    <div class="stat-value">${percentage}%</div>
                </div>
                <div class="result-stat">
                    <div class="stat-label">Status</div>
                    <div class="stat-value" style="color: ${this.getStatusColor(percentage)}">${this.getStatusText(percentage)}</div>
                </div>
                <div class="result-stat">
                    <div class="stat-label">Time Taken</div>
                    <div class="stat-value">${timeTaken}</div>
                </div>
            </div>

            <div class="result-details">
                <h3>Performance</h3>
                ${this.renderPerformanceDetails(details)}
            </div>

            <div class="result-actions">
                <button class="btn btn-primary" id="retakeBtn">Retake Quiz</button>
                <button class="btn btn-secondary" id="dashboardBtn">Back to Dashboard</button>
            </div>
        `;

        const resultContainer = document.getElementById('quizResult');
        if (resultContainer) {
            resultContainer.innerHTML = resultHtml;
            resultContainer.classList.remove('hidden');
        }
    },

    // Render performance details
    renderPerformanceDetails(details) {
        let html = '<div class="performance-list">';
        
        details.forEach(detail => {
            const statusClass = detail.isCorrect ? 'correct' : 'incorrect';
            html += `
                <div class="performance-item ${statusClass}">
                    <div class="item-header">
                        <span>Question ${detail.questionNumber}</span>
                        <span class="status-icon">${detail.isCorrect ? '✓' : '✗'}</span>
                    </div>
                    <div class="item-question">${detail.question}</div>
                    <div class="item-answer">
                        <p><strong>Your answer:</strong> ${detail.userAnswer}</p>
                        ${!detail.isCorrect ? `<p><strong>Correct answer:</strong> ${detail.correctAnswer}</p>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    },

    // Get status text
    getStatusText(percentage) {
        if (percentage >= 80) return 'Excellent!';
        if (percentage >= 60) return 'Good!';
        if (percentage >= 40) return 'Satisfactory';
        return 'Need Improvement';
    },

    // Get status color
    getStatusColor(percentage) {
        if (percentage >= 80) return '#4CAF50';
        if (percentage >= 60) return '#2196F3';
        if (percentage >= 40) return '#FF9800';
        return '#f44336';
    }
};

// Initialize quiz page
async function initializeQuiz(quizId) {
    try {
        const loaded = await quizManager.loadQuiz(quizId);
        if (loaded) {
            displayQuestion(0);
            startTimer();
        } else {
            alert('Failed to load quiz');
        }
    } catch (error) {
        console.error('Error initializing quiz:', error);
    }
}

// Display current question
function displayQuestion(index) {
    const question = quizManager.questions[index];
    if (!question) return;

    const container = document.getElementById('quizContainer');
    container.innerHTML = QuizUI.renderQuestion(
        question,
        index,
        quizManager.questions.length
    );

    QuizUI.updateProgress(index, quizManager.questions.length);

    // Handle answer selection
    document.querySelectorAll('input[name="answer"]').forEach(radio => {
        radio.addEventListener('change', function() {
            quizManager.setAnswer(index, this.value);
        });
    });

    // Previous button
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (quizManager.previousQuestion()) {
                displayQuestion(quizManager.currentQuestionIndex);
            }
        });
    }

    // Next/Submit button
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (index === quizManager.questions.length - 1) {
            submitQuiz();
        } else if (quizManager.nextQuestion()) {
            displayQuestion(quizManager.currentQuestionIndex);
        }
    });
}

// Timer
let timerInterval;
function startTimer() {
    let seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('timerDisplay').textContent =
            String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }, 1000);
}

// Submit quiz
async function submitQuiz() {
    clearInterval(timerInterval);

    const score = quizManager.calculateScore();
    const percentage = quizManager.getPercentage();
    const timeTaken = quizManager.getTimeTaken();
    const details = quizManager.getPerformanceDetails();

    // Hide quiz container
    const quizContainer = document.getElementById('quizContainer');
    if (quizContainer) quizContainer.classList.add('hidden');

    // Show results
    QuizUI.showResults(score, quizManager.questions.length, percentage, timeTaken.formatted, details);

    // Save result
    const userId = localStorage.getItem('userId');
    const quizId = new URLSearchParams(window.location.search).get('quizId');
    await quizManager.saveResult(userId, quizId);

    // Event handlers
    document.getElementById('retakeBtn').addEventListener('click', () => location.reload());
    document.getElementById('dashboardBtn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

// Add custom styles for performance details
const styles = `
    .performance-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 20px;
    }

    .performance-item {
        padding: 15px;
        border-radius: 6px;
        border-left: 4px solid;
    }

    .performance-item.correct {
        background-color: #d4edda;
        border-color: #4CAF50;
    }

    .performance-item.incorrect {
        background-color: #f8d7da;
        border-color: #f44336;
    }

    .item-header {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        margin-bottom: 8px;
    }

    .status-icon {
        font-size: 18px;
    }

    .item-question {
        font-weight: 500;
        margin-bottom: 8px;
    }

    .item-answer p {
        margin: 5px 0;
        font-size: 14px;
    }
`;

// Inject styles
document.addEventListener('DOMContentLoaded', function() {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
});
