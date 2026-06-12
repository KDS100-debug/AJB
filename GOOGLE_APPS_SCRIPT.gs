/* ============================================
   AJB LEARN - GOOGLE APPS SCRIPT BACKEND

   Required Script Properties:
   RAZORPAY_KEY_ID
   RAZORPAY_KEY_SECRET
   SPREADSHEET_ID

   Optional Script Properties:
   ADMIN_EMAIL
   ADMIN_PASSWORD
   ADMIN_PASSWORD_HASH
   ============================================ */

var SHEET_NAMES = {
  USERS: 'USERS',
  PAYMENTS: 'PAYMENTS',
  SUBSCRIPTIONS: 'SUBSCRIPTIONS',
  CLASSES: 'CLASSES',
  SUBJECTS: 'SUBJECTS',
  CHAPTERS: 'CHAPTERS',
  VIDEOS: 'VIDEOS',
  NOTES: 'NOTES',
  QUIZZES: 'QUIZZES',
  PROGRESS: 'PROGRESS'
};

var SHEET_HEADERS = {};
SHEET_HEADERS[SHEET_NAMES.USERS] = [
  'USER_ID',
  'NAME',
  'MOBILE',
  'EMAIL',
  'PASSWORD_HASH',
  'REGISTER_DATE',
  'SUBSCRIPTION_STATUS',
  'ROLE'
];
SHEET_HEADERS[SHEET_NAMES.PAYMENTS] = [
  'PAYMENT_ID',
  'USER_ID',
  'NAME',
  'EMAIL',
  'MOBILE',
  'AMOUNT',
  'CURRENCY',
  'PAYMENT_STATUS',
  'RAZORPAY_PAYMENT_ID',
  'RAZORPAY_ORDER_ID',
  'RAZORPAY_SIGNATURE',
  'PAYMENT_DATE',
  'PLAN_NAME'
];
SHEET_HEADERS[SHEET_NAMES.SUBSCRIPTIONS] = [
  'SUBSCRIPTION_ID',
  'USER_ID',
  'PLAN_NAME',
  'AMOUNT',
  'START_DATE',
  'END_DATE',
  'STATUS',
  'PAYMENT_ID'
];
SHEET_HEADERS[SHEET_NAMES.CLASSES] = ['CLASS_ID', 'CLASS_NAME', 'MEDIUM'];
SHEET_HEADERS[SHEET_NAMES.SUBJECTS] = ['SUBJECT_ID', 'CLASS_ID', 'SUBJECT_NAME'];
SHEET_HEADERS[SHEET_NAMES.CHAPTERS] = ['CHAPTER_ID', 'CLASS_ID', 'SUBJECT_ID', 'CHAPTER_NAME'];
SHEET_HEADERS[SHEET_NAMES.VIDEOS] = [
  'VIDEO_ID',
  'CLASS_ID',
  'SUBJECT_ID',
  'CHAPTER_ID',
  'TITLE',
  'VIDEO_LINK',
  'THUMBNAIL',
  'DURATION',
  'DESCRIPTION'
];
SHEET_HEADERS[SHEET_NAMES.NOTES] = ['NOTE_ID', 'VIDEO_ID', 'TITLE', 'DESCRIPTION', 'PDF_LINK'];
SHEET_HEADERS[SHEET_NAMES.QUIZZES] = [
  'QUIZ_ID',
  'VIDEO_ID',
  'TITLE',
  'QUESTION',
  'OPTION_A',
  'OPTION_B',
  'OPTION_C',
  'OPTION_D',
  'ANSWER'
];
SHEET_HEADERS[SHEET_NAMES.PROGRESS] = [
  'PROGRESS_ID',
  'USER_ID',
  'CONTENT_ID',
  'WATCHED',
  'SCORE_PERCENTAGE',
  'UPDATED_AT'
];

