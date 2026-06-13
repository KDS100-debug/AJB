document.addEventListener('DOMContentLoaded', async () => {
  const state = {
    overview: null,
    mediums: [],
    classes: [],
    subjects: [],
    chapters: [],
    profileImage: ''
  };

  function renderUser(user) {
    const name = user.name || 'AJB Student';
    document.getElementById('studentName').textContent = name;
    document.getElementById('welcomeName').textContent = name.split(' ')[0];
    document.getElementById('studentInitials').textContent = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('profileName').value = name;
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileMobile').value = user.mobile || '';
    const mediumName = state.mediums.find((item) => String(item.id) === String(user.mediumId))?.name || 'Medium not selected';
    const className = state.classes.find((item) => String(item.id) === String(user.classId))?.name || 'Class not selected';
    document.getElementById('studentClass').textContent = `${mediumName} · ${className}`;
  }

  function renderMetrics() {
    const data = state.overview;
    document.getElementById('videosWatched').textContent = data.videosWatched;
    document.getElementById('quizzesCompleted').textContent = data.quizzesCompleted;
    document.getElementById('averageScore').textContent = `${data.averageScore}%`;
    document.getElementById('studyHours').textContent = data.studyHours;
    const weeklyPercentage = Math.min(100, Math.round((data.videosWatched + data.quizzesCompleted) / 5 * 20));
    const ring = document.querySelector('#overview .progress-ring');
    if (ring) {
      ring.dataset.label = `${weeklyPercentage}%`;
      ring.style.setProperty('--progress', `${weeklyPercentage}%`);
    }
  }

  async function loadAcademicData(user) {
    state.mediums = (await getMediums()).mediums;
    state.classes = (await getClasses(user.mediumId)).classes;
    state.subjects = user.classId ? (await getSubjects(user.classId, user.mediumId)).subjects : [];
    const chapterGroups = await Promise.all(state.subjects.map((subject) =>
      getChapters(user.classId, subject.id, user.mediumId)
    ));
    state.chapters = chapterGroups.flatMap((response) => response.chapters);
  }

  function subjectProgress(subject) {
    const chapters = state.chapters.filter((chapter) => String(chapter.subjectId) === String(subject.id));
    const completedIds = new Set(state.overview.completedChapters.map((item) => String(item.chapterId)));
    const completed = chapters.filter((chapter) => completedIds.has(String(chapter.id))).length;
    return {
      total: chapters.length,
      completed,
      percentage: chapters.length ? Math.round(completed / chapters.length * 100) : 0
    };
  }

  function renderCourses() {
    const grid = document.getElementById('dashboardCourses');
    grid.innerHTML = state.subjects.length ? state.subjects.map((subject) => {
      const stats = subjectProgress(subject);
      return `
        <article class="resource-card">
          <div class="resource-cover" style="height:140px"><span>${AJBLearn.escapeHtml(subject.name.slice(0, 4).toUpperCase())}</span></div>
          <div class="resource-body">
            <div class="resource-meta"><span>${stats.total} chapters</span><span>${stats.percentage}%</span></div>
            <h3>${AJBLearn.escapeHtml(subject.name)}</h3>
            <div class="progress-bar" style="margin:14px 0"><span style="width:${stats.percentage}%"></span></div>
            <a class="btn btn-primary btn-sm" href="course.html?mediumId=${encodeURIComponent(subject.mediumId)}&classId=${encodeURIComponent(subject.classId)}&subjectId=${encodeURIComponent(subject.id)}">Open Course</a>
          </div>
        </article>
      `;
    }).join('') : '<div class="empty-state"><p>No subjects are assigned to this student profile.</p></div>';

    document.getElementById('subjectProgressList').innerHTML = state.subjects.length ? state.subjects.map((subject) => {
      const stats = subjectProgress(subject);
      return `
        <div class="activity-item">
          <span class="activity-icon"><i data-lucide="${AJBLearn.escapeHtml(subject.icon || 'book-open')}" size="15"></i></span>
          <span><strong>${AJBLearn.escapeHtml(subject.name)}</strong><span>${stats.completed} of ${stats.total} chapters completed</span><span class="progress-bar" style="margin-top:8px"><span style="width:${stats.percentage}%"></span></span></span>
          <strong>${stats.percentage}%</strong>
        </div>
      `;
    }).join('') : '<p style="color:var(--ajb-muted);font-size:11px">No progress records available.</p>';
  }

  async function renderContinueLearning() {
    const card = document.getElementById('continueLearningCard');
    const latest = state.overview.continueLearning;
    if (!latest) {
      card.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:30px"><p>Start a lesson to create your continue-watching record.</p><a class="btn btn-primary btn-sm" href="course.html">Browse Lessons</a></div>';
      return;
    }
    const chapter = state.chapters.find((item) => String(item.id) === String(latest.chapterId));
    const videos = (await getVideos(latest.chapterId)).videos;
    const video = videos.find((item) => String(item.id) === String(latest.videoId));
    const subject = state.subjects.find((item) => String(item.id) === String(chapter?.subjectId));
    card.innerHTML = `
      <div class="continue-cover"><i data-lucide="play-circle" size="35"></i></div>
      <div class="continue-copy">
        <span class="eyebrow" style="margin-bottom:0">${AJBLearn.escapeHtml(subject?.name || 'Lesson')} · ${AJBLearn.escapeHtml(chapter?.name || 'Chapter')}</span>
        <h3>${AJBLearn.escapeHtml(video?.title || 'Continue lesson')}</h3>
        <p>Continue from ${Math.floor(latest.positionSeconds / 60)}:${String(latest.positionSeconds % 60).padStart(2, '0')} · ${latest.watchedPercentage}% watched</p>
        <div class="progress-bar" style="margin-bottom:14px"><span style="width:${latest.watchedPercentage}%"></span></div>
        <a class="btn btn-primary btn-sm" href="course.html?mediumId=${encodeURIComponent(video?.mediumId || '')}&classId=${encodeURIComponent(video?.classId || '')}&subjectId=${encodeURIComponent(video?.subjectId || '')}&chapterId=${encodeURIComponent(latest.chapterId)}&videoId=${encodeURIComponent(latest.videoId)}">Resume Lesson <i data-lucide="arrow-right" size="13"></i></a>
      </div>
    `;
  }

  function renderActivity() {
    const completed = state.overview.completedChapters.slice(-3).reverse();
    document.getElementById('recentActivityList').innerHTML = completed.length ? completed.map((item) => {
      const chapter = state.chapters.find((record) => String(record.id) === String(item.chapterId));
      return `
        <div class="activity-item">
          <span class="activity-icon"><i data-lucide="circle-check" size="15"></i></span>
          <span><strong>Completed ${AJBLearn.escapeHtml(chapter?.name || 'chapter')}</strong><span>${new Date(item.completedAt).toLocaleDateString()}</span></span>
          <strong>100%</strong>
        </div>
      `;
    }).join('') : '<p style="color:var(--ajb-muted);font-size:10px">Completed chapters will appear here.</p>';

    const achievements = [
      { icon: 'book-open-check', label: `${state.overview.completedChapters.length} Chapters` },
      { icon: 'list-checks', label: `${state.overview.quizzesCompleted} Quizzes` },
      { icon: 'star', label: `${state.overview.averageScore}% Average` }
    ];
    document.getElementById('achievementSummary').innerHTML = achievements.map((item) => `
      <div class="achievement"><i><i data-lucide="${item.icon}" size="15"></i></i><strong>${item.label}</strong></div>
    `).join('');

    document.getElementById('recommendedList').innerHTML = state.overview.announcements.length ? state.overview.announcements.map((item) => `
      <div class="activity-item"><span class="activity-icon"><i data-lucide="megaphone" size="15"></i></span><span><strong>${AJBLearn.escapeHtml(item.title)}</strong><span>${AJBLearn.escapeHtml(item.message)}</span></span></div>
    `).join('') : '<p style="color:var(--ajb-muted);font-size:10px">No active announcements.</p>';
  }

  async function populateProfileSelectors(user) {
    AJBLearn.setSelectOptions(document.getElementById('profileMedium'), state.mediums, 'Select medium');
    document.getElementById('profileMedium').value = user.mediumId || '';
    AJBLearn.setSelectOptions(document.getElementById('profileClass'), state.classes, 'Select class');
    document.getElementById('profileClass').value = user.classId || '';
  }

  document.getElementById('profileMedium').addEventListener('change', async (event) => {
    state.classes = (await getClasses(event.target.value)).classes;
    AJBLearn.setSelectOptions(document.getElementById('profileClass'), state.classes, 'Select class');
  });

  document.getElementById('profileImage').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 35000) {
      AJBLearn.showToast('Profile images stored in Sheets must be smaller than 35 KB.', 'circle-alert');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { state.profileImage = reader.result; };
    reader.readAsDataURL(file);
  });

  document.getElementById('profileForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const response = await updateUserProfile({
        name: document.getElementById('profileName').value.trim(),
        mobile: document.getElementById('profileMobile').value.trim(),
        mediumId: document.getElementById('profileMedium').value,
        classId: document.getElementById('profileClass').value,
        profileImage: state.profileImage || state.overview.user.profileImage
      });
      const currentPassword = document.getElementById('profileCurrentPassword').value;
      const newPassword = document.getElementById('profileNewPassword').value;
      if (newPassword) await changePassword(currentPassword, newPassword);
      state.overview.user = response.user;
      renderUser(response.user);
      AJBLearn.showToast('Profile saved to Google Sheets.');
    } catch (error) {
      AJBLearn.showToast(error.message, 'circle-alert');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async (event) => {
    event.preventDefault();
    await logoutUser();
    location.href = 'login.html';
  });

  try {
    await AJBLearn.requireBackend();
    state.overview = await getDashboardOverview();
    await loadAcademicData(state.overview.user);
    renderUser(state.overview.user);
    renderMetrics();
    renderCourses();
    await renderContinueLearning();
    renderActivity();
    await populateProfileSelectors(state.overview.user);
    window.lucide?.createIcons();
  } catch (error) {
    if (/session|authentication|login/i.test(error.message)) {
      clearUserSession();
      location.href = 'login.html';
      return;
    }
    AJBLearn.showToast(error.message, 'circle-alert');
  }
});
