# AJB LEARN - Database Schema

This document describes the Google Sheets database structure for AJB Learn.

## Database Overview

The database consists of 9 main sheets handling different aspects of the platform:

1. **USERS** - Student and user information
2. **SUBSCRIPTIONS** - Payment and subscription data
3. **CLASSES** - Class definitions and structure
4. **SUBJECTS** - Subject information
5. **CHAPTERS** - Chapter structure under subjects
6. **VIDEOS** - Video content and links
7. **NOTES** - Study material PDFs
8. **QUIZZES** - Quiz questions and answers
9. **PROGRESS** - Student progress tracking

---

## Sheet Definitions

### 1. USERS Sheet
Stores all user account information.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A | User ID | Unique identifier (e.g., USER1701234567) |
| B | Name | Student full name |
| C | Mobile | 10-digit phone number |
| D | Email | Email address (unique) |
| E | Password | Hashed password |
| F | Created Date | Registration date (ISO format) |
| G | Status | active / inactive |

**Example Row:**
```
USER1701234567, Rajesh Kumar, 9876543210, rajesh@example.com, [hashed], 2024-01-15T10:30:00Z, active
```

**Indexes:**
- Email (unique)
- User ID (primary key)

---

### 2. SUBSCRIPTIONS Sheet
Manages subscription and payment information.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A | User ID | Reference to USERS.A |
| B | Order ID | Razorpay order ID |
| C | Amount | Subscription cost (in rupees) |
| D | Plan Name | e.g., "AJB Premium" |
| E | Subscription Date | Date of purchase (ISO format) |
| F | Payment ID | Razorpay payment ID |
| G | Status | pending / active / failed / cancelled |

**Example Row:**
```
USER1701234567, ORDER1701234500, 299, AJB Premium, 2024-01-15T10:30:00Z, PAY1701234500, active
```

**Indexes:**
- User ID (foreign key)
- Order ID (unique)
- Payment ID (unique)

---

### 3. CLASSES Sheet
Defines all available classes.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A | Class ID | Unique identifier (e.g., CLASS1) |
| B | Class Name | e.g., "Class 1", "Class 5" |
| C | Medium | english / assamese |

**Example Rows:**
```
CLASS1, Class 1, english
CLASS1_ASSAMESE, Class 1, assamese
CLASS5, Class 5, english
CLASS10, Class 10, english
```

**Indexes:**
- Class ID (primary key)

---

### 4. SUBJECTS Sheet
Defines subjects under each class.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A | Subject ID | Unique identifier (e.g., SUBJECT1) |
| B | Class ID | Reference to CLASSES.A |
| C | Subject Name | e.g., "Mathematics" |

**Example Rows:**
```
SUBJECT1, CLASS1, English
SUBJECT2, CLASS1, Mathematics
SUBJECT3, CLASS1, Science
SUBJECT4, CLASS1, Assamese
SUBJECT5, CLASS5, Hindi
```

**Indexes:**
- Subject ID (primary key)
- Class ID (foreign key)

---

### 5. CHAPTERS Sheet
Defines chapters under each subject.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A | Chapter ID | Unique identifier (e.g., CHAPTER1) |
| B | Subject ID | Reference to SUBJECTS.A |
| C | Chapter Name | e.g., "Numbers & Counting" |
| D | Chapter Number | 1, 2, 3, etc. |
| E | Description | Chapter description |

**Example Rows:**
```
CHAPTER1, SUBJECT2, Numbers & Counting, 1, Introduction to counting from 1-10
CHAPTER2, SUBJECT2, Basic Addition, 2, Learning simple addition concepts
CHAPTER3, SUBJECT3, Plants & Animals, 1, Understanding basic biology
```

**Indexes:**
- Chapter ID (primary key)
- Subject ID (foreign key)

---

### 6. VIDEOS Sheet
Stores all video content information.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A | Video ID | Unique identifier (e.g., VIDEO1) |
| B | Class ID | Reference to CLASSES.A |
| C | Subject ID | Reference to SUBJECTS.A |
| D | Chapter ID | Reference to CHAPTERS.A |
| E | Title | Video title |
| F | Video Link | YouTube or custom video link |
| G | Thumbnail | Thumbnail image URL |
| H | Duration | Video length in minutes |
| I | Upload Date | Date uploaded (ISO format) |

**Example Rows:**
```
VIDEO1, CLASS1, SUBJECT2, CHAPTER1, Counting 1 to 10, https://youtube.com/watch?v=abc123, https://..., 12, 2024-01-10T08:00:00Z
VIDEO2, CLASS1, SUBJECT2, CHAPTER2, Simple Addition, https://youtube.com/watch?v=def456, https://..., 15, 2024-01-10T09:00:00Z
```

**Indexes:**
- Video ID (primary key)
- Chapter ID (foreign key)

---

### 7. NOTES Sheet
Study materials and PDF resources.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A | Note ID | Unique identifier (e.g., NOTE1) |
| B | Video ID | Reference to VIDEOS.A |
| C | Class ID | Reference to CLASSES.A |
| D | Subject ID | Reference to SUBJECTS.A |
| E | Note Title | Title of study material |
| F | PDF Link | Google Drive or cloud storage PDF link |
| G | Upload Date | Date uploaded (ISO format) |

