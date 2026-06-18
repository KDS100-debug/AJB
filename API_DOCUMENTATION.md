# AJB LEARN - API Documentation

## Overview

All API endpoints are handled by Google Apps Script and use POST requests with JSON payloads. The API returns standardized JSON responses.

**Base URL:** `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent`

Replace `{DEPLOYMENT_ID}` with your actual Google Apps Script deployment ID.

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication Endpoints

### 1. Register User
**Endpoint:** `POST /api`  
**Action:** `registerUser`

**Request:**
```json
{
  "action": "registerUser",
  "name": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "USER1701234567"
}
```

**Validation:**
- Email must be unique
- Mobile must be 10 digits
- Password minimum 6 characters
- Name required

---

### 2. Login User
**Endpoint:** `POST /api`  
**Action:** `loginUser`

**Request:**
```json
{
  "action": "loginUser",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "USER1701234567",
    "name": "John Doe",
    "email": "john@example.com",
    "isSubscribed": true,
    "isAdmin": false
  },
  "sessionToken": "SESSION1701234567"
}
```

---

### 3. Admin Login
**Endpoint:** `POST /api`  
**Action:** `adminLogin`

**Request:**
```json
{
  "action": "adminLogin",
  "email": "admin@ajblearn.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "adminToken": "ADMIN1701234567",
  "isAdmin": true
}
```

---

### 4. Change Password
**Endpoint:** `POST /api`  
**Action:** `changePassword`

**Request:**
```json
{
  "action": "changePassword",
  "sessionToken": "SESSION_TOKEN_FROM_LOGIN",
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Password Reset OTP

**Request OTP**

```json
{
  "action": "requestPasswordReset",
  "identifier": "student@example.com",
  "channel": "email"
}
```

Use `channel: "phone"` with the registered 10-digit phone number for SMS.
The response returns an opaque `requestId`; it never returns the OTP.

**Reset Password**

```json
{
  "action": "resetPasswordWithOtp",
  "requestId": "RESET_...",
  "otp": "123456",
  "newPassword": "NewPassword123"
}
```

OTPs expire after 10 minutes and allow at most five attempts.

---

## Content Retrieval Endpoints

### 5. Get Classes
**Endpoint:** `POST /api`  
**Action:** `getClasses`

**Request:**
```json
{
  "action": "getClasses"
}
```

**Response:**
```json
{
  "success": true,
  "classes": [
    {
      "id": "CLASS1",
      "name": "Class 1",
      "medium": "english",
      "subjectCount": 10
    },
    {
      "id": "CLASS2",
      "name": "Class 2",
      "medium": "english",
      "subjectCount": 10
    }
  ]
}
```

---

### 6. Get Subjects
**Endpoint:** `POST /api`  
**Action:** `getSubjects`

**Request:**
```json
{
  "action": "getSubjects",
  "classId": "CLASS1"
}
```

**Response:**
```json
{
  "success": true,
  "subjects": [
    {
      "id": "SUBJECT1",
      "name": "English",
      "classId": "CLASS1"
    },
    {
      "id": "SUBJECT2",
      "name": "Mathematics",
      "classId": "CLASS1"
    }
  ]
}
```

---

### 7. Get Chapters
**Endpoint:** `POST /api`  
**Action:** `getChapters`

**Request:**
```json
{
  "action": "getChapters",
  "classId": "CLASS1",
  "subjectId": "SUBJECT2"
}
```

**Response:**
```json
{
  "success": true,
  "chapters": [
    {
      "id": "CHAPTER1",
      "name": "Numbers & Counting",
      "subjectId": "SUBJECT2"
    },
    {
      "id": "CHAPTER2",
      "name": "Basic Addition",
      "subjectId": "SUBJECT2"
    }
  ]
}
```

---

### 8. Get Videos
**Endpoint:** `POST /api`  
**Action:** `getVideos`

**Request:**
```json
{
  "action": "getVideos",
  "chapterId": "CHAPTER1"
}
```

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "id": "VIDEO1",
      "title": "Numbers 1 to 10",
      "class": "CLASS1",
      "subject": "SUBJECT2",
      "chapter": "CHAPTER1",
      "videoLink": "https://youtube.com/watch?v=abc123",
      "thumbnail": "https://..."
    }
  ]
}
```

---

### 9. Get Notes
**Endpoint:** `POST /api`  
**Action:** `getNotes`

**Request:**
```json
{
  "action": "getNotes",
  "videoId": "VIDEO1"
}
```

**Response:**
```json
{
  "success": true,
  "notes": [
    {
      "id": "NOTE1",
      "title": "Counting Worksheet",
      "pdfLink": "https://drive.google.com/..."
    }
  ]
}
```

---

### 10. Get Quiz
**Endpoint:** `POST /api`  
**Action:** `getQuiz`

**Request:**
```json
{
  "action": "getQuiz",
  "quizId": "QUIZ1"
}
```

**Response:**
```json
{
  "success": true,
  "quizId": "QUIZ1",
  "quizTitle": "Mathematics Quiz",
  "questions": [
    {
      "id": "Q1",
      "question": "What is 2 + 3?",
      "optionA": "4",
      "optionB": "5",
      "optionC": "6",
      "optionD": "7",
      "answer": "B"
    }
  ]
}
```

---

## Progress Tracking Endpoints

### 11. Save Progress
**Endpoint:** `POST /api`  
**Action:** `saveProgress`

**Request:**
```json
{
  "action": "saveProgress",
  "userId": "USER1701234567",
  "videoId": "VIDEO1",
  "watched": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress saved"
}
```

---

### 12. Save Quiz Score
**Endpoint:** `POST /api`  
**Action:** `saveQuizScore`

