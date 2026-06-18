/* =========================================================
   AJB LEARN - GOOGLE APPS SCRIPT / GOOGLE SHEETS REST API

   1. Bind this script to a Google Spreadsheet, or set
      SPREADSHEET_ID below for a standalone Apps Script project.
   2. Configure Script Properties before deploying. See DEPLOYMENT.md.
   3. Run setupSheets() once from the Apps Script editor.
   ========================================================= */

var SPREADSHEET_ID = '';

var SHEET_NAMES = {
  USERS: 'USERS',
  SESSIONS: 'SESSIONS',
  PASSWORD_RESETS: 'PASSWORD_RESETS',
  PAYMENTS: 'PAYMENTS',
  VIDEOS: 'VIDEOS',
  MCQ: 'MCQ',
  PROGRESS: 'PROGRESS',
  BOOKS: 'BOOKS',
  NOTES: 'NOTES',
  QA: 'Q&A'
};

var HEADERS = {};
HEADERS[SHEET_NAMES.USERS] = [
  'User ID',
  'Name',
  'Email',
  'Phone',
  'Password',
  'Medium',
  'Class',
  'Subscription Status',
  'Registration Date',
  'Last Login',
  'Account Status',
  'Role',
  'Profile Image'
];
HEADERS[SHEET_NAMES.SESSIONS] = [
  'Token Hash',
  'User ID',
  'Role',
  'Expires At',
  'Created At',
  'Last Seen At',
  'Revoked At'
];
HEADERS[SHEET_NAMES.PASSWORD_RESETS] = [
  'Request ID',
  'User ID',
  'Channel',
  'OTP Hash',
  'Expires At',
  'Attempts',
  'Verified At',
  'Used At',
  'Created At'
];
HEADERS[SHEET_NAMES.PAYMENTS] = [
  'Payment ID',
  'User ID',
  'Name',
  'Amount',
  'Plan',
  'Payment Method',
  'Transaction ID',
  'Status',
  'Date'
];
HEADERS[SHEET_NAMES.VIDEOS] = [
  'Video ID',
  'Medium',
  'Class',
  'Subject',
  'Chapter',
  'Chapter Name',
  'Video Title',
  'YouTube/Drive URL',
  'Duration'
];
HEADERS[SHEET_NAMES.MCQ] = [
  'MCQ ID',
  'Medium',
  'Class',
  'Subject',
  'Chapter',
  'Question',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Correct Answer',
  'Explanation'
];
HEADERS[SHEET_NAMES.PROGRESS] = [
  'User ID',
  'Video ID',
  'Chapter ID',
  'Chapter',
  'Completed (Yes/No)',
  'Quiz Score',
  'Completion Percentage',
  'Position Seconds',
  'Duration Seconds',
  'Watched Percentage',
  'Completed At',
  'Last Updated'
];
HEADERS[SHEET_NAMES.BOOKS] = [
  'Book ID',
  'Medium',
  'Class',
  'Subject',
  'Book Name',
  'Description',
  'PDF Link',
  'Thumbnail'
];
HEADERS[SHEET_NAMES.NOTES] = [
  'Note ID',
  'Medium',
  'Class',
  'Subject',
  'Chapter',
  'Title',
  'PDF Link'
];
HEADERS[SHEET_NAMES.QA] = [
  'Question ID',
  'User ID',
  'User Name',
  'Medium',
  'Class',
  'Subject',
  'Chapter',
  'Question',
  'Answer',
  'Answered By',
  'Date'
];

var SUCCESSFUL_PAYMENT_STATUSES = ['PAID', 'SUCCESS', 'CAPTURED', 'COMPLETED'];

/**
 * Creates each required sheet and applies the exact header row.
 * Existing data is preserved. Missing header columns are appended.
 */
function setupSheets() {
  var spreadsheet = getSpreadsheet();

  Object.keys(SHEET_NAMES).forEach(function(key) {
    var sheetName = SHEET_NAMES[key];
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    ensureSheetHeaders(sheet, HEADERS[sheetName]);
  });

  return {
    success: true,
    message: 'Required sheets are ready.',
    sheets: Object.keys(SHEET_NAMES).map(function(key) {
      return SHEET_NAMES[key];
    })
  };
}

/**
 * Handles read-only API actions through query parameters.
 *
 * Example:
 * ?action=getVideos&medium=English&class=10&subject=Science&chapter=1
 */
function doGet(e) {
  try {
    setupSheets();

    var params = normalizeRequestParameters((e && e.parameter) || {});
    var action = params.action;
    var result;

    switch (action) {
      case 'getUsers':
        requireAdmin(params);
        result = getUsers(params);
        break;
      case 'getVideos':
        result = getVideos(params);
        break;
      case 'getMCQ':
        result = getMCQ(params);
        break;
      case 'getBooks':
        result = getBooks(params);
        break;
      case 'getNotes':
        result = getNotes(params);
        break;
      case 'getProgress':
        result = getProgress(params);
        break;
      case 'getPayments':
        requireAdmin(params);
        result = getPayments(params);
        break;
      case 'getQA':
        result = getQA(params);
        break;
      case 'checkSubscription':
        result = checkSubscription(params);
        break;
      case 'filterContent':
        result = filterContent(params);
        break;
      case 'health':
      case '':
        result = {
          success: true,
          message: 'AJB LEARN API is running.',
          sheets: Object.keys(SHEET_NAMES).map(function(key) {
            return SHEET_NAMES[key];
          })
        };
        break;
      default:
        throw new Error('Unsupported GET action: ' + action);
    }

    return jsonResponse(result);
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * Handles create/update API actions from a JSON request body.
 *
 * Send the body as text/plain from browser fetch calls to avoid
 * a CORS preflight that Apps Script Web Apps cannot customize.
 */
function doPost(e) {
  try {
    setupSheets();

    var payload = parsePostBody(e);
    var action = String(payload.action || '').trim();
    var result;

    switch (action) {
      case 'health':
      case '':
        result = healthResponse();
        break;
      case 'registerUser':
        result = registerUser(payload);
        break;
      case 'loginUser':
        result = loginUser(payload);
        break;
      case 'adminLogin':
        result = adminLogin(payload);
        break;
      case 'logoutUser':
        result = logoutUser(payload);
        break;
      case 'validateSession':
        result = validateSession(payload);
        break;
      case 'changePassword':
        result = changePassword(payload);
        break;
      case 'getUserProfile':
        result = getUserProfile(payload);
        break;
      case 'updateUserProfile':
        result = updateUserProfile(payload);
        break;
      case 'requestPasswordReset':
        result = requestPasswordReset(payload);
        break;
      case 'resetPasswordWithOtp':
        result = resetPasswordWithOtp(payload);
        break;
      case 'getMediums':
        result = getMediumsForFrontend();
        break;
      case 'getClasses':
        result = getClassesForFrontend(payload);
        break;
      case 'getSubjects':
        result = getSubjectsForFrontend(payload);
        break;
      case 'getChapters':
        result = getChaptersForFrontend(payload);
        break;
      case 'getVideos':
        result = getVideosForFrontend(payload);
        break;
      case 'getEbooks':
        result = getEbooksForFrontend(payload);
        break;
      case 'getPractice':
        result = getPracticeForFrontend(payload);
        break;
      case 'getMCQ':
        result = getMCQForFrontend(payload);
        break;
      case 'getLeaderboard':
        result = getLeaderboardForFrontend(payload);
        break;
      case 'getAnnouncements':
        result = getAnnouncementsForFrontend(payload);
        break;
      case 'getSettings':
        result = getSettingsForFrontend();
        break;
      case 'getPublicCatalog':
        result = getPublicCatalog(payload);
        break;
      case 'saveVideoProgress':
        result = saveVideoProgress(payload);
        break;
      case 'markChapterCompleted':
        result = markChapterCompleted(payload);
        break;
      case 'getStudentProgress':
        result = getStudentProgress(payload);
        break;
      case 'saveQuizScore':
        result = saveQuizScoreForFrontend(payload);
        break;
      case 'getDashboardOverview':
        result = getDashboardOverview(payload);
        break;
      case 'createOrder':
        result = createRazorpayOrder(payload);
        break;
      case 'verifyPayment':
        result = verifyRazorpayPayment(payload);
        break;
      case 'getPaymentHistory':
        result = getPaymentHistory(payload);
        break;
      case 'getDashboardStats':
        requireSession(payload, true);
        result = getDashboardStatsForAdmin();
        break;
      case 'getAllStudents':
        requireSession(payload, true);
        result = getAllStudentsForAdmin();
        break;
      case 'getAllPayments':
        requireSession(payload, true);
        result = getAllPaymentsForAdmin(payload);
        break;
      case 'updateLastLogin':
        result = updateLastLogin(payload);
        break;
      case 'addProgress':
        result = addProgress(payload);
        break;
      case 'submitQuizScore':
        result = submitQuizScore(payload);
        break;
      case 'addPayment':
        requireAdmin(payload);
        result = addPayment(payload);
        break;
      case 'askQuestion':
        result = askQuestion(payload);
        break;
      case 'updateAnswer':
        requireAdmin(payload);
        result = updateAnswer(payload);
        break;
      default:
        throw new Error('Unsupported POST action: ' + action);
    }

    return jsonResponse(result);
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * Returns a JSON ContentService response.
 *
 * Apps Script ContentService does not expose custom response headers.
 * CORS-friendly browser POST examples should therefore use text/plain,
 * which is a CORS "simple request" and does not trigger a preflight.
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(error) {
  return jsonResponse({
    success: false,
    message: String(error && error.message ? error.message : error)
  });
}

function healthResponse() {
  return {
    success: true,
    message: 'AJB LEARN API is running.',
    sheets: Object.keys(SHEET_NAMES).map(function(key) {
      return SHEET_NAMES[key];
    })
  };
}

function getSpreadsheet() {
  var spreadsheetId = getScriptProperty('SPREADSHEET_ID', SPREADSHEET_ID);
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No active spreadsheet. Bind the script to a sheet or set SPREADSHEET_ID.');
  }
  return spreadsheet;
}

function ensureSheetHeaders(sheet, requiredHeaders) {
  if (!requiredHeaders || !requiredHeaders.length) {
    return;
  }

  var lastColumn = sheet.getLastColumn();
  var existingHeaders = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    : [];
  var headersChanged = false;

  if (!existingHeaders.length || !String(existingHeaders[0] || '').trim()) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    headersChanged = true;
  } else {
    var missingHeaders = requiredHeaders.filter(function(header) {
      return existingHeaders.indexOf(header) === -1;
    });

    if (missingHeaders.length) {
      sheet.getRange(1, existingHeaders.length + 1, 1, missingHeaders.length)
        .setValues([missingHeaders]);
      headersChanged = true;
    }
  }

  sheet.setFrozenRows(1);
  if (headersChanged) {
    sheet.getRange(1, 1, 1, sheet.getLastColumn())
      .setFontWeight('bold')
      .setWrap(true);
    sheet.autoResizeColumns(1, sheet.getLastColumn());
  }
}

/**
 * Reads a sheet into an array of objects keyed by the header labels.
 * Internal _rowNumber metadata is included for update operations.
 */
function getSheetData(sheetName) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return [];
  }

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });
  var rows = [];

  for (var rowIndex = 1; rowIndex < values.length; rowIndex++) {
    var valuesRow = values[rowIndex];
    var hasData = valuesRow.some(function(value) {
      return value !== '' && value !== null;
    });

    if (!hasData) {
      continue;
    }

    var record = { _rowNumber: rowIndex + 1 };
    headers.forEach(function(header, columnIndex) {
      record[header] = serializeValue(valuesRow[columnIndex]);
    });
    rows.push(record);
  }

  return rows;
}

