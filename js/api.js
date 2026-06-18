/* ============================================
   AJB LEARN - GOOGLE APPS SCRIPT API CLIENT
   ============================================ */

const CONFIG = window.CONFIG || {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0ZSi74-X2MDbCTbWbMcvJ6CrRZIIpd9DC3PIwbSWny_uYwEU1vvpMGbOxVRiNkfiQ/exec',
  RAZORPAY_KEY_ID: 'rzp_test_Sz4Hecum9zEm1z',
  PLAN_AMOUNT: 29900,
  PLAN_AMOUNT_RUPEES: 299,
  PLAN_NAME: 'AJB Premium',
  PLAN_DESCRIPTION: 'Complete Course Access',
  BRAND_NAME: 'AJB LEARN',
  THEME_COLOR: '#ED1C24',
  LOGO_URL: 'assets/images/ajb-logo.png?v=20260613',
  RAZORPAY_PAYMENT_LINK: 'https://rzp.io/rzp/yLnOO4y'
};

window.CONFIG = CONFIG;

const DEFAULT_MEDIUMS = ['English', 'Assamese'].map((name) => ({ id: name, name }));
const DEFAULT_CLASSES = Array.from({ length: 10 }, (_, index) => {
  const name = `Class ${index + 1}`;
  return { id: name, name };
});

class APIError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

function isConfiguredApiUrl() {
  const url = String(CONFIG.APPS_SCRIPT_URL || '').trim();
  return Boolean(url) &&
    !/YOUR_GOOGLE_APPS_SCRIPT|YOUR_DEPLOYMENT_ID|DEPLOYMENT_ID|\{.*\}/i.test(url);
}

function getSessionToken() {
  return localStorage.getItem('sessionToken') || '';
}

function getAdminToken() {
  return localStorage.getItem('adminToken') || getSessionToken();
}

function normalizeOptionList(items, fallbackItems = []) {
  const source = Array.isArray(items) && items.length ? items : fallbackItems;
  const seen = new Set();
  return source.map((item) => {
    const record = item && typeof item === 'object' ? item : { id: item, name: item };
    const id = String(record.id ?? record.value ?? record.name ?? '').trim();
    const name = String(record.name ?? record.label ?? id).trim();
    const key = id.toLowerCase();
    if (!id || !name || seen.has(key)) return null;
    seen.add(key);
    return { ...record, id, name };
  }).filter(Boolean);
}

function canonicalClassName(value) {
  const rawValue = value && typeof value === 'object'
    ? (value.name ?? value.id ?? value.className ?? value.classId ?? value.class)
    : value;
  const text = String(rawValue ?? '').trim().replace(/\s+/g, ' ');
  const match = text.match(/^class\s*0?([1-9]|10)$/i) ||
    text.match(/^0?([1-9]|10)$/) ||
    text.match(/^class0?([1-9]|10)$/i);
  return match ? `Class ${Number(match[1])}` : '';
}

function normalizeClassList(items, mediumId = '') {
  const classMap = new Map();
  const addClass = (item) => {
    const name = canonicalClassName(item);
    if (!name) return;
    classMap.set(name.toLowerCase(), { id: name, name, mediumId });
  };

  DEFAULT_CLASSES.forEach(addClass);
  if (Array.isArray(items)) items.forEach(addClass);

  return Array.from(classMap.values()).sort((a, b) =>
    Number(a.name.replace(/\D/g, '')) - Number(b.name.replace(/\D/g, ''))
  );
}

async function apiRequest(action, payload = {}, options = {}) {
  if (!isConfiguredApiUrl()) {
    throw new APIError('Configure CONFIG.APPS_SCRIPT_URL in js/api.js before using the website.', 400);
  }

  const body = { action, ...payload };
  if (options.auth && !body.sessionToken) body.sessionToken = getSessionToken();
  if (options.admin && !body.adminToken) body.adminToken = getAdminToken();

  try {
    const response = await fetch(String(CONFIG.APPS_SCRIPT_URL).trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });
    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      throw new APIError(
        `Apps Script returned a non-JSON response (${response.status || 'unknown status'}). Redeploy the Web App as "Execute as: Me" and "Who has access: Anyone", then paste the latest /exec URL in js/api.js.`,
        response.status || 502
      );
    }
    if (!response.ok) {
      throw new APIError(data.message || `API request failed with status ${response.status}.`, response.status);
    }
    if (!data.success && options.throwOnError !== false) {
      throw new APIError(data.message || 'The API request failed.', 400);
    }
    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error(`${action} API error:`, error);
    throw new APIError(
      'Unable to reach the AJB LEARN backend. Confirm the latest Apps Script Web App /exec URL is deployed with access set to Anyone.',
      503
    );
  }
}

