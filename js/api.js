/* ============================================
   API MODULE - Google Apps Script Integration
   ============================================ */

const CONFIG = window.CONFIG || {
    APPS_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL',
    RAZORPAY_KEY_ID: 'rzp_test_Sz4Hecum9zEm1z',
    PLAN_AMOUNT: 29900,
    PLAN_AMOUNT_RUPEES: 299,
    PLAN_NAME: 'AJB Premium',
    PLAN_DESCRIPTION: 'Complete Course Access',
    BRAND_NAME: 'AJB LEARN',
    THEME_COLOR: '#E50914',
    LOGO_URL: 'assets/images/ajb-logo.png',
    RAZORPAY_PAYMENT_LINK: 'https://rzp.io/rzp/yLnOO4y'
};

window.CONFIG = CONFIG;

const API_BASE_URL = CONFIG.APPS_SCRIPT_URL;

const DEFAULT_DASHBOARD_LOGIN = {
    ids: ['hero', 'id-hero'],
    password: '13131313',
    user: {
        id: 'HERO',
        userId: 'HERO',
        email: 'hero@ajblearn.local',
        name: 'HERO',
        mobile: '',
        isSubscribed: true,
        subscriptionStatus: 'ACTIVE'
    },
    sessionToken: 'default-dashboard-session'
};

class APIError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = 'APIError';
        this.status = status;
    }
}

function isConfiguredApiUrl() {
    return Boolean(CONFIG.APPS_SCRIPT_URL) &&
        CONFIG.APPS_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL' &&
        CONFIG.APPS_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL';
}

function normalizeSubscriptionStatus(status) {
    return String(status || '').trim().toUpperCase() === 'ACTIVE';
}

async function apiRequest(action, payload = {}) {
    if (!isConfiguredApiUrl()) {
        throw new APIError('Google Apps Script URL is not configured in js/api.js', 400);
    }

    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action,
                ...payload
            })
        });

        if (!response.ok) {
            throw new APIError(`Request failed with status ${response.status}`, response.status);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        console.error(`${action} API Error:`, error);
        throw new APIError('Network error. Please check your connection and try again.', 500);
    }
}

function getCurrentUserFromStorage() {
    return {
        id: localStorage.getItem('userId'),
        userId: localStorage.getItem('userId'),
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        mobile: localStorage.getItem('userMobile') || '',
        subscriptionStatus: localStorage.getItem('subscriptionStatus') || 'INACTIVE'
    };
}

function persistSubscriptionStatus(status) {
    const normalized = normalizeSubscriptionStatus(status) ? 'ACTIVE' : 'INACTIVE';
    localStorage.setItem('subscriptionStatus', normalized);
    localStorage.setItem('isSubscribed', normalized === 'ACTIVE' ? 'true' : 'false');
    return normalized;
}