/**
 * Applies exact, case-insensitive filters. Empty filter values are ignored.
 */
function filterData(data, filters) {
  var activeFilters = Object.keys(filters || {}).filter(function(key) {
    return filters[key] !== undefined &&
      filters[key] !== null &&
      String(filters[key]).trim() !== '';
  });

  if (!activeFilters.length) {
    return data;
  }

  return data.filter(function(record) {
    return activeFilters.every(function(key) {
      var actual = normalizeComparable(record[key]);
      var expected = normalizeComparable(filters[key]);
      return actual === expected;
    });
  });
}

function generateId(prefix) {
  var random = Math.floor(Math.random() * 1000000000).toString(36).toUpperCase();
  return String(prefix || 'ID').toUpperCase() + '_' +
    Date.now().toString(36).toUpperCase() + '_' + random;
}

function registerUser(payload) {
  var email = normalizeEmail(payload.email);
  var phone = normalizePhone(payload.phone || payload.mobile);
  var medium = cleanText(payload.medium || payload.mediumId);
  var className = normalizeSupportedClassName(payload.class || payload.className || payload.classId);
  requireFields({
    name: payload.name,
    email: email,
    phone: phone,
    password: payload.password,
    medium: medium,
    className: className
  }, ['name', 'email', 'phone', 'password', 'medium', 'className']);
  validateEmail(email);
  validatePhone(phone);
  validateNewPassword(payload.password);
  if (!className) {
    throw new Error('Select a class from Class 1 to Class 10.');
  }

  var users = getSheetData(SHEET_NAMES.USERS);
  var existing = users.some(function(user) {
    return normalizeEmail(user['Email']) === email ||
      normalizePhone(user['Phone']) === phone;
  });

  if (existing) {
    throw new Error('An account with this email or phone number already exists.');
  }

  var userId = generateId('USER');
  var now = new Date().toISOString();
  appendRow(SHEET_NAMES.USERS, {
    'User ID': userId,
    'Name': cleanText(payload.name),
    'Email': email,
    'Phone': phone,
    'Password': hashPassword(payload.password),
    'Medium': medium,
    'Class': className,
    'Subscription Status': 'INACTIVE',
    'Registration Date': now,
    'Last Login': '',
    'Account Status': 'ACTIVE',
    'Role': 'STUDENT',
    'Profile Image': ''
  });

  return {
    success: true,
    message: 'User registered successfully.',
    user: {
      id: userId,
      userId: userId,
      name: cleanText(payload.name),
      email: email,
      phone: phone,
      mobile: phone,
      medium: medium,
      mediumId: medium,
      class: className,
      classId: className,
      subscriptionStatus: 'INACTIVE'
    }
  };
}

function loginUser(payload) {
  requireFields(payload, ['email', 'password']);

  var user = findUserByIdentifier(payload.email);

  if (!user || !verifyPassword(payload.password, user['Password'])) {
    throw new Error('Invalid email or password.');
  }
  if (normalizeStatus(user['Account Status'] || 'ACTIVE') !== 'ACTIVE') {
    throw new Error('This account is inactive. Contact AJB LEARN support.');
  }

  var lastLogin = new Date().toISOString();
  updateSheetRow(SHEET_NAMES.USERS, user._rowNumber, {
    'Last Login': lastLogin
  });

  var subscription = checkSubscription({
    userId: user['User ID'],
    email: user['Email']
  });
  var session = createSession(
    user['User ID'],
    user['Role'] || 'STUDENT',
    payload.rememberMe === true
  );

  return {
    success: true,
    message: 'Login successful.',
    sessionToken: session.token,
    sessionExpires: session.expiresAt,
    user: userToFrontend(user, {
      subscriptionStatus: subscription.subscriptionStatus,
      lastLogin: lastLogin
    })
  };
}

function adminLogin(payload) {
  requireFields(payload, ['email', 'password']);
  var adminEmail = normalizeEmail(getScriptProperty('ADMIN_EMAIL'));
  var adminPassword = getScriptProperty('ADMIN_PASSWORD_HASH') ||
    getScriptProperty('ADMIN_PASSWORD');

  if (!adminEmail || !adminPassword) {
    throw new Error('Admin login is not configured.');
  }
  if (
    normalizeEmail(payload.email) !== adminEmail ||
    !verifyPassword(payload.password, adminPassword)
  ) {
    throw new Error('Invalid email or password.');
  }

  var session = createSession('ADMIN', 'ADMIN', payload.rememberMe === true);
  return {
    success: true,
    message: 'Admin login successful.',
    sessionToken: session.token,
    sessionExpires: session.expiresAt,
    user: {
      id: 'ADMIN',
      userId: 'ADMIN',
      name: 'Administrator',
      email: adminEmail,
      mobile: '',
      subscriptionStatus: 'ACTIVE',
      isSubscribed: true,
      role: 'ADMIN',
      isAdmin: true
    }
  };
}

function createSession(userId, role, rememberMe) {
  var token = Utilities.getUuid() + Utilities.getUuid();
  var now = new Date();
  var durationMs = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;
  var expiresAt = new Date(now.getTime() + durationMs).toISOString();

  appendRow(SHEET_NAMES.SESSIONS, {
    'Token Hash': sha256(token),
    'User ID': cleanText(userId),
    'Role': normalizeStatus(role || 'STUDENT'),
    'Expires At': expiresAt,
    'Created At': now.toISOString(),
    'Last Seen At': now.toISOString(),
    'Revoked At': ''
  });

  return { token: token, expiresAt: expiresAt };
}

function requireSession(payload, requireAdminRole) {
  var token = cleanText((payload && (payload.sessionToken || payload.adminToken)) || '');
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  var session = findRecord(SHEET_NAMES.SESSIONS, 'Token Hash', sha256(token));
  if (
    !session ||
    session['Revoked At'] ||
    new Date(session['Expires At']).getTime() <= Date.now()
  ) {
    throw new Error('Your session has expired. Please login again.');
  }

  var role = normalizeStatus(session['Role'] || 'STUDENT');
  if (requireAdminRole && role !== 'ADMIN') {
    throw new Error('Administrator access is required.');
  }
  return session;
}

function validateSession(payload) {
  var session = requireSession(payload, payload.requireAdmin === true);
  var isAdmin = normalizeStatus(session['Role']) === 'ADMIN';
  var user = isAdmin
    ? {
        id: 'ADMIN',
        userId: 'ADMIN',
        name: 'Administrator',
        email: normalizeEmail(getScriptProperty('ADMIN_EMAIL')),
        role: 'ADMIN',
        isAdmin: true,
        subscriptionStatus: 'ACTIVE',
        isSubscribed: true
      }
    : userToFrontend(findUser({ userId: session['User ID'] }));

  updateSheetRow(SHEET_NAMES.SESSIONS, session._rowNumber, {
    'Last Seen At': new Date().toISOString()
  });

  return { success: true, valid: true, user: user };
}

function logoutUser(payload) {
  var session = requireSession(payload, false);
  updateSheetRow(SHEET_NAMES.SESSIONS, session._rowNumber, {
    'Revoked At': new Date().toISOString()
  });
  return { success: true, message: 'Logged out successfully.' };
}

function changePassword(payload) {
  requireFields(payload, ['currentPassword', 'newPassword']);
  validateNewPassword(payload.newPassword);
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    throw new Error('Admin passwords must be changed in Apps Script Properties.');
  }

  var user = findUser({ userId: session['User ID'] });
  if (!user || !verifyPassword(payload.currentPassword, user['Password'])) {
    throw new Error('Current password is incorrect.');
  }

  updateSheetRow(SHEET_NAMES.USERS, user._rowNumber, {
    'Password': hashPassword(payload.newPassword)
  });
  revokeUserSessions(user['User ID'], session._rowNumber);
  return { success: true, message: 'Password changed successfully.' };
}

function getUserProfile(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    return validateSession(payload);
  }
  var user = findUser({ userId: session['User ID'] });
  if (!user) {
    throw new Error('User not found.');
  }
  return { success: true, user: userToFrontend(user) };
}

function updateUserProfile(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    throw new Error('The administrator profile is managed in Script Properties.');
  }
  var user = findUser({ userId: session['User ID'] });
  if (!user) {
    throw new Error('User not found.');
  }

  var profile = payload.profile || {};
  var phone = normalizePhone(profile.mobile || user['Phone']);
  validatePhone(phone);
  var duplicatePhone = getSheetData(SHEET_NAMES.USERS).some(function(record) {
    return String(record['User ID']) !== String(user['User ID']) &&
      normalizePhone(record['Phone']) === phone;
  });
  if (duplicatePhone) {
    throw new Error('That phone number is already registered.');
  }
  var profileClass = normalizeSupportedClassName(profile.classId || user['Class']);
  if (!profileClass) {
    throw new Error('Select a class from Class 1 to Class 10.');
  }

  updateSheetRow(SHEET_NAMES.USERS, user._rowNumber, {
    'Name': cleanText(profile.name || user['Name']),
    'Phone': phone,
    'Medium': cleanText(profile.mediumId || user['Medium']),
    'Class': profileClass,
    'Profile Image': cleanText(profile.profileImage || user['Profile Image'])
  });

  return {
    success: true,
    message: 'Profile updated.',
    user: userToFrontend(findUser({ userId: user['User ID'] }))
  };
}

