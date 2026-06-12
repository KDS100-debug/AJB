/* ============================================
   DASHBOARD MODULE
   ============================================ */

document.addEventListener('DOMContentLoaded', async function() {
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const canAccess = await requireActiveSubscription();
    if (!canAccess) return;

    setupDashboardNavigation();
    setupDashboardActions();
    await initializeDashboard();
});

async function initializeDashboard() {
    const userName = localStorage.getItem('userName') || 'Student';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userMobile = localStorage.getItem('userMobile') || '';

    setText('studentName', userName);
    setText('userGreeting', `Welcome, ${userName}`);
    setValue('settingsEmail', userEmail);
    setValue('settingsMobile', userMobile);

    await loadDashboardOverview();
    await loadClasses();
    await loadRecentVideos();
}

function setupDashboardNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            document.querySelectorAll('.menu-item').forEach(menuItem => menuItem.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.dashboard-section').forEach(section => section.classList.remove('active'));
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) section.classList.add('active');
        });
    });

    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('mobile-active');
        });
    }
}

function setupDashboardActions() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            AuthUtils.logout();
        });
    }

    document.querySelectorAll('.medium-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.medium-btn').forEach(button => button.classList.remove('active'));
            this.classList.add('active');
            localStorage.setItem('selectedMedium', this.getAttribute('data-medium'));
            loadClasses();
        });
    });

    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', handlePasswordChange);
    }
}

async function loadDashboardOverview() {
    const userId = localStorage.getItem('userId');

    try {
        const response = await getDashboardOverview(userId);

        if (!response.success) {
            showNotification(response.message || 'Error loading dashboard data', 'error');
            return;
        }

        const isActive = response.isSubscribed ||
            String(response.subscriptionStatus || '').toUpperCase() === 'ACTIVE';

        if (!isActive) {
            localStorage.setItem('subscriptionStatus', 'INACTIVE');
            localStorage.setItem('isSubscribed', 'false');
            window.location.href = 'subscription.html';
            return;
        }

        setText('videosWatched', response.videosWatched || 0);
        setText('quizzesCompleted', response.quizzesCompleted || 0);
        setText('averageScore', `${response.averageScore || 0}%`);
        setText('studyHours', response.studyHours || 0);

        const subscriptionStatus = document.getElementById('subscriptionStatus');
        if (subscriptionStatus) {
            subscriptionStatus.textContent = 'Active Subscription - All courses unlocked';
            subscriptionStatus.style.color = '#16A34A';
        }
    } catch (error) {
        console.error('Error loading dashboard overview:', error);
        showNotification(error.message || 'Error loading dashboard data', 'error');
    }
}

async function loadClasses() {
    const classesContainer = document.getElementById('classesContainer');
    if (!classesContainer) return;

    try {
        const response = await getClasses();
        classesContainer.innerHTML = '';

        if (!response.success) {
            classesContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">Courses will appear after the backend is configured.</p>';
            return;
        }

        const classes = response.classes || [];
        if (classes.length === 0) {
            classesContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">No classes added yet.</p>';
            return;
        }

        classes.forEach(cls => {
            const card = document.createElement('div');
            card.className = 'class-card clickable';
            card.innerHTML = `
                <h3>${escapeHtml(cls.name || cls.id)}</h3>
                <p>${escapeHtml(cls.medium || 'All Mediums')}</p>
                <p>${cls.subjectCount || 0} Subjects</p>
            `;
            card.addEventListener('click', () => {
                localStorage.setItem('selectedClass', cls.id);
                localStorage.setItem('selectedClassName', cls.name || cls.id);
                window.location.href = 'course.html';
            });
            classesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
        classesContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">Unable to load classes.</p>';
    }
}

async function loadRecentVideos() {
    const recentVideosContainer = document.getElementById('recentVideos');
    if (!recentVideosContainer) return;

    try {
        const recentVideos = JSON.parse(localStorage.getItem('recentVideos')) || [];
        recentVideosContainer.innerHTML = '';

        if (recentVideos.length === 0) {
            recentVideosContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">No videos watched yet</p>';
            return;
        }

        recentVideos.slice(0, 6).forEach(video => {
            const card = document.createElement('div');
            card.className = 'demo-card';
            card.innerHTML = `
                <div class="demo-card-image">
                    <img src="${escapeHtml(video.thumbnail || 'assets/images/ajb-logo.png')}" alt="${escapeHtml(video.title)}">
                    <div class="play-button">Play</div>
                </div>
                <div class="demo-card-content">
                    <h3>${escapeHtml(video.title)}</h3>
                    <p>${escapeHtml(video.subject || '')}</p>
                </div>
            `;
            recentVideosContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading recent videos:', error);
    }
}

function addToRecentVideos(video) {
    let recentVideos = JSON.parse(localStorage.getItem('recentVideos')) || [];
    recentVideos = recentVideos.filter(item => item.id !== video.id);
    recentVideos.unshift(video);
    localStorage.setItem('recentVideos', JSON.stringify(recentVideos.slice(0, 20)));
}

async function handlePasswordChange() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters.', 'error');
        return;
    }

    try {
        const response = await changePassword(localStorage.getItem('userId'), currentPassword, newPassword);
        if (response.success) {
            showNotification('Password changed successfully.', 'success');
            setValue('currentPassword', '');
            setValue('newPassword', '');
            setValue('confirmNewPassword', '');
        } else {
            showNotification(response.message || 'Unable to change password.', 'error');
        }
    } catch (error) {
        showNotification(error.message || 'Unable to change password.', 'error');
    }
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
}

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type, 3500);
        return;
    }

    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#16A34A' : type === 'error' ? '#DC2626' : '#0F4C81'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        z-index: 9999;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3500);
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.addEventListener('storage', function(e) {
    if (e.key === 'userId' && !e.newValue) {
        window.location.href = 'login.html';
    }
});