var PLAN_AMOUNT = 29900;
var PLAN_AMOUNT_RUPEES = 299;
var PLAN_NAME = 'AJB Premium';
var PLAN_CURRENCY = 'INR';

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents || '{}');
    var action = params.action;
    var response;

    setupDatabase();

    switch (action) {
      case 'registerUser':
        response = registerUser(params);
        break;
      case 'loginUser':
        response = loginUser(params);
        break;
      case 'adminLogin':
        response = adminLogin(params.email, params.password);
        break;
      case 'getClasses':
        response = getClasses();
        break;
      case 'getSubjects':
        response = getSubjects(params.classId);
        break;
      case 'getChapters':
        response = getChapters(params.classId, params.subjectId);
        break;
      case 'getVideos':
        response = getVideos(params.chapterId);
        break;
      case 'getNotes':
        response = getNotes(params.videoId);
        break;
      case 'getQuiz':
        response = getQuiz(params.quizId);
        break;
      case 'saveQuizScore':
        response = saveQuizScore(params.userId, params.quizId, params.score, params.percentage);
        break;
      case 'saveProgress':
        response = saveProgress(params.userId, params.videoId, params.watched);
        break;
      case 'checkSubscription':
      case 'verifySubscription':
        response = checkSubscription(params.userId);
        break;
      case 'getDashboardOverview':
        response = getDashboardOverview(params.userId);
        break;
      case 'createOrder':
        response = createOrder(params);
        break;
      case 'verifyPayment':
        response = verifyPayment(params);
        break;
      case 'getPaymentHistory':
        response = getPaymentHistory(params.userId);
        break;
      case 'getDashboardStats':
        response = getDashboardStats();
        break;
      case 'getAllStudents':
        response = getAllStudents();
        break;
      case 'getAllClasses':
        response = getAllClasses();
        break;
      case 'getAllPayments':
        response = getAllPayments(params.filters || {});
        break;
      case 'addClass':
        response = addClass(params.className, params.medium);
        break;
      case 'addSubject':
        response = addSubject(params.subjectName, params.classId);
        break;
      case 'addVideo':
        response = addVideo(params);
        break;
      case 'changePassword':
        response = changePassword(params.userId, params.currentPassword, params.newPassword);
        break;
      default:
        response = { success: false, message: 'Invalid action' };
    }

    return jsonResponse(response);
  } catch (error) {
    return jsonResponse({ success: false, message: String(error) });
  }
}

function doGet() {
  return jsonResponse({
    success: true,
    message: 'AJB Learn API is running. Use POST requests.'
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupDatabase() {
  Object.keys(SHEET_HEADERS).forEach(function(sheetName) {
    getOrCreateSheet(sheetName);
  });
}

function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('SPREADSHEET_ID');
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  ensureHeaders(sheet, SHEET_HEADERS[sheetName] || []);
  return sheet;
}

function ensureHeaders(sheet, headers) {
  if (!headers.length) return;

  var currentHeaders = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0]
    : [];

  var needsHeaders = sheet.getLastRow() === 0 || currentHeaders[0] !== headers[0];
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function getRowsAsObjects(sheetName) {
  var sheet = getOrCreateSheet(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0];
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    if (!values[i][0]) continue;
    var row = { _rowNumber: i + 1 };
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    rows.push(row);
  }

  return rows;
}

function appendObject(sheetName, data) {
  var sheet = getOrCreateSheet(sheetName);
  var headers = SHEET_HEADERS[sheetName];
  var row = headers.map(function(header) {
    return data[header] !== undefined ? data[header] : '';
  });
  sheet.appendRow(row);
  return row;
}

function updateRowByNumber(sheetName, rowNumber, data) {
  var sheet = getOrCreateSheet(sheetName);
  var headers = SHEET_HEADERS[sheetName];

  headers.forEach(function(header, index) {
    if (data[header] !== undefined) {
      sheet.getRange(rowNumber, index + 1).setValue(data[header]);
    }
  });
}

function getNowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 16).toUpperCase();
}

function hashPassword(password) {
  return sha256(String(password || ''));
}

function sha256(value) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );
  return bytesToHex(bytes);
}

function bytesToHex(bytes) {
  var hex = [];
  for (var i = 0; i < bytes.length; i++) {
    var normalized = bytes[i];
    if (normalized < 0) normalized += 256;
    hex.push(('0' + normalized.toString(16)).slice(-2));
  }
  return hex.join('');
}

function findUserByEmail(email) {
  var normalizedEmail = String(email || '').trim().toLowerCase();
  var users = getRowsAsObjects(SHEET_NAMES.USERS);
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].EMAIL || '').trim().toLowerCase() === normalizedEmail) {
      return users[i];
    }
  }
  return null;
}