function requestPasswordReset(payload) {
  var identifier = cleanText(payload.identifier);
  var channel = normalizeStatus(payload.channel || (identifier.indexOf('@') !== -1 ? 'EMAIL' : 'PHONE'));
  if (channel !== 'EMAIL' && channel !== 'PHONE') {
    throw new Error('Choose email or phone for OTP delivery.');
  }
  requireFields({ identifier: identifier }, ['identifier']);

  var user = findUserByResetIdentifier(identifier, channel);
  var genericMessage = 'If the account exists, a password reset OTP has been sent.';
  if (!user) {
    Utilities.sleep(250);
    return {
      success: true,
      message: genericMessage,
      requestId: generateId('RESET'),
      channel: channel.toLowerCase(),
      expiresInSeconds: 600
    };
  }

  enforceResetRateLimit(user['User ID']);
  var now = new Date();
  var requestId = generateId('RESET');
  var expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  var otpHash = '';

  invalidatePendingResetRequests(user['User ID']);
  if (channel === 'EMAIL') {
    var otp = generateOtp();
    otpHash = hashResetOtp(requestId, otp);
    sendPasswordResetEmail(user, otp);
  } else {
    startTwilioVerification(toE164(user['Phone']));
  }

  appendRow(SHEET_NAMES.PASSWORD_RESETS, {
    'Request ID': requestId,
    'User ID': user['User ID'],
    'Channel': channel,
    'OTP Hash': otpHash,
    'Expires At': expiresAt,
    'Attempts': 0,
    'Verified At': '',
    'Used At': '',
    'Created At': now.toISOString()
  });

  return {
    success: true,
    message: genericMessage,
    requestId: requestId,
    channel: channel.toLowerCase(),
    maskedDestination: channel === 'EMAIL'
      ? maskEmail(user['Email'])
      : maskPhone(user['Phone']),
    expiresInSeconds: 600
  };
}

function resetPasswordWithOtp(payload) {
  requireFields(payload, ['requestId', 'otp', 'newPassword']);
  validateNewPassword(payload.newPassword);
  if (!/^\d{4,10}$/.test(cleanText(payload.otp))) {
    throw new Error('Enter a valid OTP.');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var reset = findRecord(
      SHEET_NAMES.PASSWORD_RESETS,
      'Request ID',
      cleanText(payload.requestId)
    );
    if (
      !reset ||
      reset['Used At'] ||
      new Date(reset['Expires At']).getTime() <= Date.now()
    ) {
      throw new Error('This OTP has expired. Request a new one.');
    }

    var attempts = Number(reset['Attempts'] || 0);
    if (attempts >= 5) {
      throw new Error('Too many incorrect attempts. Request a new OTP.');
    }

    var user = findUser({ userId: reset['User ID'] });
    if (!user) {
      throw new Error('Unable to reset this account.');
    }

    var approved = normalizeStatus(reset['Channel']) === 'PHONE'
      ? checkTwilioVerification(toE164(user['Phone']), cleanText(payload.otp))
      : hashResetOtp(reset['Request ID'], cleanText(payload.otp)) === String(reset['OTP Hash']);

    if (!approved) {
      updateSheetRow(SHEET_NAMES.PASSWORD_RESETS, reset._rowNumber, {
        'Attempts': attempts + 1
      });
      throw new Error('The OTP is incorrect or expired.');
    }

    var now = new Date().toISOString();
    updateSheetRow(SHEET_NAMES.USERS, user._rowNumber, {
      'Password': hashPassword(payload.newPassword)
    });
    updateSheetRow(SHEET_NAMES.PASSWORD_RESETS, reset._rowNumber, {
      'Verified At': now,
      'Used At': now,
      'Attempts': attempts + 1
    });
    revokeUserSessions(user['User ID']);

    return {
      success: true,
      message: 'Password reset successfully. You can now sign in.'
    };
  } finally {
    lock.releaseLock();
  }
}

function getMediumsForFrontend() {
  var values = collectDistinctContentValues('Medium');
  if (!values.length) {
    values = ['English', 'Assamese'];
  }
  return {
    success: true,
    mediums: values.map(function(value) {
      return { id: value, name: value };
    })
  };
}

function getDefaultClassValues() {
  var values = [];
  for (var classNumber = 1; classNumber <= 10; classNumber++) {
    values.push('Class ' + classNumber);
  }
  return values;
}

function normalizeSupportedClassName(value) {
  var text = cleanText(value).replace(/\s+/g, ' ');
  var match = text.match(/^Class\s*0?([1-9]|10)$/i) ||
    text.match(/^0?([1-9]|10)$/) ||
    text.match(/^CLASS0?([1-9]|10)$/i);
  return match ? 'Class ' + Number(match[1]) : '';
}

function getSupportedClassValues(values) {
  var classMap = {};
  getDefaultClassValues().forEach(function(value) {
    classMap[normalizeComparable(value)] = value;
  });
  (values || []).forEach(function(value) {
    var className = normalizeSupportedClassName(value);
    if (className) {
      classMap[normalizeComparable(className)] = className;
    }
  });
  return Object.keys(classMap).map(function(key) {
    return classMap[key];
  }).sort(function(a, b) {
    return Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, ''));
  });
}

function getClassesForFrontend(payload) {
  var values = getSupportedClassValues(
    collectDistinctContentValues('Class', payload.mediumId || payload.medium)
  );
  return {
    success: true,
    classes: values.map(function(value) {
      return {
        id: value,
        name: value,
        mediumId: cleanText(payload.mediumId || payload.medium)
      };
    })
  };
}

function getSubjectsForFrontend(payload) {
  var items = collectDistinctFrontendItems(getContentRecords(), payload, {
    idKeys: ['SUBJECT_ID', 'Subject ID', 'Subject'],
    nameKeys: ['SUBJECT_NAME', 'Subject Name', 'Subject'],
    scope: ['medium', 'class']
  });
  return { success: true, subjects: items };
}

function getChaptersForFrontend(payload) {
  var items = collectDistinctFrontendItems(getContentRecords(), payload, {
    idKeys: ['CHAPTER_ID', 'Chapter ID', 'Chapter'],
    nameKeys: ['CHAPTER_NAME', 'Chapter Name', 'Chapter'],
    descriptionKeys: ['DESCRIPTION', 'Description'],
    scope: ['medium', 'class', 'subject']
  });
  return { success: true, chapters: items };
}

function getVideosForFrontend(payload) {
  var videos = getSheetData(SHEET_NAMES.VIDEOS)
    .filter(function(record) { return recordMatchesScope(record, payload, ['medium', 'class', 'subject', 'chapter']); })
    .filter(isActiveRecord)
    .map(videoToFrontend)
    .sort(sortBySortOrderThenName);
  return dataResponse('videos', videos);
}

function getEbooksForFrontend(payload) {
  var records = getSheetData(SHEET_NAMES.BOOKS).map(function(record) {
    return { record: record, source: 'books' };
  }).concat(getSheetData(SHEET_NAMES.NOTES).map(function(record) {
    return { record: record, source: 'notes' };
  }));

  var ebooks = records
    .filter(function(item) { return recordMatchesScope(item.record, payload, ['medium', 'class', 'subject', 'chapter']); })
    .filter(function(item) { return isActiveRecord(item.record); })
    .map(function(item) { return ebookToFrontend(item.record, item.source); })
    .filter(function(item) { return item.pdfLink; })
    .sort(sortBySortOrderThenName);
  return dataResponse('ebooks', ebooks);
}

function getPracticeForFrontend(payload) {
  return dataResponse('questions', []);
}

function getMCQForFrontend(payload) {
  var questions = getMCQRecordsForPayload(payload)
    .map(function(record) { return mcqToFrontend(record, isAdminAuthorized(payload)); });
  var quizTitle = questions.length ? questions[0].quizTitle : cleanText(payload.quizTitle || 'Chapter Quiz');
  return {
    success: true,
    quizTitle: quizTitle || 'Chapter Quiz',
    questions: questions,
    mcq: questions,
    count: questions.length,
    data: questions
  };
}

function getLeaderboardForFrontend(payload) {
  var expectedChapter = cleanText(payload.chapterId || payload.chapter);
  var expectedQuizTitle = cleanText(payload.quizTitle || 'Chapter Quiz');
  var usersById = indexUsersById();
  var rows = getSheetData(SHEET_NAMES.PROGRESS)
    .filter(function(record) {
      var videoId = cleanText(record['Video ID']);
      var chapterId = cleanText(record['Chapter ID'] || record['Chapter']);
      return videoId.indexOf('QUIZ_') === 0 &&
        (!expectedChapter || normalizeComparable(chapterId) === normalizeComparable(expectedChapter));
    })
    .map(function(record) {
      var parsed = parseQuizScore(record['Quiz Score']);
      var user = usersById[cleanText(record['User ID'])] || {};
      return {
        userId: record['User ID'],
        name: user['Name'] || 'Student',
        quizTitle: expectedQuizTitle,
        score: parsed.correct,
        total: parsed.total,
        percentage: parsed.percentage || Number(record['Completion Percentage'] || 0),
        timeSeconds: Number(record['Duration Seconds'] || record['Position Seconds'] || 0),
        date: record['Last Updated'] || record['Completed At'] || ''
      };
    })
    .sort(function(a, b) {
      if (Number(b.percentage) !== Number(a.percentage)) {
        return Number(b.percentage) - Number(a.percentage);
      }
      return Number(a.timeSeconds || 0) - Number(b.timeSeconds || 0);
    });

  var limit = clampNumber(payload.limit, 1, 100, 20);
  var leaderboard = rows.slice(0, limit).map(function(row, index) {
    row.rank = index + 1;
    return row;
  });
  return dataResponse('leaderboard', leaderboard);
}

function getAnnouncementsForFrontend() {
  return dataResponse('announcements', []);
}

function getSettingsForFrontend() {
  return {
    success: true,
    settings: {},
    data: []
  };
}

function getPublicCatalog(payload) {
  var mediums = getMediumsForFrontend().mediums;
  var classes = getClassesForFrontend(payload || {}).classes;
  var subjects = getSubjectsForFrontend(payload || {}).subjects;
  var chapters = getChaptersForFrontend(payload || {}).chapters;
  return {
    success: true,
    mediums: mediums,
    classes: classes,
    subjects: subjects,
    chapters: chapters
  };
}

function saveVideoProgress(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    throw new Error('Student session required.');
  }

  var now = new Date().toISOString();
  var userId = cleanText(session['User ID']);
  var videoId = cleanText(payload.videoId);
  requireFields({ videoId: videoId }, ['videoId']);

  var watchedPercentage = clampNumber(payload.watchedPercentage, 0, 100, 0);
  var completed = watchedPercentage >= 95 ? 'YES' : 'NO';
  var record = {
    'User ID': userId,
    'Video ID': videoId,
    'Chapter ID': cleanText(payload.chapterId || payload.chapter),
    'Chapter': cleanText(payload.chapter || payload.chapterId),
    'Completed (Yes/No)': completed,
    'Quiz Score': '',
    'Completion Percentage': watchedPercentage,
    'Position Seconds': normalizeNumber(payload.positionSeconds, 0),
    'Duration Seconds': normalizeNumber(payload.durationSeconds, 0),
    'Watched Percentage': watchedPercentage,
    'Completed At': completed === 'YES' ? now : '',
    'Last Updated': now
  };
  upsertProgressRecord(userId, videoId, record);
  return {
    success: true,
    message: 'Video progress saved.',
    progress: progressToFrontend(findProgressRecord(userId, videoId) || record)
  };
}