function persistSubscriptionStatus(status) {
  const normalized = String(status || '').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
  localStorage.setItem('subscriptionStatus', normalized);
  localStorage.setItem('isSubscribed', normalized === 'ACTIVE' ? 'true' : 'false');
  return normalized;
}

function persistUserSession(user, sessionToken, sessionExpires) {
  localStorage.setItem('userId', user.id || user.userId || '');
  localStorage.setItem('userName', user.name || '');
  localStorage.setItem('userEmail', user.email || '');
  localStorage.setItem('userMobile', user.mobile || '');
  localStorage.setItem('userMediumId', user.mediumId || '');
  localStorage.setItem('userClassId', user.classId || '');
  localStorage.setItem('sessionToken', sessionToken || '');
  localStorage.setItem('sessionExpires', sessionExpires || '');
  persistSubscriptionStatus(user.subscriptionStatus);
  if (user.isAdmin) {
    localStorage.setItem('adminToken', sessionToken || '');
    localStorage.setItem('isAdmin', 'true');
  }
}

function clearUserSession() {
  [
    'userId', 'userName', 'userEmail', 'userMobile', 'userMediumId', 'userClassId',
    'sessionToken', 'sessionExpires', 'subscriptionStatus', 'isSubscribed',
    'adminToken', 'isAdmin'
  ].forEach((key) => localStorage.removeItem(key));
}

function getCurrentUserFromStorage() {
  return {
    id: localStorage.getItem('userId') || '',
    name: localStorage.getItem('userName') || '',
    email: localStorage.getItem('userEmail') || '',
    mobile: localStorage.getItem('userMobile') || '',
    mediumId: localStorage.getItem('userMediumId') || '',
    classId: localStorage.getItem('userClassId') || '',
    subscriptionStatus: localStorage.getItem('subscriptionStatus') || 'INACTIVE'
  };
}

async function registerUser(userData) {
  const mediumId = String(userData.mediumId || userData.medium || '').trim();
  const classId = canonicalClassName(userData.classId || userData.className || userData.class) ||
    String(userData.classId || userData.className || userData.class || '').trim();
  return apiRequest('registerUser', {
    name: userData.fullName || userData.name,
    mobile: userData.mobile,
    email: userData.email,
    password: userData.password,
    medium: mediumId,
    mediumId,
    class: classId,
    className: classId,
    classId
  });
}

async function loginUser(email, password, rememberMe = false) {
  const data = await apiRequest('loginUser', { email, password, rememberMe });
  persistUserSession(data.user, data.sessionToken, data.sessionExpires);
  return data;
}

async function adminLogin(email, password, rememberMe = false) {
  const data = await apiRequest('adminLogin', { email, password, rememberMe });
  persistUserSession(data.user, data.sessionToken, data.sessionExpires);
  return data;
}

async function logoutUser() {
  try {
    if (getSessionToken()) await apiRequest('logoutUser', {}, { auth: true });
  } finally {
    clearUserSession();
  }
}

async function validateSession(requireAdmin = false) {
  return apiRequest('validateSession', { requireAdmin }, { auth: !requireAdmin, admin: requireAdmin });
}

async function changePassword(currentPassword, newPassword) {
  return apiRequest('changePassword', { currentPassword, newPassword }, { auth: true });
}

async function requestPasswordReset(identifier, channel) {
  return apiRequest('requestPasswordReset', { identifier, channel });
}

async function resetPasswordWithOtp(requestId, otp, newPassword) {
  return apiRequest('resetPasswordWithOtp', { requestId, otp, newPassword });
}

async function getUserProfile() {
  return apiRequest('getUserProfile', {}, { auth: true });
}

async function updateUserProfile(profile) {
  const data = await apiRequest('updateUserProfile', { profile }, { auth: true });
  persistUserSession(data.user, getSessionToken(), localStorage.getItem('sessionExpires'));
  return data;
}

async function getMediums() {
  try {
    const data = await apiRequest('getMediums');
    return {
      ...data,
      mediums: normalizeOptionList(data.mediums, DEFAULT_MEDIUMS)
    };
  } catch (error) {
    console.warn('Using default AJB LEARN mediums:', error);
    return {
      success: true,
      fallback: true,
      message: error.message,
      mediums: normalizeOptionList([], DEFAULT_MEDIUMS)
    };
  }
}

async function getClasses(mediumId = '') {
  try {
    const data = await apiRequest('getClasses', { mediumId });
    return {
      ...data,
      classes: normalizeClassList(data.classes, mediumId)
    };
  } catch (error) {
    console.warn('Using default AJB LEARN classes:', error);
    return {
      success: true,
      fallback: true,
      message: error.message,
      classes: normalizeClassList([], mediumId)
    };
  }
}