function findUserById(userId) {
  var users = getRowsAsObjects(SHEET_NAMES.USERS);
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].USER_ID) === String(userId)) {
      return users[i];
    }
  }
  return null;
}

function registerUser(params) {
  if (!params.name || !params.mobile || !params.email || !params.password) {
    return { success: false, message: 'Name, mobile, email, and password are required.' };
  }

  if (findUserByEmail(params.email)) {
    return { success: false, message: 'Email already registered.' };
  }

  var userId = makeId('USER');
  appendObject(SHEET_NAMES.USERS, {
    USER_ID: userId,
    NAME: params.name,
    MOBILE: params.mobile,
    EMAIL: params.email,
    PASSWORD_HASH: hashPassword(params.password),
    REGISTER_DATE: getNowIso(),
    SUBSCRIPTION_STATUS: 'INACTIVE',
    ROLE: 'STUDENT'
  });

  return {
    success: true,
    message: 'User registered successfully.',
    userId: userId
  };
}

function loginUser(params) {
  var user = findUserByEmail(params.email);
  if (!user) {
    return { success: false, message: 'Invalid email or password.' };
  }

  var submittedHash = hashPassword(params.password);
  var storedPassword = String(user.PASSWORD_HASH || '');
  var passwordMatches = storedPassword === submittedHash || storedPassword === String(params.password || '');

  if (!passwordMatches) {
    return { success: false, message: 'Invalid email or password.' };
  }

  var subscription = checkSubscription(user.USER_ID);
  var sessionToken = makeId('SESSION');
  var role = String(user.ROLE || 'STUDENT').toUpperCase();

  return {
    success: true,
    message: 'Login successful.',
    sessionToken: sessionToken,
    user: {
      id: user.USER_ID,
      name: user.NAME,
      mobile: user.MOBILE,
      email: user.EMAIL,
      subscriptionStatus: subscription.subscriptionStatus,
      isSubscribed: subscription.isSubscribed,
      isAdmin: role === 'ADMIN',
      role: role
    }
  };
}

function changePassword(userId, currentPassword, newPassword) {
  var user = findUserById(userId);
  if (!user) return { success: false, message: 'User not found.' };

  var submittedHash = hashPassword(currentPassword);
  var storedPassword = String(user.PASSWORD_HASH || '');
  var passwordMatches = storedPassword === submittedHash || storedPassword === String(currentPassword || '');

  if (!passwordMatches) {
    return { success: false, message: 'Current password is incorrect.' };
  }

  updateRowByNumber(SHEET_NAMES.USERS, user._rowNumber, {
    PASSWORD_HASH: hashPassword(newPassword)
  });

  return { success: true, message: 'Password changed successfully.' };
}

function adminLogin(email, password) {
  var props = PropertiesService.getScriptProperties();
  var adminEmail = props.getProperty('ADMIN_EMAIL') || 'admin@ajblearn.com';
  var adminPasswordHash = props.getProperty('ADMIN_PASSWORD_HASH');
  var adminPassword = props.getProperty('ADMIN_PASSWORD') || 'admin123';

  var emailMatches = String(email || '').trim().toLowerCase() === String(adminEmail).trim().toLowerCase();
  var passwordMatches = adminPasswordHash
    ? hashPassword(password) === adminPasswordHash
    : String(password || '') === adminPassword;

  if (emailMatches && passwordMatches) {
    return {
      success: true,
      message: 'Admin login successful.',
      adminToken: makeId('ADMIN'),
      isAdmin: true
    };
  }

  return { success: false, message: 'Invalid admin credentials.' };
}