function markChapterCompleted(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    throw new Error('Student session required.');
  }

  var chapterId = cleanText(payload.chapterId || payload.chapter);
  requireFields({ chapterId: chapterId }, ['chapterId']);
  var now = new Date().toISOString();
  var userId = cleanText(session['User ID']);
  var videoId = 'CHAPTER_' + chapterId;
  var record = {
    'User ID': userId,
    'Video ID': videoId,
    'Chapter ID': chapterId,
    'Chapter': chapterId,
    'Completed (Yes/No)': 'YES',
    'Quiz Score': '',
    'Completion Percentage': 100,
    'Position Seconds': 0,
    'Duration Seconds': 0,
    'Watched Percentage': 100,
    'Completed At': now,
    'Last Updated': now
  };
  upsertProgressRecord(userId, videoId, record);
  return { success: true, message: 'Chapter marked complete.', chapterId: chapterId };
}

function getStudentProgress(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    throw new Error('Student session required.');
  }

  var userId = cleanText(session['User ID']);
  var records = getSheetData(SHEET_NAMES.PROGRESS).filter(function(record) {
    return cleanText(record['User ID']) === userId;
  });
  var progress = records
    .filter(function(record) {
      var videoId = cleanText(record['Video ID']);
      return videoId.indexOf('QUIZ_') !== 0 && videoId.indexOf('CHAPTER_') !== 0;
    })
    .map(progressToFrontend);
  var completedChapters = records
    .filter(isCompletedChapterProgress)
    .map(function(record) {
      return {
        chapterId: cleanText(record['Chapter ID'] || record['Chapter'] || cleanText(record['Video ID']).replace(/^CHAPTER_/, '')),
        completedAt: record['Completed At'] || record['Last Updated'] || ''
      };
    });

  return {
    success: true,
    progress: progress,
    completedChapters: completedChapters
  };
}

function saveQuizScoreForFrontend(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    throw new Error('Student session required.');
  }
  var chapterId = cleanText(payload.chapterId || payload.chapter);
  requireFields({ chapterId: chapterId, answers: payload.answers }, ['chapterId', 'answers']);
  if (!Array.isArray(payload.answers) || !payload.answers.length) {
    throw new Error('answers must be a non-empty array.');
  }

  var answerMap = {};
  payload.answers.forEach(function(answer) {
    answerMap[cleanText(answer.mcqId || answer.id)] = normalizeAnswer(answer.answer);
  });

  var questions = getMCQRecordsForPayload(payload);
  if (!questions.length) {
    throw new Error('No MCQ questions found for this chapter.');
  }

  var correctCount = 0;
  var results = questions.map(function(question) {
    var questionId = getRecordValue(question, ['MCQ_ID', 'MCQ ID', 'Quiz ID']) || ('MCQ_ROW_' + question._rowNumber);
    var submitted = answerMap[questionId] || '';
    var expected = normalizeAnswer(getRecordValue(question, ['CORRECT_ANSWER', 'Correct Answer']));
    var isCorrect = submitted === expected;
    if (isCorrect) correctCount++;
    return {
      mcqId: questionId,
      submittedAnswer: submitted,
      correctAnswer: expected,
      isCorrect: isCorrect,
      explanation: getRecordValue(question, ['EXPLANATION', 'Explanation'])
    };
  });

  var total = questions.length;
  var wrongCount = total - correctCount;
  var percentage = Math.round((correctCount / total) * 100);
  var now = new Date().toISOString();
  var userId = cleanText(session['User ID']);
  var videoId = 'QUIZ_' + chapterId;
  upsertProgressRecord(userId, videoId, {
    'User ID': userId,
    'Video ID': videoId,
    'Chapter ID': chapterId,
    'Chapter': chapterId,
    'Completed (Yes/No)': 'YES',
    'Quiz Score': correctCount + '/' + total,
    'Completion Percentage': percentage,
    'Position Seconds': normalizeNumber(payload.timeSeconds, 0),
    'Duration Seconds': normalizeNumber(payload.timeSeconds, 0),
    'Watched Percentage': 100,
    'Completed At': now,
    'Last Updated': now
  });

  return {
    success: true,
    message: 'Quiz score saved.',
    score: correctCount,
    correctCount: correctCount,
    correctAnswers: correctCount,
    wrongCount: wrongCount,
    wrongAnswers: wrongCount,
    total: total,
    percentage: percentage,
    results: results
  };
}

function getDashboardOverview(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    return {
      success: true,
      user: validateSession(payload).user,
      videosWatched: 0,
      quizzesCompleted: 0,
      averageScore: 0,
      studyHours: 0,
      completedChapters: [],
      continueLearning: null,
      announcements: []
    };
  }

  var user = findUser({ userId: session['User ID'] });
  var subscription = checkSubscription({ userId: user['User ID'] });
  var studentProgress = getStudentProgress(payload);
  var allProgress = getSheetData(SHEET_NAMES.PROGRESS).filter(function(record) {
    return cleanText(record['User ID']) === cleanText(user['User ID']);
  });
  var videoProgress = studentProgress.progress;
  var quizRows = allProgress.filter(function(record) {
    return cleanText(record['Video ID']).indexOf('QUIZ_') === 0;
  });
  var percentages = quizRows.map(function(record) {
    return Number(record['Completion Percentage'] || parseQuizScore(record['Quiz Score']).percentage || 0);
  }).filter(function(value) { return value > 0; });
  var averageScore = percentages.length
    ? Math.round(percentages.reduce(function(sum, value) { return sum + value; }, 0) / percentages.length)
    : 0;
  var watchedSeconds = videoProgress.reduce(function(sum, record) {
    return sum + Number(record.positionSeconds || 0);
  }, 0);
  var continueLearning = videoProgress
    .slice()
    .sort(function(a, b) {
      return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
    })[0] || null;

  return {
    success: true,
    user: userToFrontend(user, { subscriptionStatus: subscription.subscriptionStatus }),
    isSubscribed: subscription.isSubscribed,
    subscriptionStatus: subscription.subscriptionStatus,
    videosWatched: videoProgress.filter(function(record) {
      return Number(record.watchedPercentage || record.completionPercentage || 0) >= 95;
    }).length,
    quizzesCompleted: quizRows.length,
    averageScore: averageScore,
    studyHours: Math.round((watchedSeconds / 3600) * 10) / 10,
    completedChapters: studentProgress.completedChapters,
    continueLearning: continueLearning,
    announcements: getAnnouncementsForFrontend().announcements
  };
}

function getPaymentHistory(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    throw new Error('Student session required.');
  }
  var payments = getSheetData(SHEET_NAMES.PAYMENTS)
    .filter(function(payment) { return cleanText(payment['User ID']) === cleanText(session['User ID']); })
    .map(paymentToFrontend);
  return dataResponse('payments', payments);
}

function createRazorpayOrder(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    throw new Error('Student session required.');
  }
  var keyId = getScriptProperty('RAZORPAY_KEY_ID');
  var keySecret = getScriptProperty('RAZORPAY_KEY_SECRET');
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured in Apps Script Properties.');
  }

  var amount = clampNumber(payload.amount, 100, 10000000, 29900);
  var planName = cleanText(payload.planName || 'AJB Premium');
  var receipt = generateId('ORDER');
  var response = UrlFetchApp.fetch('https://api.razorpay.com/v1/orders', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Basic ' + Utilities.base64Encode(keyId + ':' + keySecret)
    },
    payload: JSON.stringify({
      amount: amount,
      currency: 'INR',
      receipt: receipt,
      notes: {
        userId: cleanText(session['User ID']),
        planName: planName
      }
    }),
    muteHttpExceptions: true
  });
  var statusCode = response.getResponseCode();
  var data = parseJsonText(response.getContentText());
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error((data.error && data.error.description) || 'Unable to create Razorpay order.');
  }

  return {
    success: true,
    orderId: data.id,
    amount: data.amount,
    currency: data.currency || 'INR',
    receipt: data.receipt || receipt,
    planName: planName
  };
}

function verifyRazorpayPayment(payload) {
  var session = requireSession(payload, false);
  if (normalizeStatus(session['Role']) === 'ADMIN') {
    throw new Error('Student session required.');
  }
  requireFields(payload, ['paymentId', 'orderId', 'signature']);
  var keySecret = getScriptProperty('RAZORPAY_KEY_SECRET');
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured in Apps Script Properties.');
  }

  var expectedSignature = hmacSha256Hex(payload.orderId + '|' + payload.paymentId, keySecret);
  if (normalizeComparable(expectedSignature) !== normalizeComparable(payload.signature)) {
    throw new Error('Payment signature verification failed.');
  }

  var user = findUser({ userId: session['User ID'] });
  var existing = getSheetData(SHEET_NAMES.PAYMENTS).filter(function(payment) {
    return normalizeComparable(payment['Transaction ID']) === normalizeComparable(payload.paymentId);
  })[0];

  if (!existing) {
    addPayment({
      userId: user['User ID'],
      name: user['Name'],
      amount: Math.round(Number(payload.amount || 29900) / 100),
      plan: cleanText(payload.planName || 'AJB Premium'),
      paymentMethod: 'Razorpay',
      transactionId: payload.paymentId,
      status: 'CAPTURED'
    });
  } else {
    updateSheetRow(SHEET_NAMES.USERS, user._rowNumber, {
      'Subscription Status': 'ACTIVE'
    });
  }

  return {
    success: true,
    message: 'Payment verified.',
    subscriptionStatus: 'ACTIVE',
    isSubscribed: true
  };
}

function getDashboardStatsForAdmin() {
  var users = getSheetData(SHEET_NAMES.USERS);
  var payments = getSheetData(SHEET_NAMES.PAYMENTS).map(paymentToFrontend);
  var successful = payments.filter(function(payment) {
    return SUCCESSFUL_PAYMENT_STATUSES.indexOf(normalizeStatus(payment.status)) !== -1;
  });
  var paidUsers = {};
  successful.forEach(function(payment) {
    paidUsers[cleanText(payment.userId)] = true;
  });
  return {
    success: true,
    totalStudents: users.filter(function(user) { return normalizeStatus(user['Role'] || 'STUDENT') !== 'ADMIN'; }).length,
    activeStudents: Object.keys(paidUsers).length,
    totalPaidUsers: Object.keys(paidUsers).length,
    totalRevenue: successful.reduce(function(sum, payment) { return sum + Number(payment.amount || 0); }, 0),
    totalVideos: getSheetData(SHEET_NAMES.VIDEOS).filter(isActiveRecord).length
  };
}

