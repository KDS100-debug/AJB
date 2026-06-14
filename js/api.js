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

class APIError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

function isConfiguredApiUrl() {
  return Boolean(CONFIG.APPS_SCRIPT_URL) &&
    !CONFIG.APPS_SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT');
}

function getSessionToken() {
  return localStorage.getItem('sessionToken') || '';
}

function getAdminToken() {
  return localStorage.getItem('adminToken') || getSessionToken();
}

async function apiRequest(action, payload = {}, options = {}) {
  if (!isConfiguredApiUrl()) {
    throw new APIError('Configure CONFIG.APPS_SCRIPT_URL in js/api.js before using the website.', 400);
  }

  const body = { action, ...payload };
  if (options.auth && !body.sessionToken) body.sessionToken = getSessionToken();
  if (options.admin && !body.adminToken) body.adminToken = getAdminToken();

  try {
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });
    if (!response.ok) throw new APIError(`API request failed with status ${response.status}.`, response.status);
    const data = await response.json();
    if (!data.success && options.throwOnError !== false) {
      throw new APIError(data.message || 'The API request failed.', 400);
    }
    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error(`${action} API error:`, error);
    throw new APIError('Unable to reach the AJB LEARN backend. Check the Apps Script deployment.', 503);
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
  return apiRequest('registerUser', {
    name: userData.fullName || userData.name,
    mobile: userData.mobile,
    email: userData.email,
    password: userData.password,
    mediumId: userData.mediumId || '',
    classId: userData.classId || ''
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
  return apiRequest('getMediums');
}

async function getClasses(mediumId = '') {
  return apiRequest('getClasses', { mediumId });
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