function checkSubscription(userId) {
  if (!userId) {
    return { success: false, subscriptionStatus: 'INACTIVE', isSubscribed: false };
  }

  var user = findUserById(userId);
  if (user && String(user.SUBSCRIPTION_STATUS || '').toUpperCase() === 'ACTIVE') {
    return { success: true, subscriptionStatus: 'ACTIVE', isSubscribed: true };
  }

  var subscriptions = getRowsAsObjects(SHEET_NAMES.SUBSCRIPTIONS);
  for (var i = 0; i < subscriptions.length; i++) {
    if (
      String(subscriptions[i].USER_ID) === String(userId) &&
      String(subscriptions[i].STATUS || '').toUpperCase() === 'ACTIVE'
    ) {
      if (user) {
        updateRowByNumber(SHEET_NAMES.USERS, user._rowNumber, { SUBSCRIPTION_STATUS: 'ACTIVE' });
      }
      return { success: true, subscriptionStatus: 'ACTIVE', isSubscribed: true };
    }
  }

  return { success: true, subscriptionStatus: 'INACTIVE', isSubscribed: false };
}

function buildPaymentCustomer(params, existingPayment) {
  var user = findUserById(params.userId);
  if (user) {
    return {
      USER_ID: user.USER_ID,
      NAME: user.NAME,
      EMAIL: user.EMAIL,
      MOBILE: user.MOBILE,
      IS_GUEST: false
    };
  }

  var guestId = String(params.userId || (existingPayment && existingPayment.USER_ID) || makeId('GUEST')).trim();
  return {
    USER_ID: guestId,
    NAME: String(params.name || (existingPayment && existingPayment.NAME) || 'Guest Learner').trim(),
    EMAIL: String(params.email || (existingPayment && existingPayment.EMAIL) || '').trim(),
    MOBILE: String(params.mobile || (existingPayment && existingPayment.MOBILE) || '').trim(),
    IS_GUEST: true
  };
}

function createOrder(params) {
  var user = buildPaymentCustomer(params);

  if (!user.USER_ID) {
    return { success: false, message: 'Payment customer details are missing.' };
  }

  var subscription = checkSubscription(user.USER_ID);
  if (subscription.isSubscribed) {
    return {
      success: true,
      alreadySubscribed: true,
      subscriptionStatus: 'ACTIVE',
      message: 'Already subscribed.'
    };
  }

  var amount = Number(params.amount || PLAN_AMOUNT);
  var planName = params.planName || PLAN_NAME;

  if (amount !== PLAN_AMOUNT) {
    return { success: false, message: 'Invalid payment amount.' };
  }

  var razorpayOrder = createRazorpayOrder(amount, planName, user);
  var paymentId = makeId('PAY');

  appendObject(SHEET_NAMES.PAYMENTS, {
    PAYMENT_ID: paymentId,
    USER_ID: user.USER_ID,
    NAME: user.NAME,
    EMAIL: user.EMAIL,
    MOBILE: user.MOBILE,
    AMOUNT: amount / 100,
    CURRENCY: PLAN_CURRENCY,
    PAYMENT_STATUS: 'pending',
    RAZORPAY_PAYMENT_ID: '',
    RAZORPAY_ORDER_ID: razorpayOrder.id,
    RAZORPAY_SIGNATURE: '',
    PAYMENT_DATE: getNowIso(),
    PLAN_NAME: planName
  });

  return {
    success: true,
    orderId: razorpayOrder.id,
    order_id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    paymentId: paymentId
  };
}

function createRazorpayOrder(amount, planName, user) {
  var props = PropertiesService.getScriptProperties();
  var keyId = props.getProperty('RAZORPAY_KEY_ID');
  var keySecret = props.getProperty('RAZORPAY_KEY_SECRET');

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are missing in Script Properties.');
  }

  var payload = {
    amount: amount,
    currency: PLAN_CURRENCY,
    receipt: makeId('RCPT'),
    notes: {
      userId: user.USER_ID,
      planName: planName,
      checkoutMode: user.IS_GUEST ? 'guest' : 'logged-in',
      email: user.EMAIL,
      mobile: user.MOBILE
    }
  };

  var response = UrlFetchApp.fetch('https://api.razorpay.com/v1/orders', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Basic ' + Utilities.base64Encode(keyId + ':' + keySecret)
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var statusCode = response.getResponseCode();
  var body = JSON.parse(response.getContentText() || '{}');

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(body.error && body.error.description ? body.error.description : 'Unable to create Razorpay order.');
  }

  return body;
}