function getAllStudentsForAdmin() {
  var students = getSheetData(SHEET_NAMES.USERS).map(function(user) {
    var item = userToFrontend(user);
    item.status = item.subscriptionStatus;
    item.joinDate = user['Registration Date'];
    return item;
  });
  return dataResponse('students', students);
}

function getAllPaymentsForAdmin(payload) {
  var payments = getSheetData(SHEET_NAMES.PAYMENTS)
    .map(paymentToFrontend)
    .filter(function(payment) {
      if (payload.status && normalizeComparable(payment.status) !== normalizeComparable(payload.status)) return false;
      if (payload.date && cleanText(payment.date).slice(0, 10) !== cleanText(payload.date)) return false;
      return true;
    });
  var successful = payments.filter(function(payment) {
    return SUCCESSFUL_PAYMENT_STATUSES.indexOf(normalizeStatus(payment.status)) !== -1;
  });
  return {
    success: true,
    payments: payments,
    data: payments,
    count: payments.length,
    totalRevenue: successful.reduce(function(sum, payment) { return sum + Number(payment.amount || 0); }, 0),
    totalPaidUsers: Object.keys(successful.reduce(function(map, payment) {
      map[cleanText(payment.userId)] = true;
      return map;
    }, {})).length
  };
}

function getContentRecords() {
  return getSheetData(SHEET_NAMES.VIDEOS)
    .concat(getSheetData(SHEET_NAMES.MCQ))
    .concat(getSheetData(SHEET_NAMES.BOOKS))
    .concat(getSheetData(SHEET_NAMES.NOTES));
}

function collectDistinctFrontendItems(records, payload, config) {
  var map = {};
  records
    .filter(isActiveRecord)
    .filter(function(record) { return recordMatchesScope(record, payload, config.scope || []); })
    .forEach(function(record) {
      var id = getRecordValue(record, config.idKeys);
      var name = getRecordValue(record, config.nameKeys) || id;
      if (!id || !name) return;
      var key = normalizeComparable(id);
      if (!map[key]) {
        map[key] = {
          id: id,
          name: name,
          mediumId: getRecordValue(record, ['MEDIUM_ID', 'Medium ID', 'Medium']),
          classId: getRecordValue(record, ['CLASS_ID', 'Class ID', 'Class']),
          subjectId: getRecordValue(record, ['SUBJECT_ID', 'Subject ID', 'Subject']),
          description: getRecordValue(record, config.descriptionKeys || ['DESCRIPTION', 'Description']),
          sortOrder: normalizeNumber(getRecordValue(record, ['SORT_ORDER', 'Sort Order']), 9999)
        };
      }
    });
  return Object.keys(map).map(function(key) {
    return map[key];
  }).sort(sortBySortOrderThenName);
}

function recordMatchesScope(record, payload, scope) {
  payload = payload || {};
  var comparisons = {
    medium: {
      expected: payload.mediumId || payload.medium,
      actual: getRecordValue(record, ['MEDIUM_ID', 'Medium ID', 'Medium'])
    },
    class: {
      expected: payload.classId || payload.className || payload.class,
      actual: getRecordValue(record, ['CLASS_ID', 'Class ID', 'Class'])
    },
    subject: {
      expected: payload.subjectId || payload.subject,
      actual: getRecordValue(record, ['SUBJECT_ID', 'Subject ID', 'Subject'])
    },
    chapter: {
      expected: payload.chapterId || payload.chapter,
      actual: getRecordValue(record, ['CHAPTER_ID', 'Chapter ID', 'Chapter'])
    }
  };

  return (scope || []).every(function(name) {
    var comparison = comparisons[name];
    if (!comparison || !cleanText(comparison.expected)) return true;
    if (!cleanText(comparison.actual)) return false;
    return normalizeComparable(comparison.actual) === normalizeComparable(comparison.expected);
  });
}

function getRecordValue(record, keys) {
  for (var i = 0; i < (keys || []).length; i++) {
    var key = keys[i];
    if (record[key] !== undefined && record[key] !== null && cleanText(record[key]) !== '') {
      return cleanText(record[key]);
    }
  }
  return '';
}

function isActiveRecord(record) {
  var status = getRecordValue(record, ['STATUS', 'Status']);
  return !status || normalizeStatus(status) === 'ACTIVE';
}

function sortBySortOrderThenName(a, b) {
  var orderA = normalizeNumber(a.sortOrder, 9999);
  var orderB = normalizeNumber(b.sortOrder, 9999);
  if (orderA !== orderB) return orderA - orderB;
  return cleanText(a.name || a.title).localeCompare(cleanText(b.name || b.title));
}

function videoToFrontend(record) {
  var duration = normalizeNumber(getRecordValue(record, ['DURATION_SECONDS', 'Duration Seconds', 'Duration']), 0);
  var durationSeconds = duration && duration < 1000 ? duration * 60 : duration;
  var chapterId = getRecordValue(record, ['CHAPTER_ID', 'Chapter ID', 'Chapter']);
  return {
    id: getRecordValue(record, ['VIDEO_ID', 'Video ID']) || ('VIDEO_ROW_' + record._rowNumber),
    title: getRecordValue(record, ['TITLE', 'Video Title', 'Title']),
    description: getRecordValue(record, ['DESCRIPTION', 'Description']),
    mediumId: getRecordValue(record, ['MEDIUM_ID', 'Medium ID', 'Medium']),
    classId: getRecordValue(record, ['CLASS_ID', 'Class ID', 'Class']),
    subjectId: getRecordValue(record, ['SUBJECT_ID', 'Subject ID', 'Subject']),
    chapterId: chapterId,
    chapterName: getRecordValue(record, ['CHAPTER_NAME', 'Chapter Name']) || chapterId,
    videoLink: getRecordValue(record, ['YOUTUBE_LINK', 'YouTube Link', 'YouTube/Drive URL', 'Video Link']),
    thumbnail: getRecordValue(record, ['THUMBNAIL', 'Thumbnail']),
    durationSeconds: durationSeconds,
    sortOrder: normalizeNumber(getRecordValue(record, ['SORT_ORDER', 'Sort Order']), 9999)
  };
}

function ebookToFrontend(record, source) {
  var idPrefix = source === 'notes' ? 'NOTE' : 'BOOK';
  var title = getRecordValue(record, ['TITLE', 'Book Name', 'Note Title', 'Title']);
  return {
    id: getRecordValue(record, ['BOOK_ID', 'Book ID', 'NOTE_ID', 'Note ID']) || (idPrefix + '_ROW_' + record._rowNumber),
    title: title,
    description: getRecordValue(record, ['DESCRIPTION', 'Description']),
    mediumId: getRecordValue(record, ['MEDIUM_ID', 'Medium ID', 'Medium']),
    classId: getRecordValue(record, ['CLASS_ID', 'Class ID', 'Class']),
    subjectId: getRecordValue(record, ['SUBJECT_ID', 'Subject ID', 'Subject']),
    chapterId: getRecordValue(record, ['CHAPTER_ID', 'Chapter ID', 'Chapter']),
    pdfLink: getRecordValue(record, ['PDF_LINK', 'PDF Link']),
    thumbnail: getRecordValue(record, ['THUMBNAIL', 'Thumbnail']),
    sortOrder: normalizeNumber(getRecordValue(record, ['SORT_ORDER', 'Sort Order']), 9999)
  };
}

function getMCQRecordsForPayload(payload) {
  return getSheetData(SHEET_NAMES.MCQ)
    .filter(function(record) { return recordMatchesScope(record, payload, ['medium', 'class', 'subject', 'chapter']); })
    .filter(function(record) {
      var quizTitle = cleanText(payload.quizTitle);
      var recordTitle = getRecordValue(record, ['QUIZ_TITLE', 'Quiz Title']);
      return !quizTitle || !recordTitle || normalizeComparable(recordTitle) === normalizeComparable(quizTitle);
    })
    .filter(isActiveRecord)
    .sort(function(a, b) {
      return sortBySortOrderThenName(
        { sortOrder: getRecordValue(a, ['SORT_ORDER', 'Sort Order']), name: getRecordValue(a, ['QUESTION', 'Question']) },
        { sortOrder: getRecordValue(b, ['SORT_ORDER', 'Sort Order']), name: getRecordValue(b, ['QUESTION', 'Question']) }
      );
    });
}

function mcqToFrontend(record, includeAnswer) {
  var item = {
    id: getRecordValue(record, ['MCQ_ID', 'MCQ ID', 'Quiz ID']) || ('MCQ_ROW_' + record._rowNumber),
    quizTitle: getRecordValue(record, ['QUIZ_TITLE', 'Quiz Title']) || 'Chapter Quiz',
    question: getRecordValue(record, ['QUESTION', 'Question']),
    options: [
      getRecordValue(record, ['OPTION_A', 'Option A']),
      getRecordValue(record, ['OPTION_B', 'Option B']),
      getRecordValue(record, ['OPTION_C', 'Option C']),
      getRecordValue(record, ['OPTION_D', 'Option D'])
    ],
    optionA: getRecordValue(record, ['OPTION_A', 'Option A']),
    optionB: getRecordValue(record, ['OPTION_B', 'Option B']),
    optionC: getRecordValue(record, ['OPTION_C', 'Option C']),
    optionD: getRecordValue(record, ['OPTION_D', 'Option D']),
    timeSeconds: normalizeNumber(getRecordValue(record, ['TIME_SECONDS', 'Time Seconds']), 60),
    mediumId: getRecordValue(record, ['MEDIUM_ID', 'Medium ID', 'Medium']),
    classId: getRecordValue(record, ['CLASS_ID', 'Class ID', 'Class']),
    subjectId: getRecordValue(record, ['SUBJECT_ID', 'Subject ID', 'Subject']),
    chapterId: getRecordValue(record, ['CHAPTER_ID', 'Chapter ID', 'Chapter'])
  };
  if (includeAnswer) {
    item.answer = normalizeAnswer(getRecordValue(record, ['CORRECT_ANSWER', 'Correct Answer']));
    item.correctAnswer = item.answer;
    item.explanation = getRecordValue(record, ['EXPLANATION', 'Explanation']);
  }
  return item;
}

function findProgressRecord(userId, videoId) {
  var records = getSheetData(SHEET_NAMES.PROGRESS);
  for (var i = 0; i < records.length; i++) {
    if (
      cleanText(records[i]['User ID']) === cleanText(userId) &&
      cleanText(records[i]['Video ID']) === cleanText(videoId)
    ) {
      return records[i];
    }
  }
  return null;
}