**Request:**
```json
{
  "action": "saveQuizScore",
  "userId": "USER1701234567",
  "quizId": "QUIZ1",
  "score": 8,
  "percentage": 85
}
```

**Response:**
```json
{
  "success": true,
  "message": "Score saved"
}
```

---

### 13. Get Dashboard Overview
**Endpoint:** `POST /api`  
**Action:** `getDashboardOverview`

**Request:**
```json
{
  "action": "getDashboardOverview",
  "userId": "USER1701234567"
}
```

**Response:**
```json
{
  "success": true,
  "isSubscribed": true,
  "videosWatched": 12,
  "quizzesCompleted": 5,
  "averageScore": 85,
  "studyHours": 6
}
```

---

## Subscription & Payment Endpoints

### 14. Verify Subscription
**Endpoint:** `POST /api`  
**Action:** `verifySubscription`

**Request:**
```json
{
  "action": "verifySubscription",
  "userId": "USER1701234567"
}
```

**Response:**
```json
{
  "success": true,
  "isSubscribed": true
}
```

---

### 15. Create Razorpay Order
**Endpoint:** `POST /api`  
**Action:** `createOrder`

**Request:**
```json
{
  "action": "createOrder",
  "userId": "USER1701234567",
  "email": "user@example.com",
  "amount": 29900
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORDER1701234567",
  "message": "Order created"
}
```

---

### 16. Verify Payment
**Endpoint:** `POST /api`  
**Action:** `verifyPayment`

**Request:**
```json
{
  "action": "verifyPayment",
  "paymentId": "pay_abc123",
  "orderId": "ORDER1701234567",
  "signature": "sig_xyz789",
  "userId": "USER1701234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified",
  "subscriptionStatus": "active"
}
```

---

## Admin Endpoints

### 17. Get Dashboard Stats
**Endpoint:** `POST /api`  
**Action:** `getDashboardStats`

**Request:**
```json
{
  "action": "getDashboardStats"
}
```

**Response:**
```json
{
  "success": true,
  "totalStudents": 150,
  "activeStudents": 120,
  "totalRevenue": 44850,
  "totalVideos": 250
}
```

---

### 18. Get All Students
**Endpoint:** `POST /api`  
**Action:** `getAllStudents`

**Request:**
```json
{
  "action": "getAllStudents"
}
```

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "id": "USER1701234567",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "9876543210",
      "status": "active",
      "joinDate": "2024-01-10T10:00:00Z"
    }
  ]
}
```

---

### 19. Get All Classes
**Endpoint:** `POST /api`  
**Action:** `getAllClasses`

**Request:**
```json
{
  "action": "getAllClasses"
}
```

**Response:**
```json
{
  "success": true,
  "classes": [
    {
      "id": "CLASS1",
      "name": "Class 1",
      "medium": "english",
      "subjectCount": 10
    }
  ]
}
```

---

### 20. Get All Payments
**Endpoint:** `POST /api`  
**Action:** `getAllPayments`

**Request:**
```json
{
  "action": "getAllPayments"
}
```

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "id": "ORDER1701234567",
      "studentName": "John Doe",
      "amount": 299,
      "date": "2024-01-15T10:00:00Z",
      "status": "active"
    }
  ]
}
```

---

## Content Management Endpoints

### 21. Add Class
**Endpoint:** `POST /api`  
**Action:** `addClass`

**Request:**
```json
{
  "action": "addClass",
  "className": "Class 10",
  "medium": "english"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Class added",
  "classId": "CLASS10"
}
```

---

### 22. Add Subject
**Endpoint:** `POST /api`  
**Action:** `addSubject`

**Request:**
```json
{
  "action": "addSubject",
  "subjectName": "Physics",
  "classId": "CLASS11"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subject added",
  "subjectId": "SUBJECT25"
}
```

---

### 23. Add Video
**Endpoint:** `POST /api`  
**Action:** `addVideo`

**Request:**
```json
{
  "action": "addVideo",
  "class": "CLASS1",
  "subject": "SUBJECT2",
  "chapter": "CHAPTER1",
  "title": "Introduction to Numbers",
  "videoLink": "https://youtube.com/watch?v=xyz789",
  "thumbnail": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video added",
  "videoId": "VIDEO100"
}
```

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 401 | Invalid email or password | Check credentials |
| 403 | Forbidden - Admin access required | Use admin credentials |
| 404 | Resource not found | Check ID parameters |
| 409 | Email already registered | Use different email |
| 500 | Server error | Contact support |
| 503 | Service unavailable | Try again later |

---

## Rate Limiting

- **Limit:** 60 requests per minute per IP
- **Headers:** X-RateLimit-Remaining, X-RateLimit-Reset

---

## Testing with cURL

```bash
# Register user
curl -X POST https://script.google.com/macros/d/{ID}/usercontent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerUser",
    "name": "John Doe",
    "mobile": "9876543210",
    "email": "john@example.com",
    "password": "pass123"
  }'

# Login user
curl -X POST https://script.google.com/macros/d/{ID}/usercontent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "loginUser",
    "email": "john@example.com",
    "password": "pass123"
  }'

# Get classes
curl -X POST https://script.google.com/macros/d/{ID}/usercontent \
  -H "Content-Type: application/json" \
  -d '{"action": "getClasses"}'
```

---

## SDK (JavaScript)

```javascript
// api.js provides wrapper functions
const registerUser = (email, password, name) => {
  return fetch('YOUR_API_URL', {
    method: 'POST',
    body: JSON.stringify({
      action: 'registerUser',
      email, password, name
    })
  }).then(r => r.json());
};
```

---

**API Documentation v1.0**  
Last Updated: 2024-01-15