function verifyPayment(params) {
  var paymentId = params.razorpay_payment_id || params.paymentId;
  var orderId = params.razorpay_order_id || params.orderId;
  var signature = params.razorpay_signature || params.signature;
  var orderPayment = findPaymentByOrderId(orderId);
  var userId = params.userId || (orderPayment && orderPayment.USER_ID);
  var amount = Number(params.amount || PLAN_AMOUNT);
  var planName = params.planName || PLAN_NAME;

  if (!paymentId || !orderId || !signature || !userId) {
    return { success: false, message: 'Missing payment verification fields.' };
  }

  var existingPayment = findPaymentByRazorpayPaymentId(paymentId);
  if (existingPayment && String(existingPayment.PAYMENT_STATUS || '').toLowerCase() === 'captured') {
    updateUserSubscription(userId, 'ACTIVE');
    return {
      success: true,
      duplicate: true,
      message: 'Payment already processed.',
      subscriptionStatus: 'ACTIVE'
    };
  }

  if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
    updatePaymentByOrder(orderId, {
      PAYMENT_STATUS: 'failed',
      RAZORPAY_PAYMENT_ID: paymentId,
      RAZORPAY_SIGNATURE: signature,
      PAYMENT_DATE: getNowIso()
    });
    return { success: false, message: 'Invalid Razorpay signature.' };
  }

  var user = buildPaymentCustomer(params, orderPayment);

  var appPaymentId = updatePaymentByOrder(orderId, {
    USER_ID: user.USER_ID,
    NAME: user.NAME,
    EMAIL: user.EMAIL,
    MOBILE: user.MOBILE,
    AMOUNT: amount / 100,
    CURRENCY: PLAN_CURRENCY,
    PAYMENT_STATUS: 'captured',
    RAZORPAY_PAYMENT_ID: paymentId,
    RAZORPAY_ORDER_ID: orderId,
    RAZORPAY_SIGNATURE: signature,
    PAYMENT_DATE: getNowIso(),
    PLAN_NAME: planName
  });

  if (!appPaymentId) {
    appPaymentId = makeId('PAY');
    appendObject(SHEET_NAMES.PAYMENTS, {
      PAYMENT_ID: appPaymentId,
      USER_ID: user.USER_ID,
      NAME: user.NAME,
      EMAIL: user.EMAIL,
      MOBILE: user.MOBILE,
      AMOUNT: amount / 100,
      CURRENCY: PLAN_CURRENCY,
      PAYMENT_STATUS: 'captured',
      RAZORPAY_PAYMENT_ID: paymentId,
      RAZORPAY_ORDER_ID: orderId,
      RAZORPAY_SIGNATURE: signature,
      PAYMENT_DATE: getNowIso(),
      PLAN_NAME: planName
    });
  }

  updateUserSubscription(user.USER_ID, 'ACTIVE');
  createOrUpdateSubscription(user.USER_ID, planName, amount / 100, appPaymentId);

  return {
    success: true,
    message: 'Payment verified.',
    subscriptionStatus: 'ACTIVE',
    paymentId: appPaymentId
  };
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  var keySecret = PropertiesService.getScriptProperties().getProperty('RAZORPAY_KEY_SECRET');
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is missing in Script Properties.');
  }

  var payload = String(orderId) + '|' + String(paymentId);
  var bytes = Utilities.computeHmacSha256Signature(payload, keySecret);
  var expectedSignature = bytesToHex(bytes);
  return expectedSignature.toLowerCase() === String(signature || '').toLowerCase();
}

function findPaymentByRazorpayPaymentId(razorpayPaymentId) {
  var payments = getRowsAsObjects(SHEET_NAMES.PAYMENTS);
  for (var i = 0; i < payments.length; i++) {
    if (String(payments[i].RAZORPAY_PAYMENT_ID) === String(razorpayPaymentId)) {
      return payments[i];
    }
  }
  return null;
}

function findPaymentByOrderId(orderId) {
  var payments = getRowsAsObjects(SHEET_NAMES.PAYMENTS);
  for (var i = 0; i < payments.length; i++) {
    if (String(payments[i].RAZORPAY_ORDER_ID) === String(orderId)) {
      return payments[i];
    }
  }
  return null;
}