function upsertProgressRecord(userId, videoId, record) {
  var existing = findProgressRecord(userId, videoId);
  if (existing) {
    updateSheetRow(SHEET_NAMES.PROGRESS, existing._rowNumber, record);
  } else {
    appendRow(SHEET_NAMES.PROGRESS, record);
  }
}

function progressToFrontend(record) {
  return {
    userId: record['User ID'],
    videoId: record['Video ID'],
    chapterId: record['Chapter ID'] || record['Chapter'],
    chapter: record['Chapter'] || record['Chapter ID'],
    completed: normalizeYesNo(record['Completed (Yes/No)']) === 'YES',
    quizScore: record['Quiz Score'] || '',
    completionPercentage: Number(record['Completion Percentage'] || record['Watched Percentage'] || 0),
    watchedPercentage: Number(record['Watched Percentage'] || record['Completion Percentage'] || 0),
    positionSeconds: Number(record['Position Seconds'] || 0),
    durationSeconds: Number(record['Duration Seconds'] || 0),
    completedAt: record['Completed At'] || '',
    lastUpdated: record['Last Updated'] || ''
  };
}

function isCompletedChapterProgress(record) {
  var videoId = cleanText(record['Video ID']);
  var hasChapter = cleanText(record['Chapter ID'] || record['Chapter']);
  return hasChapter && (
    videoId.indexOf('CHAPTER_') === 0 ||
    normalizeYesNo(record['Completed (Yes/No)']) === 'YES'
  );
}

function parseQuizScore(value) {
  var text = cleanText(value);
  var match = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) {
    var percentageOnly = normalizeNumber(text, 0);
    return { correct: 0, total: 0, percentage: percentageOnly };
  }
  var correct = Number(match[1]);
  var total = Number(match[2]);
  return {
    correct: correct,
    total: total,
    percentage: total ? Math.round((correct / total) * 100) : 0
  };
}

function indexUsersById() {
  var map = {};
  getSheetData(SHEET_NAMES.USERS).forEach(function(user) {
    map[cleanText(user['User ID'])] = user;
  });
  return map;
}

function paymentToFrontend(payment) {
  var usersById = indexUsersById();
  var user = usersById[cleanText(payment['User ID'])] || {};
  return {
    id: payment['Payment ID'],
    paymentId: payment['Payment ID'],
    userId: payment['User ID'],
    name: payment['Name'] || user['Name'] || '',
    studentName: payment['Name'] || user['Name'] || '',
    email: user['Email'] || '',
    mobile: user['Phone'] || '',
    amount: Number(payment['Amount'] || 0),
    plan: payment['Plan'],
    paymentMethod: payment['Payment Method'],
    transactionId: payment['Transaction ID'],
    razorpayPaymentId: payment['Transaction ID'],
    razorpayOrderId: '',
    status: payment['Status'],
    paymentStatus: payment['Status'],
    date: payment['Date'],
    paymentDate: payment['Date']
  };
}

function parseJsonText(text) {
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return {};
  }
}

function hmacSha256Hex(value, secret) {
  var bytes = Utilities.computeHmacSha256Signature(cleanText(value), cleanText(secret));
  return bytes.map(function(byte) {
    var unsigned = byte < 0 ? byte + 256 : byte;
    return ('0' + unsigned.toString(16)).slice(-2);
  }).join('');
}

function updateLastLogin(payload) {
  var user = findUser(payload);
  if (!user) {
    throw new Error('User not found.');
  }

  var lastLogin = new Date().toISOString();
  updateSheetRow(SHEET_NAMES.USERS, user._rowNumber, {
    'Last Login': lastLogin
  });

  return {
    success: true,
    message: 'Last login updated.',
    lastLogin: lastLogin
  };
}

/**
 * Verifies subscription from USERS and successful PAYMENTS records.
 */
function checkSubscription(params) {
  var user = findUser(params);
  if (!user) {
    throw new Error('User not found.');
  }

  var userId = String(user['User ID']);
  var userStatus = normalizeStatus(user['Subscription Status']);
  var successfulPayment = getSheetData(SHEET_NAMES.PAYMENTS)
    .filter(function(payment) {
      return String(payment['User ID']) === userId &&
        SUCCESSFUL_PAYMENT_STATUSES.indexOf(normalizeStatus(payment['Status'])) !== -1;
    })
    .sort(function(a, b) {
      return new Date(b['Date'] || 0).getTime() - new Date(a['Date'] || 0).getTime();
    })[0];

  var isSubscribed = userStatus === 'ACTIVE' || Boolean(successfulPayment);

  return {
    success: true,
    userId: userId,
    isSubscribed: isSubscribed,
    subscriptionStatus: isSubscribed ? 'ACTIVE' : 'INACTIVE',
    payment: successfulPayment ? publicPayment(successfulPayment) : null
  };
}

/**
 * Upserts progress for a user/video pair.
 */
function addProgress(payload) {
  requireFields(payload, ['userId', 'videoId']);

  var completed = normalizeYesNo(payload.completed);
  var percentage = clampNumber(payload.completionPercentage, 0, 100, completed === 'YES' ? 100 : 0);
  var values = {
    'User ID': cleanText(payload.userId),
    'Video ID': cleanText(payload.videoId),
    'Chapter': cleanText(payload.chapter || ''),
    'Completed (Yes/No)': completed,
    'Quiz Score': normalizeNumber(payload.quizScore, ''),
    'Completion Percentage': percentage,
    'Last Updated': new Date().toISOString()
  };

  var existing = getSheetData(SHEET_NAMES.PROGRESS).filter(function(record) {
    return String(record['User ID']) === String(values['User ID']) &&
      String(record['Video ID']) === String(values['Video ID']);
  })[0];

  if (existing) {
    updateSheetRow(SHEET_NAMES.PROGRESS, existing._rowNumber, values);
  } else {
    appendRow(SHEET_NAMES.PROGRESS, values);
  }

  return {
    success: true,
    message: existing ? 'Progress updated.' : 'Progress added.',
    progress: values
  };
}

/**
 * Calculates a quiz score from MCQ sheet answers and stores it in PROGRESS.
 *
 * answers format:
 * [{ "mcqId": "MCQ_1", "answer": "B" }]
 */
function submitQuizScore(payload) {
  requireFields(payload, ['userId', 'answers']);

  if (!Array.isArray(payload.answers) || !payload.answers.length) {
    throw new Error('answers must be a non-empty array.');
  }

  var answerMap = {};
  payload.answers.forEach(function(answer) {
    answerMap[String(answer.mcqId)] = normalizeAnswer(answer.answer);
  });

  var questions = filterData(getSheetData(SHEET_NAMES.MCQ), contentFilters({
    medium: payload.medium,
    class: payload.class,
    subject: payload.subject,
    chapter: payload.chapter
  }));

  if (!questions.length) {
    throw new Error('No MCQ questions found for the supplied filters.');
  }

  var correct = 0;
  var results = questions.map(function(question) {
    var submitted = answerMap[String(question['MCQ ID'])] || '';
    var expected = normalizeAnswer(question['Correct Answer']);
    var isCorrect = submitted === expected;
    if (isCorrect) {
      correct++;
    }

    return {
      mcqId: question['MCQ ID'],
      submittedAnswer: submitted,
      correctAnswer: expected,
      isCorrect: isCorrect,
      explanation: question['Explanation']
    };
  });

  var total = questions.length;
  var percentage = Math.round((correct / total) * 100);
  var videoId = cleanText(payload.videoId || ('QUIZ_' + (payload.chapter || 'GENERAL')));

  var progressResult = addProgress({
    userId: payload.userId,
    videoId: videoId,
    chapter: payload.chapter || '',
    completed: 'Yes',
    quizScore: correct + '/' + total,
    completionPercentage: percentage
  });

  return {
    success: true,
    message: 'Quiz score saved.',
    score: correct,
    total: total,
    percentage: percentage,
    correctAnswers: correct,
    wrongAnswers: total - correct,
    results: results,
    progress: progressResult.progress
  };
}

function addPayment(payload) {
  requireFields(payload, [
    'userId',
    'name',
    'amount',
    'plan',
    'paymentMethod',
    'transactionId',
    'status'
  ]);

  var duplicate = getSheetData(SHEET_NAMES.PAYMENTS).some(function(payment) {
    return normalizeComparable(payment['Transaction ID']) ===
      normalizeComparable(payload.transactionId);
  });

  if (duplicate) {
    throw new Error('This transaction has already been recorded.');
  }

  var paymentId = cleanText(payload.paymentId || generateId('PAY'));
  var status = normalizeStatus(payload.status);
  var payment = {
    'Payment ID': paymentId,
    'User ID': cleanText(payload.userId),
    'Name': cleanText(payload.name),
    'Amount': normalizeNumber(payload.amount, 0),
    'Plan': cleanText(payload.plan),
    'Payment Method': cleanText(payload.paymentMethod),
    'Transaction ID': cleanText(payload.transactionId),
    'Status': status,
    'Date': cleanText(payload.date || new Date().toISOString())
  };

  appendRow(SHEET_NAMES.PAYMENTS, payment);

  if (SUCCESSFUL_PAYMENT_STATUSES.indexOf(status) !== -1) {
    var user = findRecord(SHEET_NAMES.USERS, 'User ID', payload.userId);
    if (user) {
      updateSheetRow(SHEET_NAMES.USERS, user._rowNumber, {
        'Subscription Status': 'ACTIVE'
      });
    }
  }

  return {
    success: true,
    message: 'Payment recorded.',
    payment: payment
  };
}

function askQuestion(payload) {
  requireFields(payload, [
    'userId',
    'userName',
    'medium',
    'class',
    'subject',
    'chapter',
    'question'
  ]);

  var question = {
    'Question ID': generateId('QUESTION'),
    'User ID': cleanText(payload.userId),
    'User Name': cleanText(payload.userName),
    'Medium': cleanText(payload.medium),
    'Class': cleanText(payload.class),
    'Subject': cleanText(payload.subject),
    'Chapter': cleanText(payload.chapter),
    'Question': cleanText(payload.question),
    'Answer': '',
    'Answered By': '',
    'Date': new Date().toISOString()
  };

  appendRow(SHEET_NAMES.QA, question);

  return {
    success: true,
    message: 'Question submitted.',
    question: question
  };
}

/**
 * Optional API action for an admin UI.
 * Admins may also update Answer and Answered By directly in the Q&A sheet.
 */
