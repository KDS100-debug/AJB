document.addEventListener('DOMContentLoaded', async () => {
  const mediumSelect = document.querySelector('[data-filter="medium"]');
  const classSelect = document.querySelector('[data-filter="class"]');
  const subjectSelect = document.querySelector('[data-filter="subject"]');
  const chapterSelect = document.querySelector('[data-filter="chapter"]');
  if (!mediumSelect || !classSelect || !subjectSelect || !chapterSelect) return;

  const state = { mediums: [], classes: [], subjects: [], chapters: [] };

  function showEmpty(container, message, icon = 'database-zap') {
    container.innerHTML = `<div class="empty-state"><i data-lucide="${icon}" size="28"></i><p>${AJBLearn.escapeHtml(message)}</p></div>`;
    window.lucide?.createIcons();
  }

  async function loadClasses() {
    state.classes = (await getClasses(mediumSelect.value)).classes;
    AJBLearn.setSelectOptions(classSelect, state.classes, 'All classes');
  }

  async function loadSubjects() {
    state.subjects = (await getSubjects(classSelect.value, mediumSelect.value)).subjects;
    AJBLearn.setSelectOptions(subjectSelect, state.subjects, 'All subjects');
  }

  async function loadChapters() {
    state.chapters = (await getChapters(classSelect.value, subjectSelect.value, mediumSelect.value)).chapters;
    AJBLearn.setSelectOptions(chapterSelect, state.chapters, 'All chapters');
  }

  async function initializeFilters() {
    state.mediums = (await getMediums()).mediums;
    AJBLearn.setSelectOptions(mediumSelect, state.mediums, 'All mediums');
    await loadClasses();
    await loadSubjects();
    await loadChapters();
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

  async function renderEbooks() {
    const grid = document.getElementById('ebookGrid');
    if (!grid) return;
    showEmpty(grid, 'Loading e-books from Google Sheets...', 'loader-circle');
    try {
      const response = await getEbooks({
        mediumId: mediumSelect.value,
        classId: classSelect.value,
        subjectId: subjectSelect.value,
        chapterId: chapterSelect.value,
        search: document.getElementById('resourceSearch')?.value.trim() || ''
      });
      const subjectNames = Object.fromEntries(state.subjects.map((item) => [item.id, item.name]));
      const classNames = Object.fromEntries(state.classes.map((item) => [item.id, item.name]));
      const chapterNames = Object.fromEntries(state.chapters.map((item) => [item.id, item.name]));
      grid.innerHTML = response.ebooks.length ? response.ebooks.map((book) => `
        <article class="resource-card">
          <div class="resource-cover"${book.thumbnail ? ` style="background-image:url('${AJBLearn.escapeHtml(book.thumbnail)}');background-size:cover"` : ''}>
            <span>${AJBLearn.escapeHtml((subjectNames[book.subjectId] || 'BOOK').slice(0, 4).toUpperCase())}</span>
          </div>
          <div class="resource-body">
            <div class="resource-meta"><span>${AJBLearn.escapeHtml(subjectNames[book.subjectId] || 'Subject')}</span><span>PDF</span></div>
            <h3>${AJBLearn.escapeHtml(book.title)}</h3>
            <p>${AJBLearn.escapeHtml(classNames[book.classId] || '')} · ${AJBLearn.escapeHtml(chapterNames[book.chapterId] || '')}</p>
            <div class="card-actions">
              <a class="btn btn-primary btn-sm" href="${AJBLearn.escapeHtml(book.pdfLink)}" target="_blank" rel="noopener"><i data-lucide="book-open" size="14"></i> Read Online</a>
              <a class="btn btn-secondary btn-sm" href="${AJBLearn.escapeHtml(book.pdfLink)}" download><i data-lucide="download" size="14"></i> Download</a>
            </div>
          </div>
        </article>
      `).join('') : '<div class="empty-state"><i data-lucide="library-big" size="28"></i><p>No e-books are available for these filters.</p></div>';
      window.lucide?.createIcons();
    } catch (error) {
      showEmpty(grid, error.message, 'circle-alert');
    }
  }

  async function renderPractice() {
    const stack = document.getElementById('practiceStack');
    if (!stack) return;
    if (!chapterSelect.value) {
      showEmpty(stack, 'Select a chapter to load its practice questions.', 'list-filter');
      return;
    }
    showEmpty(stack, 'Loading practice questions from Google Sheets...', 'loader-circle');
    try {
      const response = await getPracticeQuestions(chapterSelect.value);
      stack.innerHTML = response.questions.length ? response.questions.map((item, index) => `
        <article class="practice-card">
          <div class="resource-meta"><span>${AJBLearn.escapeHtml(item.type)}</span><span>Question ${index + 1}</span></div>
          <h3>${AJBLearn.escapeHtml(item.question)}</h3>
          <button class="btn btn-secondary btn-sm" type="button" data-answer-toggle><i data-lucide="eye" size="14"></i> Show Answer Key</button>
          <div class="answer-key"><strong>Answer:</strong> ${AJBLearn.escapeHtml(item.answerKey)}</div>
        </article>
      `).join('') : '<div class="empty-state"><i data-lucide="notebook-tabs" size="28"></i><p>No practice questions have been added for this chapter.</p></div>';
      stack.querySelectorAll('[data-answer-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
          const card = button.closest('.practice-card');
          card.classList.toggle('show-answer');
          button.innerHTML = card.classList.contains('show-answer')
            ? '<i data-lucide="eye-off" size="14"></i> Hide Answer Key'
            : '<i data-lucide="eye" size="14"></i> Show Answer Key';
          window.lucide?.createIcons();
        });
      });
      window.lucide?.createIcons();
    } catch (error) {
      showEmpty(stack, error.message, 'circle-alert');
    }
  }

  document.getElementById('ebookFilters')?.addEventListener('submit', (event) => {
    event.preventDefault();
    renderEbooks();
  });
  document.getElementById('practiceFilters')?.addEventListener('submit', (event) => {
    event.preventDefault();
    renderPractice();
  });

  let searchTimer;
  document.getElementById('resourceSearch')?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderEbooks, 300);
  });

  try {
    await AJBLearn.requireBackend();
    await initializeFilters();
    if (document.getElementById('ebookGrid')) await renderEbooks();
    if (document.getElementById('practiceStack')) await renderPractice();
  } catch (error) {
    const container = document.getElementById('ebookGrid') || document.getElementById('practiceStack');
    if (container) showEmpty(container, error.message, 'circle-alert');
  }
});