function updatePaymentByOrder(orderId, updates) {
  var payments = getRowsAsObjects(SHEET_NAMES.PAYMENTS);
  for (var i = 0; i < payments.length; i++) {
    if (String(payments[i].RAZORPAY_ORDER_ID) === String(orderId)) {
      updateRowByNumber(SHEET_NAMES.PAYMENTS, payments[i]._rowNumber, updates);
      return payments[i].PAYMENT_ID;
    }
  }
  return null;
}

function updateUserSubscription(userId, status) {
  var user = findUserById(userId);
  if (!user) return;
  updateRowByNumber(SHEET_NAMES.USERS, user._rowNumber, {
    SUBSCRIPTION_STATUS: status
  });
}

function createOrUpdateSubscription(userId, planName, amount, paymentId) {
  var subscriptions = getRowsAsObjects(SHEET_NAMES.SUBSCRIPTIONS);
  for (var i = 0; i < subscriptions.length; i++) {
    if (String(subscriptions[i].USER_ID) === String(userId)) {
      updateRowByNumber(SHEET_NAMES.SUBSCRIPTIONS, subscriptions[i]._rowNumber, {
        PLAN_NAME: planName,
        AMOUNT: amount,
        START_DATE: getNowIso(),
        END_DATE: 'LIFETIME',
        STATUS: 'ACTIVE',
        PAYMENT_ID: paymentId
      });
      return subscriptions[i].SUBSCRIPTION_ID;
    }
  }

  var subscriptionId = makeId('SUB');
  appendObject(SHEET_NAMES.SUBSCRIPTIONS, {
    SUBSCRIPTION_ID: subscriptionId,
    USER_ID: userId,
    PLAN_NAME: planName,
    AMOUNT: amount,
    START_DATE: getNowIso(),
    END_DATE: 'LIFETIME',
    STATUS: 'ACTIVE',
    PAYMENT_ID: paymentId
  });
  return subscriptionId;
}

function getPaymentHistory(userId) {
  var payments = getRowsAsObjects(SHEET_NAMES.PAYMENTS).filter(function(payment) {
    return String(payment.USER_ID) === String(userId);
  }).map(paymentToDto);

  return { success: true, payments: payments };
}

function getAllPayments(filters) {
  var payments = getRowsAsObjects(SHEET_NAMES.PAYMENTS).map(paymentToDto);

  if (filters) {
    if (filters.status) {
      payments = payments.filter(function(payment) {
        return String(payment.status).toLowerCase() === String(filters.status).toLowerCase();
      });
    }

    if (filters.date) {
      payments = payments.filter(function(payment) {
        return String(payment.date || '').slice(0, 10) === String(filters.date);
      });
    }

    if (filters.user) {
      var query = String(filters.user).toLowerCase();
      payments = payments.filter(function(payment) {
        return [
          payment.studentName,
          payment.name,
          payment.email,
          payment.mobile,
          payment.id,
          payment.razorpayPaymentId,
          payment.razorpayOrderId
        ].join(' ').toLowerCase().indexOf(query) !== -1;
      });
    }
  }

  var successfulPayments = payments.filter(function(payment) {
    return ['captured', 'success', 'paid'].indexOf(String(payment.status).toLowerCase()) !== -1;
  });
  var totalRevenue = successfulPayments.reduce(function(sum, payment) {
    return sum + Number(payment.amount || 0);
  }, 0);
  var paidUsers = {};
  successfulPayments.forEach(function(payment) {
    paidUsers[payment.userId || payment.email] = true;
  });

  return {
    success: true,
    payments: payments,
    totalRevenue: totalRevenue,
    totalPaidUsers: Object.keys(paidUsers).length
  };
}

function paymentToDto(payment) {
  return {
    id: payment.PAYMENT_ID,
    paymentId: payment.PAYMENT_ID,
    userId: payment.USER_ID,
    studentName: payment.NAME,
    name: payment.NAME,
    email: payment.EMAIL,
    mobile: payment.MOBILE,
    amount: payment.AMOUNT,
    currency: payment.CURRENCY,
    status: payment.PAYMENT_STATUS,
    paymentStatus: payment.PAYMENT_STATUS,
    razorpayPaymentId: payment.RAZORPAY_PAYMENT_ID,
    razorpayOrderId: payment.RAZORPAY_ORDER_ID,
    date: payment.PAYMENT_DATE,
    paymentDate: payment.PAYMENT_DATE,
    planName: payment.PLAN_NAME
  };
}