**Example Rows:**
```
NOTE1, VIDEO1, CLASS1, SUBJECT2, Counting Workbook, https://drive.google.com/..., 2024-01-10T08:00:00Z
NOTE2, VIDEO2, CLASS1, SUBJECT2, Addition Practice Sheet, https://drive.google.com/..., 2024-01-10T09:00:00Z
```

**Indexes:**
- Note ID (primary key)
- Video ID (foreign key)

---

### 8. QUIZZES Sheet
Quiz questions and answers for testing.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A | Quiz ID | Unique identifier (e.g., QUIZ1) |
| B | Class ID | Reference to CLASSES.A |
| C | Subject ID | Reference to SUBJECTS.A |
| D | Question | MCQ question text |
| E | Option A | First option |
| F | Option B | Second option |
| G | Option C | Third option |
| H | Option D | Fourth option |
| I | Correct Answer | A / B / C / D |
| J | Difficulty | easy / medium / hard |

**Example Rows:**
```
QUIZ1, CLASS1, SUBJECT2, What is 2+3?, 4, 5, 6, 7, B, easy
QUIZ2, CLASS1, SUBJECT2, What is 5+4?, 8, 9, 10, 11, B, easy
QUIZ3, CLASS1, SUBJECT3, How many legs does a dog have?, 2, 3, 4, 6, C, easy
```

**Indexes:**
- Quiz ID (primary key)

---

### 9. PROGRESS Sheet
Tracks student learning progress.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| A | Progress ID | Unique identifier (e.g., PROG1) |
| B | User ID | Reference to USERS.A |
| C | Video ID | Reference to VIDEOS.A |
| D | Watched | true / false |
| E | Quiz Score | Percentage (0-100) |
| F | Last Accessed | Last access date (ISO format) |

**Example Rows:**
```
PROG1, USER1701234567, VIDEO1, true, 0, 2024-01-15T14:30:00Z
PROG2, USER1701234567, QUIZ1, false, 85, 2024-01-15T15:00:00Z
```

**Indexes:**
- Progress ID (primary key)
- User ID (foreign key)
- Video ID (foreign key)

---

## Data Entry Instructions

### Step 1: Create Sheets
1. Open Google Sheets
2. Create a new spreadsheet for "AJB Learn"
3. Rename "Sheet1" to "USERS"
4. Add remaining sheets using Sheet > Insert sheet

### Step 2: Add Headers
For each sheet, create header row with column names (copy from tables above).

### Step 3: Sample Data Entry

**USERS Sheet:**
```
USER1701234567, John Doe, 9876543210, john@example.com, hashed_pwd, 2024-01-10T10:00:00Z, active
```

**CLASSES Sheet:**
```
CLASS1, Class 1, english
CLASS2, Class 2, english
CLASS3, Class 3, english
```

**SUBJECTS Sheet:**
```
SUBJECT1, CLASS1, English
SUBJECT2, CLASS1, Mathematics
SUBJECT3, CLASS1, Science
```

**CHAPTERS Sheet:**
```
CHAPTER1, SUBJECT1, Alphabet, 1, Learning English alphabet
CHAPTER2, SUBJECT2, Numbers, 1, Numbers 1 to 100
```

**VIDEOS Sheet:**
```
VIDEO1, CLASS1, SUBJECT1, CHAPTER1, A for Apple, https://youtube.com/watch?v=abc, https://..., 5, 2024-01-10T08:00:00Z
```

### Step 4: Data Validation
- Set email column to unique
- Set numeric columns to number validation
- Set status column to dropdown (active/inactive)

---

## Query Examples

### Get all classes for a student
```
FILTER(CLASSES, CLASSES.Medium = "english")
```

### Get videos watched by a student
```
JOIN(PROGRESS, VIDEOS, PROGRESS.VideoID = VIDEOS.ID)
WHERE PROGRESS.UserID = "USER123" AND PROGRESS.Watched = true
```

### Calculate student progress percentage
```
COUNTIF(PROGRESS, UserID = "USER123" AND Watched = true) / 
COUNTA(VIDEOS) * 100
```

---

## Best Practices

1. **Always backup** your Google Sheet
2. **Use validation rules** to prevent data entry errors
3. **Set appropriate permissions** for admin access
4. **Archive old data** for better performance
5. **Index frequently queried columns** for faster retrieval
6. **Use consistent date/time format** (ISO 8601)
7. **Never expose sensitive data** like passwords in logs

---

## Migration from Other Platforms

If migrating from another LMS, follow this mapping:
- User table → USERS sheet
- Course table → CLASSES sheet
- Lesson table → CHAPTERS sheet
- Video content → VIDEOS sheet
- Quiz questions → QUIZZES sheet
- Student progress → PROGRESS sheet

---

**Database Documentation v1.0**
Last Updated: 2024-01-15