function updateAnswer(payload) {
  requireFields(payload, ['questionId', 'answer', 'answeredBy']);

  var question = findRecord(
    SHEET_NAMES.QA,
    'Question ID',
    payload.questionId
  );

  if (!question) {
    throw new Error('Question not found.');
  }

  updateSheetRow(SHEET_NAMES.QA, question._rowNumber, {
    'Answer': cleanText(payload.answer),
    'Answered By': cleanText(payload.answeredBy)
  });

  return {
    success: true,
    message: 'Answer updated.',
    questionId: payload.questionId
  };
}

function getUsers(params) {
  var users = applyStandardFilters(getSheetData(SHEET_NAMES.USERS), params)
    .map(publicUser);
  return dataResponse('users', users);
}

function getVideos(params) {
  var data = filterData(getSheetData(SHEET_NAMES.VIDEOS), contentFilters(params));
  return dataResponse('videos', stripMetadata(data));
}

function getMCQ(params) {
  var data = filterData(getSheetData(SHEET_NAMES.MCQ), contentFilters(params));
  var includeAnswers = isAdminAuthorized(params);
  var publicData = stripMetadata(data).map(function(question) {
    if (includeAnswers) {
      return question;
    }
    var safeQuestion = {};
    Object.keys(question).forEach(function(key) {
      if (key !== 'Correct Answer' && key !== 'Explanation') {
        safeQuestion[key] = question[key];
      }
    });
    return safeQuestion;
  });
  return dataResponse('mcq', publicData);
}

function getBooks(params) {
  var filters = {
    'Medium': params.medium,
    'Class': params.class,
    'Subject': params.subject
  };
  var data = filterData(getSheetData(SHEET_NAMES.BOOKS), filters);
  return dataResponse('books', stripMetadata(data));
}

function getNotes(params) {
  var data = filterData(getSheetData(SHEET_NAMES.NOTES), contentFilters(params));
  return dataResponse('notes', stripMetadata(data));
}

function getProgress(params) {
  var filters = {
    'User ID': params.userId,
    'Video ID': params.videoId,
    'Chapter': params.chapter,
    'Completed (Yes/No)': params.completed
  };
  var data = filterData(getSheetData(SHEET_NAMES.PROGRESS), filters);
  return dataResponse('progress', stripMetadata(data));
}

function getPayments(params) {
  var filters = {
    'User ID': params.userId,
    'Payment ID': params.paymentId,
    'Transaction ID': params.transactionId,
    'Status': params.status
  };
  var data = filterData(getSheetData(SHEET_NAMES.PAYMENTS), filters)
    .map(publicPayment);
  return dataResponse('payments', data);
}

function getQA(params) {
  var filters = {
    'Question ID': params.questionId,
    'User ID': params.userId,
    'Medium': params.medium,
    'Class': params.class,
    'Subject': params.subject,
    'Chapter': params.chapter
  };
  var data = filterData(getSheetData(SHEET_NAMES.QA), filters);

  if (normalizeYesNo(params.answered) === 'YES') {
    data = data.filter(function(record) {
      return String(record['Answer'] || '').trim() !== '';
    });
  }

  return dataResponse('qa', stripMetadata(data));
}

function filterContent(params) {
  return {
    success: true,
    filters: {
      medium: params.medium || '',
      class: params.class || '',
      subject: params.subject || '',
      chapter: params.chapter || ''
    },
    videos: getVideos(params).data,
    mcq: getMCQ(params).data,
    books: getBooks(params).data,
    notes: getNotes(params).data
  };
}

function dataResponse(resource, data) {
  var response = {
    success: true,
    count: data.length,
    data: data
  };
  response[resource] = data;
  return response;
}

function contentFilters(params) {
  return {
    'Medium': params.medium,
    'Class': params.class,
    'Subject': params.subject,
    'Chapter': params.chapter
  };
}

function applyStandardFilters(data, params) {
  return filterData(data, {
    'User ID': params.userId,
    'Email': params.email,
    'Medium': params.medium,
    'Class': params.class,
    'Subscription Status': params.subscriptionStatus
  });
}

function appendRow(sheetName, record) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  var lastColumn = sheet.getLastColumn();
  var headers = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    : HEADERS[sheetName];
  var row = headers.map(function(header) {
    return record[header] !== undefined ? record[header] : '';
  });
  sheet.appendRow(row);
  SpreadsheetApp.flush();
}

function updateSheetRow(sheetName, rowNumber, updates) {
  var sheet = getSpreadsheet().getSheetByName(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];

  headers.forEach(function(header, index) {
    if (updates[header] !== undefined) {
      row[index] = updates[header];
    }
  });

  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
  SpreadsheetApp.flush();
}

function findRecord(sheetName, field, expected, normalizer) {
  var normalize = normalizer || normalizeComparable;
  var normalizedExpected = normalize(expected);
  var records = getSheetData(sheetName);

  for (var i = 0; i < records.length; i++) {
    if (normalize(records[i][field]) === normalizedExpected) {
      return records[i];
    }
  }
  return null;
}

function findUser(params) {
  if (params.userId) {
    return findRecord(SHEET_NAMES.USERS, 'User ID', params.userId);
  }
  if (params.email) {
    return findRecord(
      SHEET_NAMES.USERS,
      'Email',
      params.email,
      function(value) { return normalizeEmail(value); }
    );
  }
  throw new Error('userId or email is required.');
}

function findUserByIdentifier(identifier) {
  var value = cleanText(identifier);
  var normalizedEmail = normalizeEmail(value);
  var normalizedPhone = normalizePhone(value);
  var normalizedId = normalizeComparable(value);
  var users = getSheetData(SHEET_NAMES.USERS);

  for (var i = 0; i < users.length; i++) {
    if (
      normalizeEmail(users[i]['Email']) === normalizedEmail ||
      (normalizedPhone && normalizePhone(users[i]['Phone']) === normalizedPhone) ||
      normalizeComparable(users[i]['User ID']) === normalizedId
    ) {
      return users[i];
    }
  }
  return null;
}

function findUserByResetIdentifier(identifier, channel) {
  var users = getSheetData(SHEET_NAMES.USERS);
  var expected = channel === 'EMAIL'
    ? normalizeEmail(identifier)
    : normalizePhone(identifier);
  for (var i = 0; i < users.length; i++) {
    var actual = channel === 'EMAIL'
      ? normalizeEmail(users[i]['Email'])
      : normalizePhone(users[i]['Phone']);
    if (actual && actual === expected) {
      return users[i];
    }
  }
  return null;
}

function userToFrontend(user, overrides) {
  if (!user) {
    throw new Error('User not found.');
  }
  var subscriptionStatus = normalizeStatus(
    (overrides && overrides.subscriptionStatus) ||
    user['Subscription Status'] ||
    'INACTIVE'
  );
  var role = normalizeStatus(user['Role'] || 'STUDENT');
  return {
    id: user['User ID'],
    userId: user['User ID'],
    name: user['Name'],
    email: user['Email'],
    phone: user['Phone'],
    mobile: user['Phone'],
    medium: user['Medium'],
    mediumId: user['Medium'],
    class: user['Class'],
    classId: user['Class'],
    profileImage: user['Profile Image'] || '',
    subscriptionStatus: subscriptionStatus,
    isSubscribed: subscriptionStatus === 'ACTIVE',
    accountStatus: normalizeStatus(user['Account Status'] || 'ACTIVE'),
    role: role,
    isAdmin: role === 'ADMIN',
    lastLogin: (overrides && overrides.lastLogin) || user['Last Login'] || ''
  };
}

function publicUser(user) {
  return {
    'User ID': user['User ID'],
    'Name': user['Name'],
    'Email': user['Email'],
    'Phone': user['Phone'],
    'Medium': user['Medium'],
    'Class': user['Class'],
    'Subscription Status': user['Subscription Status'],
    'Registration Date': user['Registration Date'],
    'Last Login': user['Last Login']
  };
}

function publicPayment(payment) {
  return {
    'Payment ID': payment['Payment ID'],
    'User ID': payment['User ID'],
    'Name': payment['Name'],
    'Amount': payment['Amount'],
    'Plan': payment['Plan'],
    'Payment Method': payment['Payment Method'],
    'Transaction ID': payment['Transaction ID'],
    'Status': payment['Status'],
    'Date': payment['Date']
  };
}

function stripMetadata(records) {
  return records.map(function(record) {
    var clean = {};
    Object.keys(record).forEach(function(key) {
      if (key !== '_rowNumber') {
        clean[key] = record[key];
      }
    });
    return clean;
  });
}

function parsePostBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('POST request body is required.');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('POST body must contain valid JSON.');
  }
}

function normalizeRequestParameters(params) {
  var normalized = {};
  Object.keys(params || {}).forEach(function(key) {
    normalized[key] = params[key];
  });
  normalized.action = String(normalized.action || '').trim();
  return normalized;
}

function requireAdmin(params) {
  var adminApiKey = getScriptProperty('ADMIN_API_KEY');
  if (!adminApiKey) {
    throw new Error('ADMIN_API_KEY must be configured before using admin endpoints.');
  }
  if (String(params.adminKey || '') !== String(adminApiKey)) {
    throw new Error('Unauthorized admin request.');
  }
}

function isAdminAuthorized(params) {
  var adminApiKey = getScriptProperty('ADMIN_API_KEY');
  return Boolean(
    adminApiKey &&
    String((params && params.adminKey) || '') === String(adminApiKey)
  );
}

function requireFields(payload, fields) {
  var missing = fields.filter(function(field) {
    var value = payload[field];
    return value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);
  });

  if (missing.length) {
    throw new Error('Missing required fields: ' + missing.join(', '));
  }
}

function serializeValue(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  return value;
}

function cleanText(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

function getScriptProperty(name, fallback) {
  var value = PropertiesService.getScriptProperties().getProperty(name);
  return value === null || value === undefined || value === ''
    ? cleanText(fallback)
    : cleanText(value);
}

function normalizeComparable(value) {
  return cleanText(value).toLowerCase();
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value) {
  var digits = cleanText(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.indexOf('91') === 0) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.charAt(0) === '0') {
    return digits.slice(1);
  }
  return digits;
}

function normalizeStatus(value) {
  return cleanText(value).toUpperCase();
}

function normalizeAnswer(value) {
  var normalized = cleanText(value).toUpperCase();
  var match = normalized.match(/[ABCD]/);
  return match ? match[0] : normalized;
}

function normalizeYesNo(value) {
  var normalized = normalizeStatus(value);
  return ['YES', 'TRUE', '1', 'COMPLETED'].indexOf(normalized) !== -1 ? 'YES' : 'NO';
}

function normalizeNumber(value, fallback) {
  if (value === '' || value === undefined || value === null) {
    return fallback;
  }
  var number = Number(value);
  return isNaN(number) ? fallback : number;
}