function getDashboardOverview(userId) {
  var subscription = checkSubscription(userId);
  var videosWatched = countVideosWatched(userId);
  var quizzesCompleted = countQuizzesCompleted(userId);
  var averageScore = getAverageScore(userId);

  return {
    success: true,
    isSubscribed: subscription.isSubscribed,
    subscriptionStatus: subscription.subscriptionStatus,
    videosWatched: videosWatched,
    quizzesCompleted: quizzesCompleted,
    averageScore: averageScore,
    studyHours: Math.floor(videosWatched * 0.5)
  };
}

function getDashboardStats() {
  var users = getRowsAsObjects(SHEET_NAMES.USERS);
  var paymentsResponse = getAllPayments({});
  var videos = getRowsAsObjects(SHEET_NAMES.VIDEOS);

  var activeStudents = users.filter(function(user) {
    return String(user.SUBSCRIPTION_STATUS || '').toUpperCase() === 'ACTIVE';
  }).length;

  return {
    success: true,
    totalStudents: users.length,
    activeStudents: activeStudents,
    totalPaidUsers: paymentsResponse.totalPaidUsers,
    totalRevenue: paymentsResponse.totalRevenue,
    totalVideos: videos.length
  };
}

function getAllStudents() {
  var students = getRowsAsObjects(SHEET_NAMES.USERS).map(function(user) {
    return {
      id: user.USER_ID,
      name: user.NAME,
      email: user.EMAIL,
      mobile: user.MOBILE,
      status: user.SUBSCRIPTION_STATUS,
      subscriptionStatus: user.SUBSCRIPTION_STATUS,
      role: user.ROLE,
      joinDate: user.REGISTER_DATE
    };
  });

  return { success: true, students: students };
}

function getClasses() {
  var classes = getRowsAsObjects(SHEET_NAMES.CLASSES).map(function(item) {
    return {
      id: item.CLASS_ID,
      name: item.CLASS_NAME,
      medium: item.MEDIUM,
      subjectCount: countSubjectsForClass(item.CLASS_ID)
    };
  });

  return { success: true, classes: classes };
}

function getAllClasses() {
  return getClasses();
}

function getSubjects(classId) {
  var subjects = getRowsAsObjects(SHEET_NAMES.SUBJECTS).filter(function(item) {
    return !classId || String(item.CLASS_ID) === String(classId);
  }).map(function(item) {
    return {
      id: item.SUBJECT_ID,
      name: item.SUBJECT_NAME,
      classId: item.CLASS_ID
    };
  });

  return { success: true, subjects: subjects };
}

function getChapters(classId, subjectId) {
  var chapters = getRowsAsObjects(SHEET_NAMES.CHAPTERS).filter(function(item) {
    var classMatches = !classId || String(item.CLASS_ID) === String(classId);
    var subjectMatches = !subjectId || String(item.SUBJECT_ID) === String(subjectId);
    return classMatches && subjectMatches;
  }).map(function(item) {
    return {
      id: item.CHAPTER_ID,
      name: item.CHAPTER_NAME,
      classId: item.CLASS_ID,
      subjectId: item.SUBJECT_ID
    };
  });

  return { success: true, chapters: chapters };
}

function getVideos(chapterId) {
  var videos = getRowsAsObjects(SHEET_NAMES.VIDEOS).filter(function(item) {
    return !chapterId || String(item.CHAPTER_ID) === String(chapterId);
  }).map(function(item) {
    return {
      id: item.VIDEO_ID,
      title: item.TITLE,
      class: item.CLASS_ID,
      subject: item.SUBJECT_ID,
      chapter: item.CHAPTER_ID,
      videoLink: item.VIDEO_LINK,
      thumbnail: item.THUMBNAIL,
      duration: item.DURATION,
      description: item.DESCRIPTION
    };
  });

  return { success: true, videos: videos };
}

function getNotes(videoId) {
  var notes = getRowsAsObjects(SHEET_NAMES.NOTES).filter(function(item) {
    return !videoId || String(item.VIDEO_ID) === String(videoId);
  }).map(function(item) {
    return {
      id: item.NOTE_ID,
      title: item.TITLE,
      description: item.DESCRIPTION,
      pdfLink: item.PDF_LINK
    };
  });

  return { success: true, notes: notes };
}

