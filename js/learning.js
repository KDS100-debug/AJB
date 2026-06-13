document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const state = {
    mediums: [],
    classes: [],
    subjects: [],
    chapters: [],
    videos: [],
    ebooks: [],
    progress: [],
    completed: [],
    mediumId: params.get('mediumId') || localStorage.getItem('userMediumId') || '',
    classId: params.get('classId') || localStorage.getItem('userClassId') || '',
    subjectId: params.get('subjectId') || '',
    chapterId: params.get('chapterId') || '',
    videoId: params.get('videoId') || '',
    player: null,
    progressTimer: null
  };

  const byId = (items, id) => items.find((item) => String(item.id) === String(id));
  const selectedMedium = () => byId(state.mediums, state.mediumId);
  const selectedClass = () => byId(state.classes, state.classId);
  const selectedSubject = () => byId(state.subjects, state.subjectId);
  const selectedChapter = () => byId(state.chapters, state.chapterId);
  const selectedVideo = () => byId(state.videos, state.videoId);

  function renderChoices(containerId, items, selectedId, onSelect) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.length ? items.map((item) => `
      <button class="choice-chip ${String(item.id) === String(selectedId) ? 'active' : ''}" type="button" data-id="${AJBLearn.escapeHtml(item.id)}">
        <span>${AJBLearn.escapeHtml(item.name || item.title)}</span>
        ${String(item.id) === String(selectedId) ? '<i data-lucide="check" size="13"></i>' : ''}
      </button>
    `).join('') : '<span style="color:var(--ajb-muted);font-size:10px">No records available.</span>';
    container.querySelectorAll('[data-id]').forEach((button) => {
      button.addEventListener('click', () => onSelect(button.dataset.id));
    });
  }

  async function loadMediums() {
    state.mediums = (await getMediums()).mediums;
    if (!byId(state.mediums, state.mediumId)) state.mediumId = state.mediums[0]?.id || '';
  }

  async function loadClasses() {
    state.classes = (await getClasses(state.mediumId)).classes;
    if (!byId(state.classes, state.classId)) state.classId = state.classes[0]?.id || '';
  }

  async function loadSubjects() {
    state.subjects = (await getSubjects(state.classId, state.mediumId)).subjects;
    if (!byId(state.subjects, state.subjectId)) state.subjectId = state.subjects[0]?.id || '';
  }

  async function loadChapters() {
    state.chapters = (await getChapters(state.classId, state.subjectId, state.mediumId)).chapters;
    if (!byId(state.chapters, state.chapterId)) state.chapterId = state.chapters[0]?.id || '';
  }

  async function loadLessonAssets() {
    if (!state.chapterId) {
      state.videos = [];
      state.ebooks = [];
      state.videoId = '';
      return;
    }
    const [videosResponse, ebooksResponse] = await Promise.all([
      getVideos(state.chapterId),
      getEbooks({ chapterId: state.chapterId })
    ]);
    state.videos = videosResponse.videos;
    state.ebooks = ebooksResponse.ebooks;
    if (!byId(state.videos, state.videoId)) state.videoId = state.videos[0]?.id || '';
  }

  async function loadProgress() {
    const response = await getStudentProgress();
    state.progress = response.progress || [];
    state.completed = response.completedChapters || [];
  }

  function renderFilters() {
    renderChoices('mediumChoices', state.mediums, state.mediumId, async (id) => {
      state.mediumId = id;
      state.classId = state.subjectId = state.chapterId = state.videoId = '';
      await refreshHierarchy('medium');
    });
    renderChoices('classChoices', state.classes, state.classId, async (id) => {
      state.classId = id;
      state.subjectId = state.chapterId = state.videoId = '';
      await refreshHierarchy('class');
    });
    renderChoices('subjectChoices', state.subjects, state.subjectId, async (id) => {
      state.subjectId = id;
      state.chapterId = state.videoId = '';
      await refreshHierarchy('subject');
    });
    renderChoices('chapterChoices', state.chapters, state.chapterId, async (id) => {
      await saveCurrentVideoProgress();
      state.chapterId = id;
      state.videoId = '';
      await loadLessonAssets();
      render();
    });
  }

  function renderProgress() {
    const completedIds = new Set(state.completed.map((item) => String(item.chapterId)));
    const completedCount = state.chapters.filter((item) => completedIds.has(String(item.id))).length;
    const percentage = state.chapters.length ? Math.round(completedCount / state.chapters.length * 100) : 0;
    const ring = document.getElementById('overallRing');
    ring.style.setProperty('--progress', `${percentage}%`);
    ring.dataset.label = `${percentage}%`;
    document.getElementById('overallCopy').textContent = `${completedCount} of ${state.chapters.length} chapters completed`;
    document.getElementById('subjectProgressTitle').textContent = selectedSubject()?.name || 'Subject';
    document.getElementById('subjectPercent').textContent = `${percentage}%`;
    document.getElementById('subjectProgressBar').style.width = `${percentage}%`;
    document.getElementById('chapterCount').textContent = `${completedCount} / ${state.chapters.length}`;
    document.getElementById('progressChapterList').innerHTML = state.chapters.map((chapter, index) => {
      const completed = completedIds.has(String(chapter.id));
      const current = String(chapter.id) === String(state.chapterId);
      const statusClass = completed ? 'completed' : current ? 'in-progress' : '';
      const statusText = completed ? 'Completed' : current ? 'In Progress' : 'Not Started';
      return `
        <div class="chapter-item ${statusClass} ${current ? 'active' : ''}" data-chapter-id="${AJBLearn.escapeHtml(chapter.id)}">
          <span class="chapter-index">${completed ? '<i data-lucide="check" size="13"></i>' : index + 1}</span>
          <span class="chapter-copy"><strong>${AJBLearn.escapeHtml(chapter.name)}</strong><span>${statusText}</span></span>
          <span class="status-dot"></span>
        </div>
      `;
    }).join('');
    document.querySelectorAll('[data-chapter-id]').forEach((item) => {
      item.addEventListener('click', async () => {
        await saveCurrentVideoProgress();
        state.chapterId = item.dataset.chapterId;
        state.videoId = '';
        await loadLessonAssets();
        render();
      });
    });
  }

  function youtubeId(url) {
    const match = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/i);
    return match ? match[1] : '';
  }

  function loadYoutubeApi() {
    if (window.YT?.Player) return Promise.resolve();
    return new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    });
  }

  async function renderVideo() {
    clearInterval(state.progressTimer);
    state.player?.destroy?.();
    state.player = null;
    const holder = document.getElementById('lessonVideo');
    const video = selectedVideo();
    if (!video) {
      holder.innerHTML = '<div style="text-align:center"><i data-lucide="video-off" size="30"></i><p>No video has been added for this chapter.</p></div>';
      return;
    }
    const videoId = youtubeId(video.videoLink);
    if (!videoId) {
      holder.innerHTML = `<a class="btn btn-primary" href="${AJBLearn.escapeHtml(video.videoLink)}" target="_blank" rel="noopener">Open Video</a>`;
      return;
    }
    holder.innerHTML = '<div id="youtubePlayer" style="width:100%;height:100%"></div>';
    await loadYoutubeApi();
    const saved = state.progress.find((item) => String(item.videoId) === String(video.id));
    state.player = new YT.Player('youtubePlayer', {
      videoId,
      playerVars: { rel: 0, modestbranding: 1, start: Math.floor(saved?.positionSeconds || 0) },
      events: {
        onStateChange(event) {
          if (event.data === YT.PlayerState.PLAYING) {
            clearInterval(state.progressTimer);
            state.progressTimer = setInterval(saveCurrentVideoProgress, 15000);
          } else {
            clearInterval(state.progressTimer);
            saveCurrentVideoProgress();
          }
        }
      }
    });
  }

  async function saveCurrentVideoProgress() {
    const video = selectedVideo();
    if (!video || !state.player?.getCurrentTime) return;
    try {
      const positionSeconds = Math.floor(state.player.getCurrentTime() || 0);
      const durationSeconds = Math.floor(state.player.getDuration() || video.durationSeconds || 0);
      const watchedPercentage = durationSeconds ? Math.round(positionSeconds / durationSeconds * 100) : 0;
      await saveVideoProgress({
        videoId: video.id,
        chapterId: state.chapterId,
        positionSeconds,
        durationSeconds,
        watchedPercentage
      });
      const existing = state.progress.find((item) => String(item.videoId) === String(video.id));
      const record = { videoId: video.id, chapterId: state.chapterId, positionSeconds, durationSeconds, watchedPercentage };
      if (existing) Object.assign(existing, record);
      else state.progress.push(record);
    } catch (error) {
      console.warn('Unable to save video progress:', error);
    }
  }

  function renderLesson() {
    const medium = selectedMedium();
    const classItem = selectedClass();
    const subject = selectedSubject();
    const chapter = selectedChapter();
    const video = selectedVideo();
    document.getElementById('crumbMedium').textContent = medium?.name || 'Medium';
    document.getElementById('crumbClass').textContent = classItem?.name || 'Class';
    document.getElementById('crumbSubject').textContent = subject?.name || 'Subject';
    document.getElementById('lessonTitle').textContent = video?.title || chapter?.name || 'No lesson available';
    const videoChapterLabel = document.getElementById('videoChapterLabel');
    if (videoChapterLabel) videoChapterLabel.textContent = chapter?.name || 'Chapter';
    document.getElementById('metaMedium').textContent = medium?.name || '';
    document.getElementById('metaClass').textContent = classItem?.name || '';
    document.getElementById('metaSubject').textContent = subject?.name || '';
    document.getElementById('lessonDescription').textContent = video?.description || chapter?.description || 'Lesson content will appear after an administrator adds it in Google Sheets.';
    const completed = state.completed.some((item) => String(item.chapterId) === String(state.chapterId));
    const completeButton = document.getElementById('completeLesson');
    completeButton.innerHTML = completed
      ? '<i data-lucide="check" size="15"></i> Completed'
      : '<i data-lucide="circle-check-big" size="15"></i> Mark as Completed';
    completeButton.disabled = completed || !state.chapterId;
    completeButton.classList.toggle('btn-secondary', completed);
    completeButton.classList.toggle('btn-primary', !completed);
    const book = state.ebooks[0];
    const notesButton = document.getElementById('notesButton');
    notesButton.href = book?.pdfLink || '#';
    notesButton.target = book?.pdfLink ? '_blank' : '';
    notesButton.rel = book?.pdfLink ? 'noopener' : '';
    const index = state.chapters.findIndex((item) => String(item.id) === String(state.chapterId));
    document.getElementById('previousChapter').disabled = index <= 0;
    document.getElementById('nextChapter').disabled = index < 0 || index >= state.chapters.length - 1;
  }

  function render() {
    renderFilters();
    renderLesson();
    renderProgress();
    renderVideo();
    window.lucide?.createIcons();
  }

  async function refreshHierarchy(level) {
    try {
      if (level === 'medium') await loadClasses();
      if (level === 'medium' || level === 'class') await loadSubjects();
      if (['medium', 'class', 'subject'].includes(level)) await loadChapters();
      await loadLessonAssets();
      render();
    } catch (error) {
      AJBLearn.showToast(error.message, 'circle-alert');
    }
  }

  document.querySelectorAll('.filter-toggle').forEach((button) => {
    button.addEventListener('click', () => button.closest('.filter-group').classList.toggle('collapsed'));
  });
  document.querySelector('[data-learning-filters]')?.addEventListener('click', () => document.querySelector('.learn-sidebar').classList.toggle('open'));
  document.querySelector('[data-learning-progress]')?.addEventListener('click', () => document.querySelector('.progress-sidebar').classList.toggle('open'));

  document.getElementById('completeLesson').addEventListener('click', async () => {
    try {
      await markChapterCompleted(state.chapterId);
      await loadProgress();
      renderProgress();
      renderLesson();
      AJBLearn.showToast('Chapter completion saved to Google Sheets.');
    } catch (error) {
      AJBLearn.showToast(error.message, 'circle-alert');
    }
  });

  document.getElementById('previousChapter').addEventListener('click', async () => {
    const index = state.chapters.findIndex((item) => String(item.id) === String(state.chapterId));
    if (index > 0) {
      await saveCurrentVideoProgress();
      state.chapterId = state.chapters[index - 1].id;
      state.videoId = '';
      await loadLessonAssets();
      render();
    }
  });

  document.getElementById('nextChapter').addEventListener('click', async () => {
    const index = state.chapters.findIndex((item) => String(item.id) === String(state.chapterId));
    if (index >= 0 && index < state.chapters.length - 1) {
      await saveCurrentVideoProgress();
      state.chapterId = state.chapters[index + 1].id;
      state.videoId = '';
      await loadLessonAssets();
      render();
    }
  });

  document.getElementById('notesButton').addEventListener('click', (event) => {
    if (!state.ebooks[0]?.pdfLink) {
      event.preventDefault();
      AJBLearn.showToast('No e-book has been added for this chapter.', 'file-x');
    }
  });

  window.addEventListener('beforeunload', () => saveCurrentVideoProgress());

  try {
    await AJBLearn.requireBackend();
    await validateSession();
    await Promise.all([loadMediums(), loadProgress()]);
    await loadClasses();
    await loadSubjects();
    await loadChapters();
    await loadLessonAssets();
    render();
  } catch (error) {
    if (/session|authentication|login/i.test(error.message)) {
      location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
      return;
    }
    AJBLearn.showToast(error.message, 'circle-alert');
    document.getElementById('lessonTitle').textContent = 'Backend connection required';
    document.getElementById('lessonDescription').textContent = error.message;
  }
});