function clampNumber(value, minimum, maximum, fallback) {
  var number = normalizeNumber(value, fallback);
  return Math.max(minimum, Math.min(maximum, Number(number)));
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(email))) {
    throw new Error('Enter a valid email address.');
  }
}

function validatePhone(phone) {
  if (!/^\d{10}$/.test(normalizePhone(phone))) {
    throw new Error('Enter a valid 10-digit phone number.');
  }
}

function validateNewPassword(password) {
  var value = String(password || '');
  if (value.length < 8 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new Error('Password must be at least 8 characters and include a letter and number.');
  }
}

function collectDistinctContentValues(field, medium) {
  var sheetNames = [
    SHEET_NAMES.USERS,
    SHEET_NAMES.VIDEOS,
    SHEET_NAMES.MCQ,
    SHEET_NAMES.BOOKS,
    SHEET_NAMES.NOTES
  ];
  var values = {};
  var expectedMedium = normalizeComparable(medium);

  sheetNames.forEach(function(sheetName) {
    getSheetData(sheetName).forEach(function(record) {
      if (
        expectedMedium &&
        record['Medium'] &&
        normalizeComparable(record['Medium']) !== expectedMedium
      ) {
        return;
      }
      var value = cleanText(record[field]);
      if (value) {
        values[normalizeComparable(value)] = value;
      }
    });
  });

  return Object.keys(values).map(function(key) {
    return values[key];
  }).sort();
}

function generateOtp() {
  var seed = sha256(Utilities.getUuid() + '|' + Date.now() + '|' + Math.random());
  var number = parseInt(seed.slice(0, 8), 16) % 1000000;
  return ('000000' + number).slice(-6);
}

function getResetPepper() {
  var properties = PropertiesService.getScriptProperties();
  var pepper = properties.getProperty('RESET_OTP_PEPPER');
  if (!pepper) {
    pepper = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty('RESET_OTP_PEPPER', pepper);
  }
  return pepper;
}

function hashResetOtp(requestId, otp) {
  return sha256(
    getResetPepper() + '|' + cleanText(requestId) + '|' + cleanText(otp)
  );
}

function enforceResetRateLimit(userId) {
  var windowStart = Date.now() - 15 * 60 * 1000;
  var recent = getSheetData(SHEET_NAMES.PASSWORD_RESETS).filter(function(record) {
    return String(record['User ID']) === String(userId) &&
      new Date(record['Created At']).getTime() >= windowStart;
  });
  if (recent.length >= 3) {
    throw new Error('Too many OTP requests. Please wait 15 minutes and try again.');
  }
}

function invalidatePendingResetRequests(userId) {
  var now = new Date().toISOString();
  getSheetData(SHEET_NAMES.PASSWORD_RESETS).forEach(function(record) {
    if (String(record['User ID']) === String(userId) && !record['Used At']) {
      updateSheetRow(SHEET_NAMES.PASSWORD_RESETS, record._rowNumber, {
        'Used At': now
      });
    }
  });
}

function revokeUserSessions(userId, exceptRowNumber) {
  var now = new Date().toISOString();
  getSheetData(SHEET_NAMES.SESSIONS).forEach(function(session) {
    if (
      String(session['User ID']) === String(userId) &&
      !session['Revoked At'] &&
      Number(session._rowNumber) !== Number(exceptRowNumber || 0)
    ) {
      updateSheetRow(SHEET_NAMES.SESSIONS, session._rowNumber, {
        'Revoked At': now
      });
    }
  });
}

function maskEmail(email) {
  var parts = cleanText(email).split('@');
  if (parts.length !== 2) {
    return '';
  }
  var name = parts[0];
  return name.slice(0, 2) + new Array(Math.max(3, name.length - 1)).join('*') +
    '@' + parts[1];
}

function maskPhone(phone) {
  var digits = normalizePhone(phone);
  return digits ? '******' + digits.slice(-4) : '';
}

function sendPasswordResetEmail(user, otp) {
  if (MailApp.getRemainingDailyQuota() < 1) {
    throw new Error('Email delivery quota is temporarily unavailable.');
  }

  var supportEmail = getScriptProperty('SUPPORT_EMAIL');
  var body = [
    'Hello ' + cleanText(user['Name'] || 'Student') + ',',
    '',
    'Your AJB LEARN password reset OTP is: ' + otp,
    '',
    'This OTP expires in 10 minutes and can be used only once.',
    'If you did not request this reset, you can ignore this email.'
  ].join('\n');
  var options = {
    name: 'AJB LEARN',
    htmlBody:
      '<p>Hello ' + escapeHtmlForEmail(user['Name'] || 'Student') + ',</p>' +
      '<p>Your AJB LEARN password reset OTP is:</p>' +
      '<p style="font-size:28px;font-weight:700;letter-spacing:6px">' +
      escapeHtmlForEmail(otp) + '</p>' +
      '<p>This OTP expires in 10 minutes and can be used only once.</p>' +
      '<p>If you did not request this reset, you can ignore this email.</p>'
  };
  if (supportEmail) {
    options.replyTo = supportEmail;
  }

  MailApp.sendEmail(
    user['Email'],
    'AJB LEARN password reset OTP',
    body,
    options
  );
}

function escapeHtmlForEmail(value) {
  return cleanText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toE164(phone) {
  var value = cleanText(phone);
  if (value.charAt(0) === '+') {
    return '+' + value.slice(1).replace(/\D/g, '');
  }
  var countryCode = getScriptProperty('DEFAULT_PHONE_COUNTRY_CODE', '+91');
  return countryCode.replace(/[^\d+]/g, '') + normalizePhone(value);
}

function twilioVerifyRequest(path, payload) {
  var accountSid = getScriptProperty('TWILIO_ACCOUNT_SID');
  var authToken = getScriptProperty('TWILIO_AUTH_TOKEN');
  var serviceSid = getScriptProperty('TWILIO_VERIFY_SERVICE_SID');
  if (!accountSid || !authToken || !serviceSid) {
    throw new Error('Phone OTP is not configured. Use email OTP or configure Twilio Verify.');
  }

  var response = UrlFetchApp.fetch(
    'https://verify.twilio.com/v2/Services/' +
      encodeURIComponent(serviceSid) + '/' + path,
    {
      method: 'post',
      headers: {
        Authorization: 'Basic ' + Utilities.base64Encode(accountSid + ':' + authToken)
      },
      payload: payload,
      muteHttpExceptions: true
    }
  );
  var statusCode = response.getResponseCode();
  var data;
  try {
    data = JSON.parse(response.getContentText() || '{}');
  } catch (error) {
    data = {};
  }
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(
      data.message || 'Unable to send or verify the phone OTP.'
    );
  }
  return data;
}

function startTwilioVerification(phone) {
  var result = twilioVerifyRequest('Verifications', {
    To: phone,
    Channel: 'sms'
  });
  if (result.status !== 'pending') {
    throw new Error('Unable to send the phone OTP.');
  }
}

function checkTwilioVerification(phone, otp) {
  var result = twilioVerifyRequest('VerificationCheck', {
    To: phone,
    Code: otp
  });
  return result.status === 'approved';
}

/**
 * Passwords are stored as sha256$<salt>$<hash> inside the required
 * Password column. This avoids storing plaintext credentials.
 */
function hashPassword(password) {
  var salt = generateId('SALT');
  return 'sha256$' + salt + '$' + sha256(salt + '|' + String(password));
}

function verifyPassword(password, storedValue) {
  var stored = String(storedValue || '');
  var parts = stored.split('$');

  if (parts.length === 3 && parts[0] === 'sha256') {
    return sha256(parts[1] + '|' + String(password)) === parts[2];
  }

  // Supports migration from an older plaintext sheet.
  return stored === String(password);
}

/**
 * Pure JavaScript SHA-256 implementation.
 * Uses no Apps Script service beyond SpreadsheetApp/ContentService.
 */
function sha256(input) {
  var maxWord = Math.pow(2, 32);
  var words = [];
  var ascii = unescape(encodeURIComponent(String(input)));
  var asciiBitLength = ascii.length * 8;
  var initialHash = sha256.h = sha256.h || [];
  var constants = sha256.k = sha256.k || [];
  var primeCounter = constants.length;
  var candidate = 2;

  function isPrime(number) {
    for (var factor = 2; factor * factor <= number; factor++) {
      if (number % factor === 0) return false;
    }
    return true;
  }

  function fractional(number) {
    return (number - Math.floor(number)) * maxWord | 0;
  }

  while (primeCounter < 64) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) initialHash[primeCounter] = fractional(Math.pow(candidate, 1 / 2));
      constants[primeCounter] = fractional(Math.pow(candidate, 1 / 3));
      primeCounter++;
    }
    candidate++;
  }

  ascii += '\x80';
  while (ascii.length % 64 !== 56) ascii += '\x00';

  for (var index = 0; index < ascii.length; index++) {
    var character = ascii.charCodeAt(index);
    words[index >> 2] |= character << ((3 - index) % 4) * 8;
  }

  words[words.length] = asciiBitLength / maxWord | 0;
  words[words.length] = asciiBitLength;

  var hash = initialHash.slice(0, 8);

  for (var blockStart = 0; blockStart < words.length;) {
    var workingWords = words.slice(blockStart, blockStart += 16);
    var oldHash = hash.slice(0);
    var workingHash = hash.slice(0, 8);

    for (var round = 0; round < 64; round++) {
      var w15 = workingWords[round - 15];
      var w2 = workingWords[round - 2];
      var a = workingHash[0];
      var e = workingHash[4];

      var word = workingWords[round] = round < 16
        ? workingWords[round]
        : (
          workingWords[round - 16] +
          ((rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))) +
          workingWords[round - 7] +
          ((rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)))
        ) | 0;

      var temp1 = (
        workingHash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & workingHash[5]) ^ ((~e) & workingHash[6])) +
        constants[round] +
        word
      ) | 0;
      var temp2 = (
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & workingHash[1]) ^ (a & workingHash[2]) ^ (workingHash[1] & workingHash[2]))
      ) | 0;

      workingHash = [(temp1 + temp2) | 0].concat(workingHash);
      workingHash[4] = (workingHash[4] + temp1) | 0;
      workingHash.pop();
    }

    for (var hashIndex = 0; hashIndex < 8; hashIndex++) {
      hash[hashIndex] = (workingHash[hashIndex] + oldHash[hashIndex]) | 0;
    }
  }

  var result = '';
  for (var hashWord = 0; hashWord < 8; hashWord++) {
    for (var byte = 3; byte >= 0; byte--) {
      var value = (hash[hashWord] >> (byte * 8)) & 255;
      result += (value < 16 ? '0' : '') + value.toString(16);
    }
  }
  return result;
}

function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}