function getQuiz(quizId) {
  var questions = getRowsAsObjects(SHEET_NAMES.QUIZZES).filter(function(item) {
    return !quizId || String(item.QUIZ_ID) === String(quizId);
  }).map(function(item) {
    return {
      id: item.QUIZ_ID,
      title: item.TITLE,
      question: item.QUESTION,
      optionA: item.OPTION_A,
      optionB: item.OPTION_B,
      optionC: item.OPTION_C,
      optionD: item.OPTION_D,
      answer: item.ANSWER
    };
  });

  return {
    success: true,
    quizId: quizId,
    quizTitle: 'Quiz',
    questions: questions
  };
}

function saveProgress(userId, videoId, watched) {
  appendObject(SHEET_NAMES.PROGRESS, {
    PROGRESS_ID: makeId('PROG'),
    USER_ID: userId,
    CONTENT_ID: videoId,
    WATCHED: watched === true,
    SCORE_PERCENTAGE: 0,
    UPDATED_AT: getNowIso()
  });

  return { success: true, message: 'Progress saved.' };
}

function saveQuizScore(userId, quizId, score, percentage) {
  appendObject(SHEET_NAMES.PROGRESS, {
    PROGRESS_ID: makeId('PROG'),
    USER_ID: userId,
    CONTENT_ID: quizId,
    WATCHED: false,
    SCORE_PERCENTAGE: percentage,
    UPDATED_AT: getNowIso()
  });

  return { success: true, message: 'Quiz score saved.' };
}

function addClass(className, medium) {
  var classId = makeId('CLASS');
  appendObject(SHEET_NAMES.CLASSES, {
    CLASS_ID: classId,
    CLASS_NAME: className,
    MEDIUM: medium
  });
  return { success: true, message: 'Class added.', classId: classId };
}

function addSubject(subjectName, classId) {
  var subjectId = makeId('SUBJ');
  appendObject(SHEET_NAMES.SUBJECTS, {
    SUBJECT_ID: subjectId,
    CLASS_ID: classId,
    SUBJECT_NAME: subjectName
  });
  return { success: true, message: 'Subject added.', subjectId: subjectId };
}

function addVideo(params) {
  var videoId = makeId('VIDEO');
  appendObject(SHEET_NAMES.VIDEOS, {
    VIDEO_ID: videoId,
    CLASS_ID: params.class || params.classId,
    SUBJECT_ID: params.subject || params.subjectId,
    CHAPTER_ID: params.chapter || params.chapterId,
    TITLE: params.title,
    VIDEO_LINK: params.videoLink,
    THUMBNAIL: params.thumbnail || '',
    DURATION: params.duration || '',
    DESCRIPTION: params.description || ''
  });
  return { success: true, message: 'Video added.', videoId: videoId };
}

function countSubjectsForClass(classId) {
  return getRowsAsObjects(SHEET_NAMES.SUBJECTS).filter(function(subject) {
    return String(subject.CLASS_ID) === String(classId);
  }).length;
}

function countVideosWatched(userId) {
  return getRowsAsObjects(SHEET_NAMES.PROGRESS).filter(function(item) {
    return String(item.USER_ID) === String(userId) && item.WATCHED === true;
  }).length;
}

function countQuizzesCompleted(userId) {
  return getRowsAsObjects(SHEET_NAMES.PROGRESS).filter(function(item) {
    return String(item.USER_ID) === String(userId) && Number(item.SCORE_PERCENTAGE || 0) > 0;
  }).length;
}

function getAverageScore(userId) {
  var scores = getRowsAsObjects(SHEET_NAMES.PROGRESS).filter(function(item) {
    return String(item.USER_ID) === String(userId) && Number(item.SCORE_PERCENTAGE || 0) > 0;
  }).map(function(item) {
    return Number(item.SCORE_PERCENTAGE || 0);
  });

  if (!scores.length) return 0;
  var total = scores.reduce(function(sum, score) {
    return sum + score;
  }, 0);
  return Math.round(total / scores.length);
}