async function getSubjects(classId = '', mediumId = '') {
  return apiRequest('getSubjects', { classId, mediumId });
}

async function getChapters(classId = '', subjectId = '', mediumId = '') {
  return apiRequest('getChapters', { classId, subjectId, mediumId });
}

async function getVideos(chapterId = '') {
  return apiRequest('getVideos', { chapterId });
}

async function getEbooks(filters = {}) {
  return apiRequest('getEbooks', filters);
}

async function getPracticeQuestions(chapterId) {
  return apiRequest('getPractice', { chapterId });
}

async function getMCQQuestions(chapterId, quizTitle = '') {
  return apiRequest('getMCQ', { chapterId, quizTitle });
}

async function getQuizQuestions(chapterId, quizTitle = '') {
  return getMCQQuestions(chapterId, quizTitle);
}

async function getLeaderboard(chapterId = '', quizTitle = '', limit = 20) {
  return apiRequest('getLeaderboard', { chapterId, quizTitle, limit });
}

async function getAnnouncements() {
  return apiRequest('getAnnouncements');
}

async function getPlatformSettings() {
  return apiRequest('getSettings');
}

async function getPublicCatalog() {
  return apiRequest('getPublicCatalog');
}

async function saveVideoProgress(progress) {
  return apiRequest('saveVideoProgress', progress, { auth: true });
}

async function saveProgress(userId, videoId, watched) {
  return saveVideoProgress({
    videoId,
    status: watched ? 'COMPLETED' : 'IN_PROGRESS',
    watchedPercentage: watched ? 100 : 1
  });
}

async function markChapterCompleted(chapterId) {
  return apiRequest('markChapterCompleted', { chapterId }, { auth: true });
}

async function getStudentProgress() {
  return apiRequest('getStudentProgress', {}, { auth: true });
}

async function saveQuizScore(chapterId, quizTitle, answers, timeSeconds) {
  return apiRequest('saveQuizScore', {
    chapterId,
    quizTitle,
    answers,
    timeSeconds
  }, { auth: true });
}

async function checkSubscription(userId = localStorage.getItem('userId')) {
  const data = await apiRequest('checkSubscription', { userId });
  persistSubscriptionStatus(data.subscriptionStatus);
  return data;
}

async function verifySubscription(userId) {
  return checkSubscription(userId);
}

async function getDashboardOverview() {
  const data = await apiRequest('getDashboardOverview', {}, { auth: true });
  if (data.user) persistUserSession(data.user, getSessionToken(), localStorage.getItem('sessionExpires'));
  return data;
}

async function createRazorpayOrder(userId, email, amount = CONFIG.PLAN_AMOUNT, planName = CONFIG.PLAN_NAME) {
  return apiRequest('createOrder', { amount, planName }, { auth: true });
}

async function verifyRazorpayPayment(paymentId, orderId, signature, userId, amount = CONFIG.PLAN_AMOUNT, planName = CONFIG.PLAN_NAME) {
  const data = await apiRequest('verifyPayment', {
    paymentId,
    orderId,
    signature,
    amount,
    planName
  }, { auth: true });
  if (data.success) persistSubscriptionStatus(data.subscriptionStatus || 'ACTIVE');
  return data;
}

async function getPaymentHistory() {
  return apiRequest('getPaymentHistory', {}, { auth: true });
}

async function getDashboardStats() {
  return apiRequest('getDashboardStats', {}, { admin: true });
}

async function getAllStudents() {
  return apiRequest('getAllStudents', {}, { admin: true });
}

async function getAllClasses() {
  return getClasses();
}

async function getAllPayments() {
  return apiRequest('getAllPayments', {}, { admin: true });
}

async function adminListRecords(entity) {
  return apiRequest('adminListRecords', { entity }, { admin: true });
}

async function adminCreateRecord(entity, record) {
  return apiRequest('adminCreateRecord', { entity, record }, { admin: true });
}

async function adminUpdateRecord(entity, id, record) {
  return apiRequest('adminUpdateRecord', { entity, id, record }, { admin: true });
}

async function adminDeleteRecord(entity, id) {
  return apiRequest('adminDeleteRecord', { entity, id }, { admin: true });
}

async function adminUpdateStudentStatus(userId, subscriptionStatus, accountStatus = 'ACTIVE') {
  return apiRequest('adminUpdateStudentStatus', {
    userId,
    subscriptionStatus,
    accountStatus
  }, { admin: true });
}
