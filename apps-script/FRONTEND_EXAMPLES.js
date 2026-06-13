const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

async function apiGet(action, parameters = {}) {
  const url = new URL(APPS_SCRIPT_URL);
  url.search = new URLSearchParams({ action, ...parameters }).toString();

  const response = await fetch(url);
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function apiPost(action, payload = {}) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    // text/plain keeps this a CORS simple request and avoids preflight.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

// GET: filtered videos
apiGet('getVideos', {
  medium: 'English',
  class: '10',
  subject: 'Science',
  chapter: '1'
}).then(({ videos }) => console.log(videos));

// GET: filtered books
apiGet('getBooks', {
  medium: 'Assamese',
  class: '8',
  subject: 'Mathematics'
}).then(({ books }) => console.log(books));

// POST: register a student
apiPost('registerUser', {
  name: 'Student Name',
  email: 'student@gmail.com',
  phone: '9999999999',
  password: '123456',
  medium: 'English',
  class: '10'
}).then(console.log);

// POST: login
apiPost('loginUser', {
  email: 'student@gmail.com',
  password: '123456'
}).then(console.log);

// POST: mark a video complete
apiPost('addProgress', {
  userId: 'USER_ID_FROM_LOGIN',
  videoId: 'VIDEO_001',
  chapter: '1',
  completed: 'Yes',
  completionPercentage: 100
}).then(console.log);

// POST: submit MCQ answers and calculate the score on the server
apiPost('submitQuizScore', {
  userId: 'USER_ID_FROM_LOGIN',
  medium: 'English',
  class: '10',
  subject: 'Science',
  chapter: '1',
  answers: [
    { mcqId: 'MCQ_001', answer: 'B' },
    { mcqId: 'MCQ_002', answer: 'D' }
  ]
}).then(console.log);

// POST: ask a question
apiPost('askQuestion', {
  userId: 'USER_ID_FROM_LOGIN',
  userName: 'Student Name',
  medium: 'English',
  class: '10',
  subject: 'Science',
  chapter: '1',
  question: 'Why does this reaction release heat?'
}).then(console.log);

// POST: record a verified payment from a trusted admin/server flow
apiPost('addPayment', {
  adminKey: 'YOUR_ADMIN_API_KEY',
  userId: 'USER_ID_FROM_LOGIN',
  name: 'Student Name',
  amount: 299,
  plan: 'AJB Premium',
  paymentMethod: 'Razorpay',
  transactionId: 'pay_example123',
  status: 'CAPTURED'
}).then(console.log);

// POST: answer a question from an admin interface
apiPost('updateAnswer', {
  adminKey: 'YOUR_ADMIN_API_KEY',
  questionId: 'QUESTION_ID',
  answer: 'The reaction releases stored chemical energy as heat.',
  answeredBy: 'AJB Teacher'
}).then(console.log);