function persistUserSession(user, sessionToken) {
    if (!user) return;

    localStorage.setItem('userId', user.id || user.userId || '');
    localStorage.setItem('userName', user.name || '');
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('userMobile', user.mobile || '');
    localStorage.setItem('sessionToken', sessionToken || '');
    persistSubscriptionStatus(user.subscriptionStatus || (user.isSubscribed ? 'ACTIVE' : 'INACTIVE'));

    const sessionData = {
        userId: user.id || user.userId || '',
        userEmail: user.email || '',
        userName: user.name || '',
        userMobile: user.mobile || '',
        sessionToken: sessionToken || '',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
}

function getDefaultDashboardLogin(emailOrId, password) {
    const normalizedId = String(emailOrId || '').trim().toLowerCase();
    const isDefaultId = DEFAULT_DASHBOARD_LOGIN.ids.includes(normalizedId);
    const isDefaultPassword = String(password || '') === DEFAULT_DASHBOARD_LOGIN.password;

    if (!isDefaultId || !isDefaultPassword) return null;

    return {
        success: true,
        message: 'Default dashboard login successful.',
        user: DEFAULT_DASHBOARD_LOGIN.user,
        sessionToken: DEFAULT_DASHBOARD_LOGIN.sessionToken
    };
}

function isDefaultDashboardUser(userId = localStorage.getItem('userId')) {
    return String(userId || '').trim().toLowerCase() === DEFAULT_DASHBOARD_LOGIN.user.id.toLowerCase();
}

function getDefaultClasses() {
    return [
        { id: 'nursery', name: 'Nursery', medium: 'All Mediums', subjectCount: 0 },
        { id: 'kg', name: 'KG', medium: 'All Mediums', subjectCount: 0 },
        ...Array.from({ length: 10 }, (_, index) => ({
            id: String(index + 1),
            name: `Class ${index + 1}`,
            medium: 'All Mediums',
            subjectCount: 0
        }))
    ];
}

// User APIs
async function registerUser(userData) {
    return apiRequest('registerUser', {
        name: userData.fullName || userData.name,
        mobile: userData.mobile,
        email: userData.email,
        password: userData.password
    });
}

async function loginUser(email, password) {
    const defaultLogin = getDefaultDashboardLogin(email, password);
    if (defaultLogin) {
        persistUserSession(defaultLogin.user, defaultLogin.sessionToken);
        return defaultLogin;
    }

    const data = await apiRequest('loginUser', { email, password });
    if (data.success && data.user) {
        persistUserSession(data.user, data.sessionToken);
    }
    return data;
}

async function changePassword(userId, currentPassword, newPassword) {
    return apiRequest('changePassword', { userId, currentPassword, newPassword });
}

// Learning content APIs
async function getClasses() {
    if (isDefaultDashboardUser()) {
        return {
            success: true,
            classes: getDefaultClasses()
        };
    }

    return apiRequest('getClasses');
}

async function getSubjects(classId) {
    if (isDefaultDashboardUser()) {
        return {
            success: true,
            subjects: []
        };
    }

    return apiRequest('getSubjects', { classId });
}

async function getChapters(classId, subjectId) {
    if (isDefaultDashboardUser()) {
        return {
            success: true,
            chapters: []
        };
    }

    return apiRequest('getChapters', { classId, subjectId });
}

async function getVideos(chapterId) {
    return apiRequest('getVideos', { chapterId });
}

async function getNotes(videoId) {
    return apiRequest('getNotes', { videoId });
}

async function getQuizQuestions(quizId) {
    return apiRequest('getQuiz', { quizId });
}

async function saveQuizScore(userId, quizId, score, percentage) {
    return apiRequest('saveQuizScore', { userId, quizId, score, percentage });
}

async function saveProgress(userId, videoId, watched) {
    return apiRequest('saveProgress', {
        userId,
        videoId,
        watched,
        timestamp: new Date().toISOString()
    });
}

// Subscription and payment APIs
async function checkSubscription(userId) {
    if (isDefaultDashboardUser(userId)) {
        persistSubscriptionStatus('ACTIVE');
        return {
            success: true,
            isSubscribed: true,
            subscriptionStatus: 'ACTIVE'
        };
    }

    const data = await apiRequest('checkSubscription', { userId });
    if (data.success) {
        persistSubscriptionStatus(data.subscriptionStatus || (data.isSubscribed ? 'ACTIVE' : 'INACTIVE'));
    }
    return data;
}

async function verifySubscription(userId) {
    if (isDefaultDashboardUser(userId)) {
        persistSubscriptionStatus('ACTIVE');
        return {
            success: true,
            isSubscribed: true,
            subscriptionStatus: 'ACTIVE'
        };
    }

    const data = await apiRequest('checkSubscription', { userId });
    if (data.success) {
        const status = persistSubscriptionStatus(data.subscriptionStatus || (data.isSubscribed ? 'ACTIVE' : 'INACTIVE'));
        return {
            ...data,
            isSubscribed: status === 'ACTIVE',
            subscriptionStatus: status
        };
    }
    return data;
}

async function getDashboardOverview(userId) {
    if (isDefaultDashboardUser(userId)) {
        persistSubscriptionStatus('ACTIVE');
        return {
            success: true,
            isSubscribed: true,
            subscriptionStatus: 'ACTIVE',
            videosWatched: 0,
            quizzesCompleted: 0,
            averageScore: 0,
            studyHours: 0
        };
    }

    const data = await apiRequest('getDashboardOverview', { userId });
    if (data.success) {
        persistSubscriptionStatus(data.subscriptionStatus || (data.isSubscribed ? 'ACTIVE' : 'INACTIVE'));
    }
    return data;
}

async function createRazorpayOrder(userId, email, amount = CONFIG.PLAN_AMOUNT, planName = CONFIG.PLAN_NAME, customer = {}) {
    return apiRequest('createOrder', {
        userId,
        email,
        name: customer.name || '',
        mobile: customer.mobile || '',
        isGuest: Boolean(customer.isGuest),
        amount,
        planName
    });
}

async function verifyRazorpayPayment(paymentId, orderId, signature, userId, amount = CONFIG.PLAN_AMOUNT, planName = CONFIG.PLAN_NAME, customer = {}) {
    const data = await apiRequest('verifyPayment', {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        paymentId,
        orderId,
        signature,
        userId,
        name: customer.name || '',
        email: customer.email || '',
        mobile: customer.mobile || '',
        isGuest: Boolean(customer.isGuest),
        amount,
        planName
    });

    if (data.success) {
        persistSubscriptionStatus(data.subscriptionStatus || 'ACTIVE');
    }

    return data;
}

async function getPaymentHistory(userId) {
    return apiRequest('getPaymentHistory', { userId });
}

// Admin APIs
async function adminLogin(email, password) {
    return apiRequest('adminLogin', { email, password });
}

async function getDashboardStats() {
    return apiRequest('getDashboardStats');
}

async function getAllStudents() {
    return apiRequest('getAllStudents');
}

async function getAllClasses() {
    return apiRequest('getAllClasses');
}

async function getAllPayments(filters = {}) {
    return apiRequest('getAllPayments', { filters });
}

async function addClass(className, medium) {
    return apiRequest('addClass', { className, medium });
}

async function addSubject(subjectName, classId) {
    return apiRequest('addSubject', { subjectName, classId });
}

async function addVideo(videoData) {
    return apiRequest('addVideo', videoData);
}
