document.addEventListener('DOMContentLoaded', async () => {
  const mediumSelect = document.querySelector('[data-filter="medium"]');
  const classSelect = document.querySelector('[data-filter="class"]');
  const subjectSelect = document.querySelector('[data-filter="subject"]');
  const chapterSelect = document.querySelector('[data-filter="chapter"]');
  const state = {
    mediums: [], classes: [], subjects: [], chapters: [],
    questions: [], quizTitle: 'Chapter Quiz', answers: {}, current: 0,
    secondsLeft: 0, totalSeconds: 0, timer: null
  };

  async function loadClasses() {
    state.classes = (await getClasses(mediumSelect.value)).classes;
    AJBLearn.setSelectOptions(classSelect, state.classes, 'Select class');
  }
  async function loadSubjects() {
    state.subjects = (await getSubjects(classSelect.value, mediumSelect.value)).subjects;
    AJBLearn.setSelectOptions(subjectSelect, state.subjects, 'Select subject');
  }
  async function loadChapters() {
    state.chapters = (await getChapters(classSelect.value, subjectSelect.value, mediumSelect.value)).chapters;
    AJBLearn.setSelectOptions(chapterSelect, state.chapters, 'Select chapter');
  }

  mediumSelect.addEventListener('change', async () => {
    await loadClasses();
    await loadSubjects();
    await loadChapters();
  });
  classSelect.addEventListener('change', async () => {
    await loadSubjects();
    await loadChapters();
  });
  subjectSelect.addEventListener('change', loadChapters);

  function renderQuestion() {
    const question = state.questions[state.current];
    if (!question) {
      document.getElementById('questionCount').textContent = 'No quiz loaded';
      document.getElementById('questionText').textContent = 'Select a chapter with MCQ records in Google Sheets.';
      document.getElementById('optionList').innerHTML = '';
      document.getElementById('questionMap').innerHTML = '';
      return;
    }
    const selected = state.answers[question.id];
    document.getElementById('questionCount').textContent = `Question ${state.current + 1} of ${state.questions.length}`;
    document.getElementById('quizHeading').textContent = state.quizTitle;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('quizProgress').style.width = `${((state.current + 1) / state.questions.length) * 100}%`;
    document.getElementById('optionList').innerHTML = question.options.map((option, index) => {
      const key = String.fromCharCode(65 + index);
      return `
        <button class="option ${selected === key ? 'selected' : ''}" type="button" data-answer="${key}">
          <span class="option-key">${key}</span><span>${AJBLearn.escapeHtml(option)}</span>
        </button>
      `;
    }).join('');
    document.getElementById('questionMap').innerHTML = state.questions.map((item, index) => `
      <button class="question-dot ${index === state.current ? 'active' : ''} ${state.answers[item.id] ? 'answered' : ''}" type="button" data-question="${index}">${index + 1}</button>
    `).join('');
    document.getElementById('answeredCount').textContent = `${Object.keys(state.answers).length} answered`;
    document.getElementById('previousQuestion').disabled = state.current === 0;
    document.getElementById('nextQuestion').innerHTML = state.current === state.questions.length - 1
      ? 'Submit Quiz <i data-lucide="send" size="15"></i>'
      : 'Next Question <i data-lucide="arrow-right" size="15"></i>';

    document.querySelectorAll('[data-answer]').forEach((button) => {
      button.addEventListener('click', () => {
        state.answers[question.id] = button.dataset.answer;
        renderQuestion();
      });
    });
    document.querySelectorAll('[data-question]').forEach((button) => {
      button.addEventListener('click', () => {
        state.current = Number(button.dataset.question);
        renderQuestion();
      });
    });
    window.lucide?.createIcons();
  }

  function startTimer() {
    clearInterval(state.timer);
    state.totalSeconds = state.questions.reduce((sum, item) => sum + Number(item.timeSeconds || 60), 0);
    state.secondsLeft = state.totalSeconds;
    updateTimer();
    state.timer = setInterval(() => {
      state.secondsLeft -= 1;
      updateTimer();
      if (state.secondsLeft <= 0) submitQuiz();
    }, 1000);
  }

  function updateTimer() {
    const minutes = String(Math.floor(Math.max(0, state.secondsLeft) / 60)).padStart(2, '0');
    const seconds = String(Math.max(0, state.secondsLeft) % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `${minutes}:${seconds}`;
  }

  async function renderLeaderboard() {
    const container = document.getElementById('leaderboardList');
    if (!container) return;
    try {
      const response = await getLeaderboard(chapterSelect.value, state.quizTitle, 5);
      container.innerHTML = response.leaderboard.length ? response.leaderboard.map((item) => `
        <div class="activity-item">
          <span class="activity-icon">${item.rank}</span>
          <span><strong>${AJBLearn.escapeHtml(item.name)}</strong><span>${AJBLearn.escapeHtml(item.quizTitle)}</span></span>
          <strong>${item.percentage}%</strong>
        </div>
      `).join('') : '<p style="color:var(--ajb-muted);font-size:10px">No scores yet.</p>';
    } catch (error) {
      container.innerHTML = `<p style="color:var(--ajb-muted);font-size:10px">${AJBLearn.escapeHtml(error.message)}</p>`;
    }
  }

  async function loadQuiz() {
    if (!chapterSelect.value) {
      state.questions = [];
      renderQuestion();
      return;
    }
    const response = await getMCQQuestions(chapterSelect.value);
    state.questions = response.questions;
    state.quizTitle = response.quizTitle || 'Chapter Quiz';
    state.answers = {};
    state.current = 0;
    renderQuestion();
    if (state.questions.length) startTimer();
    await renderLeaderboard();
  }

  async function submitQuiz() {
    if (!state.questions.length) return;
    clearInterval(state.timer);
    try {
      const result = await saveQuizScore(
        chapterSelect.value,
        state.quizTitle,
        state.questions.map((question) => ({ mcqId: question.id, answer: state.answers[question.id] || '' })),
        state.totalSeconds - state.secondsLeft
      );
      document.getElementById('quizCard').innerHTML = `
        <div style="text-align:center;padding:20px 0">
          <span class="card-icon" style="display:grid;margin:0 auto 18px;width:58px;height:58px;place-items:center;border-radius:50%;color:var(--ajb-red);background:var(--ajb-red-soft)"><i data-lucide="badge-check"></i></span>
          <span class="eyebrow">Score saved to Google Sheets</span>
          <h2 style="font-size:38px;margin:0 0 8px">${result.percentage}%</h2>
          <p style="color:var(--ajb-muted);margin:0 0 26px">You answered ${result.correctCount} correctly and ${result.wrongCount} incorrectly.</p>
          <div class="metric-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="metric-card"><span>Correct</span><div class="metric-row"><strong>${result.correctCount}</strong></div></div>
            <div class="metric-card"><span>Wrong</span><div class="metric-row"><strong>${result.wrongCount}</strong></div></div>
            <div class="metric-card"><span>Total</span><div class="metric-row"><strong>${result.total}</strong></div></div>
          </div>
          <button class="btn btn-primary" type="button" id="retakeQuiz"><i data-lucide="rotate-ccw" size="15"></i> Retake Quiz</button>
        </div>
      `;
      document.getElementById('retakeQuiz').addEventListener('click', () => location.reload());
      await renderLeaderboard();
      window.lucide?.createIcons();
    } catch (error) {
      AJBLearn.showToast(error.message, 'circle-alert');
    }
  }

  document.getElementById('nextQuestion').addEventListener('click', () => {
    if (!state.questions.length) return;
    if (state.current === state.questions.length - 1) submitQuiz();
    else {
      state.current += 1;
      renderQuestion();
    }
  });
  document.getElementById('previousQuestion').addEventListener('click', () => {
    state.current = Math.max(0, state.current - 1);
    renderQuestion();
  });
  document.getElementById('shuffleQuiz').addEventListener('click', () => {
    state.questions.sort(() => Math.random() - 0.5);
    state.answers = {};
    state.current = 0;
    startTimer();
    renderQuestion();
  });
  document.getElementById('quizFilters').addEventListener('submit', async (event) => {
    event.preventDefault();
    await loadQuiz();
  });

  try {
    await AJBLearn.requireBackend();
    await validateSession();
    state.mediums = (await getMediums()).mediums;
    AJBLearn.setSelectOptions(mediumSelect, state.mediums, 'Select medium');
    await loadClasses();
    await loadSubjects();
    await loadChapters();
    renderQuestion();
  } catch (error) {
    if (/session|authentication|login/i.test(error.message)) {
      location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
      return;
    }
    AJBLearn.showToast(error.message, 'circle-alert');
    renderQuestion();
  }
});
