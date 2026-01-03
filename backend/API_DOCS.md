# Academy API Endpoints

## Authentication

All protected endpoints require a valid Clerk JWT token in the Authorization header:

```
Authorization: Bearer <CLERK_JWT_TOKEN>
```

The backend uses `@clerk/express` middleware which automatically verifies JWTs using Clerk's JWKS (JSON Web Key Set). No manual JWT verification is needed.

### How to get a Clerk JWT token:
1. Sign in through Clerk (frontend or API)
2. Get the session token: `await clerkClient.sessions.getToken(sessionId)`
3. Use this token in the Authorization header

---

## GET /api/auth/me

Used to verify the validity of the authentication token and identify the current user.

### Authentication
Requires Bearer token in Authorization header.

### Success Response (200)
```json
{
  "success": true,
  "message": "Authentication successful",
  "userId": "user_2qm..."
}
```

### Error Response (401)
```json
{
  "error": "Unauthorized",
  "message": "Authentication failed"
}
```

---

## POST /api/academy/create

Create a new academy for the authenticated teacher.

### Authentication
Requires Bearer token in Authorization header from Clerk.

### Request Body
```json
{
  "name": "My Abacus Academy",
  "slug": "my-abacus-academy",
  "logo_url": "https://example.com/logo.png", // optional
  "description": "Best abacus learning center" // optional
}
```

### Success Response (201)
```json
{
  "message": "Academy created successfully",
  "academy": {
    "id": "uuid",
    "name": "My Abacus Academy",
    "slug": "my-abacus-academy",
    "logoUrl": "https://example.com/logo.png",
    "description": "Best abacus learning center",
    "clerkUserId": "user_xxx",
    "createdAt": "2026-01-02T00:00:00.000Z"
  }
}
```

### Error Responses

#### 400 - Validation Error
```json
{
  "error": "Validation error",
  "message": "Name and slug are required"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid Authorization header"
}
```

#### 409 - Conflict (User already has academy)
```json
{
  "error": "Conflict",
  "message": "You already have an academy. Only one academy per user is allowed.",
  "existingAcademy": { ... }
}
```

#### 409 - Conflict (Slug taken)
```json
{
  "error": "Conflict",
  "message": "This slug is already taken. Please choose a different one."
}
```

### Business Rules
- ✅ One academy per Clerk user (MVP restriction)
- ✅ Unique slug across all academies
- ✅ Must be authenticated with valid Clerk token
- ✅ Name and slug are required fields
- ✅ Logo URL and description are optional

### Example cURL Request
```bash
curl -X POST http://localhost:3000/api/academy/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "name": "My Abacus Academy",
    "slug": "my-abacus-academy",
    "logo_url": "https://example.com/logo.png",
    "description": "Best abacus learning center"
  }'
```

---

## GET /api/academy/:slug

Fetch academy details by slug (public endpoint).

### Authentication
None required - public endpoint.

### URL Parameters
- `slug` (string) - The unique slug of the academy

### Success Response (200)
```json
{
  "academy": {
    "name": "My Abacus Academy",
    "logoUrl": "https://example.com/logo.png",
    "description": "Best abacus learning center"
  }
}
```

### Error Responses

#### 404 - Not Found
```json
{
  "error": "Not found",
  "message": "Academy not found"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch academy"
}
```

### Example cURL Request
```bash
curl http://localhost:3000/api/academy/my-abacus-academy
```

### Notes
- This is a public endpoint for displaying academy information
- Only returns public fields (name, logo, description)
- Does not expose sensitive data like clerk_user_id or id


---

## POST /api/students/create

Create a new student account for a specific academy.

### Authentication
Requires Bearer token in Authorization header (Teacher/Academy Owner).

### Request Body
`json
{
  "academyId": "uuid-referencing-academy",
  "username": "student_username",
  "password": "secure_password" // min 6 chars
}
``n
### Success Response (201)
`json
{
  "message": "Student created successfully",
  "student": {
    "id": "uuid",
    "username": "student_username",
    "academyId": "uuid",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
``n
### Error Responses
- **400 Validation Error**: Missing fields or password too short.
- **403 Forbidden**: Teacher does not own the academy.
- **409 Conflict**: Username already taken in this academy.

---

## POST /api/students/login

Student login to a specific academy.

### Authentication
None required (Public).

### Request Body
`json
{
  "academySlug": "my-academy-slug",
  "username": "student_username",
  "password": "secure_password"
}
``n
### Success Response (200)
`json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1Ni...", // Student JWT
  "student": {
    "id": "uuid",
    "username": "student_username",
    "academyId": "uuid",
    "academyName": "My Academy"
  }
}
``n
### Error Responses
- **404 Not Found**: Academy slug not found.
- **401 Unauthorized**: Invalid username or password.


---

## POST /api/exams/create

Create and schedule a new exam for an academy.

### Authentication
Requires Bearer token in Authorization header (Teacher/Academy Owner).

### Request Body
```json
{
  "academyId": "uuid-referencing-academy",
  "title": "Monthly Abacus Exam",
  "difficulty": "medium", // easy | medium | hard
  "totalQuestions": 10,
  "durationMinutes": 30,
  "startTime": "2026-01-10T10:00:00Z"
}
```

### Success Response (201)
```json
{
  "message": "Exam created successfully",
  "exam": {
    "id": "uuid",
    "title": "Monthly Abacus Exam",
    "difficulty": "medium",
    "totalQuestions": 10,
    "durationMinutes": 30,
    "startTime": "2026-01-10T10:00:00.000Z",
    "endTime": "2026-01-10T10:30:00.000Z",
    "createdAt": "2026-01-03T00:00:00.000Z"
  }
}
```

### Error Responses
- **400 Validation Error**: Missing fields, invalid difficulty, or invalid numeric values.
- **403 Forbidden**: Teacher does not own the academy.

### Notes
- endTime is automatically calculated as startTime + durationMinutes.
- No validation of question availability at this stage.


---

## GET /api/exams/academy/:academySlug

Get all exams for a specific academy (public endpoint).

### Authentication
None required (Public).

### URL Parameters
- cademySlug (string) - The unique slug of the academy

### Success Response (200)
```json
{
  "academy": {
    "name": "My Academy",
    "slug": "my-academy-slug"
  },
  "exams": [
    {
      "id": "uuid",
      "title": "Monthly Abacus Exam",
      "difficulty": "medium",
      "startTime": "2026-01-10T10:00:00.000Z",
      "endTime": "2026-01-10T10:30:00.000Z"
    }
  ]
}
```

### Error Responses
- **404 Not Found**: Academy slug not found.

### Notes
- This is a public endpoint for displaying available exams.
- Only returns public fields (id, title, difficulty, start/end times).
- Does not expose internal data like academyId, totalQuestions, or durationMinutes.


---

## GET /api/exams/:examId/status

Check the current status of an exam (student endpoint).

### Authentication
Requires Student JWT token in Authorization header.

### URL Parameters
- examId (string) - The unique ID of the exam

### Success Response (200)
```json
{
  "examId": "uuid",
  "title": "Monthly Abacus Exam",
  "difficulty": "medium",
  "startTime": "2026-01-10T10:00:00.000Z",
  "endTime": "2026-01-10T10:30:00.000Z",
  "status": "active" // not_started | active | expired
}
```

### Error Responses
- **401 Unauthorized**: Missing or invalid student JWT.
- **403 Forbidden**: Exam does not belong to student's academy.
- **404 Not Found**: Exam not found.

### Status Values
- **not_started**: Current time is before the exam start time.
- **active**: Exam is currently in progress (between start and end time).
- **expired**: Exam has ended (current time is after end time).

### Notes
- This endpoint enforces academy isolation - students can only check exams from their own academy.
- No attempt tracking at this stage.

---

## POST /api/exams/:examId/start

Start an exam attempt for a student.

### Authentication
Requires Student JWT token in Authorization header.

### URL Parameters
- examId (string) - The unique ID of the exam

### Success Response (201)
```json
{
  "message": "Exam attempt started successfully",
  "attemptId": "uuid",
  "durationMinutes": 30,
  "serverStartTime": "2026-01-10T10:05:00.000Z"
}
```

### Error Responses

#### 400 - Exam Not Started Yet
```json
{
  "error": "Bad Request",
  "message": "Exam has not started yet"
}
```

#### 400 - Exam Already Ended
```json
{
  "error": "Bad Request",
  "message": "Exam has already ended"
}
```

#### 400 - Already Attempted
```json
{
  "error": "Bad Request",
  "message": "You have already attempted this exam"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid student JWT"
}
```

#### 403 - Forbidden
```json
{
  "error": "Forbidden",
  "message": "You are not enrolled in this academy"
}
```

#### 404 - Not Found
```json
{
  "error": "Not Found",
  "message": "Exam not found"
}
```

### Business Rules
- ✅ Exam must exist
- ✅ Exam must belong to student's academy (academy isolation)
- ✅ Current time must be within exam window (startTime ≤ now ≤ endTime)
- ✅ Student can only attempt each exam once (unique constraint enforced)
- ✅ Questions are randomly selected and locked to this attempt
- ✅ started_at is set to server's current time
- ✅ submitted_at and score remain null until submission

### Notes
- The `serverStartTime` returned is the authoritative start time for the exam.
- Students should use this time to calculate their remaining duration.
- The unique constraint on (student_id, exam_id) prevents duplicate attempts.
- This endpoint creates an entry in the `exam_attempts` table.
- **Question Locking**: Random questions are selected and locked by pre-creating `exam_answers` rows with question IDs.
- The same student will always receive the same questions for their attempt, even if they refresh the page.



---

## GET /api/exams/:examId/questions

Fetch locked exam questions for a student's specific attempt.

### Authentication
Requires Student JWT token in Authorization header.

### URL Parameters
- examId (string) - The unique ID of the exam

### Success Response (200)
```json
{
  "examId": "uuid",
  "title": "Monthly Exam",
  "difficulty": "easy",
  "totalQuestions": 10,
  "durationMinutes": 30,
  "attemptId": "uuid",
  "questions": [
    {
      "id": "uuid",
      "question": "What is 5 + 3?",
      "options": ["6", "7", "8", "9"]
    }
  ]
}
```

### Error Responses

#### 400 - Exam Not Started
```json
{
  "error": "Bad Request",
  "message": "Exam has not started yet"
}
```

#### 400 - Exam Already Ended
```json
{
  "error": "Bad Request",
  "message": "Exam has already ended"
}
```

#### 400 - Attempt Not Started
```json
{
  "error": "Bad Request",
  "message": "You must start the exam before accessing questions"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid student JWT"
}
```

#### 403 - Forbidden
```json
{
  "error": "Forbidden",
  "message": "You are not enrolled in this academy"
}
```

#### 404 - Not Found
```json
{
  "error": "Not Found",
  "message": "Exam not found"
}
```

### Business Rules
- ✅ Student must have started the exam (POST /api/exams/:examId/start)
- ✅ Questions are fetched from locked `exam_answers` entries
- ✅ Same student always receives the same questions for their attempt
- ✅ **Correct answers are NOT included** in the response for security
- ✅ Exam must be in active state (between startTime and endTime)
- ✅ Academy isolation is enforced

### Notes
- Questions are locked when the student starts the exam (POST /api/exams/:examId/start).
- This endpoint retrieves the locked questions from the `exam_answers` table.
- Even if the student refreshes the page, they will receive the same questions.
- The `attemptId` is included in the response for use in submission.
- Questions are returned in the order they were locked (database order).

### Important: Time Zones
- All times are stored and compared in UTC.
- When creating exams, convert local time to UTC before sending startTime.
- Example: For 2:00 AM IST, send 2026-01-02T20:30:00.000Z (UTC).

---

## POST /api/exams/:examId/answer

Submit an answer for a specific question during an exam attempt.

### Authentication
Requires Student JWT token in Authorization header.

### URL Parameters
- examId (string) - The unique ID of the exam

### Request Body
```json
{
  "questionId": "uuid",
  "selectedOption": 2
}
```

### Success Response (200)
```json
{
  "message": "Answer saved successfully",
  "questionId": "uuid",
  "selectedOption": 2
}
```

### Error Responses

#### 400 - Validation Error (Missing Fields)
```json
{
  "error": "Validation Error",
  "message": "questionId and selectedOption are required"
}
```

#### 400 - Validation Error (Invalid Option)
```json
{
  "error": "Validation Error",
  "message": "selectedOption must be a non-negative number"
}
```

#### 400 - Attempt Not Started
```json
{
  "error": "Bad Request",
  "message": "You must start the exam before submitting answers"
}
```

#### 400 - Already Submitted
```json
{
  "error": "Bad Request",
  "message": "Exam has already been submitted"
}
```

#### 400 - Time Expired
```json
{
  "error": "Bad Request",
  "message": "Exam time has expired. Please submit the exam."
}
```

#### 400 - Invalid Question
```json
{
  "error": "Bad Request",
  "message": "Question does not belong to this exam attempt"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid student JWT"
}
```

#### 403 - Forbidden
```json
{
  "error": "Forbidden",
  "message": "You are not enrolled in this academy"
}
```

#### 404 - Not Found
```json
{
  "error": "Not Found",
  "message": "Exam not found"
}
```

### Business Rules
- ✅ Student must have started the exam (exam_attempt must exist)
- ✅ Exam must not be submitted yet (submittedAt must be null)
- ✅ Exam time must not have expired (current time ≤ startedAt + durationMinutes)
- ✅ Question must belong to the student's locked question set
- ✅ Answers can be overwritten multiple times before final submission
- ✅ Score is NOT calculated at this stage (only on final submission)
- ✅ Academy isolation is enforced

### Notes
- This endpoint allows students to save answers one question at a time.
- Students can change their answer by calling this endpoint again with the same questionId.
- The `selectedOption` is saved but NOT evaluated until final submission.
- The `isCorrect` field in the database is not updated at this stage.
- This provides auto-save functionality for the exam interface.
- **Time Validation**: If exam duration has expired, this endpoint will return an error prompting the student to submit the exam.

---

## POST /api/exams/:examId/answers

Submit multiple answers at once (batch submission).

### Authentication
Requires Student JWT token in Authorization header.

### URL Parameters
- examId (string) - The unique ID of the exam

### Request Body
```json
{
  "answers": [
    {
      "questionId": "uuid-1",
      "selectedOption": 2
    },
    {
      "questionId": "uuid-2",
      "selectedOption": 1
    },
    {
      "questionId": "uuid-3",
      "selectedOption": 3
    }
  ]
}
```

### Success Response (200)
```json
{
  "message": "Answers saved successfully",
  "savedCount": 3,
  "totalQuestions": 10
}
```

### Error Responses

#### 400 - Validation Error (Empty Array)
```json
{
  "error": "Validation Error",
  "message": "answers array is required and must not be empty"
}
```

#### 400 - Validation Error (Invalid Answer)
```json
{
  "error": "Validation Error",
  "message": "Each answer must have questionId and selectedOption"
}
```

#### 400 - Validation Error (Invalid Option)
```json
{
  "error": "Validation Error",
  "message": "selectedOption must be a non-negative number"
}
```

#### 400 - Attempt Not Started
```json
{
  "error": "Bad Request",
  "message": "You must start the exam before submitting answers"
}
```

#### 400 - Already Submitted
```json
{
  "error": "Bad Request",
  "message": "Exam has already been submitted"
}
```

#### 400 - Time Expired
```json
{
  "error": "Bad Request",
  "message": "Exam time has expired. Please submit the exam."
}
```

#### 400 - Invalid Question
```json
{
  "error": "Bad Request",
  "message": "Question {questionId} does not belong to this exam attempt"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid student JWT"
}
```

#### 403 - Forbidden
```json
{
  "error": "Forbidden",
  "message": "You are not enrolled in this academy"
}
```

#### 404 - Not Found
```json
{
  "error": "Not Found",
  "message": "Exam not found"
}
```

### Business Rules
- ✅ Student must have started the exam (exam_attempt must exist)
- ✅ Exam must not be submitted yet (submittedAt must be null)
- ✅ Exam time must not have expired (current time ≤ startedAt + durationMinutes)
- ✅ All questions must belong to the student's locked question set
- ✅ Answers can be overwritten by calling this endpoint again
- ✅ Score is NOT calculated at this stage (only on final submission)
- ✅ Academy isolation is enforced
- ✅ Validates all answers before updating any

### Notes
- This endpoint is more efficient than calling POST /api/exams/:examId/answer multiple times.
- All answers are validated before any updates occur (atomic validation).
- Students can submit partial answers (don't need to answer all questions).
- The `savedCount` indicates how many answers were successfully saved.
- The `totalQuestions` shows the total number of questions in the exam.
- Answers can be overwritten by submitting the same questionId again.
- **Time Validation**: If exam duration has expired, this endpoint will return an error prompting the student to submit the exam.

---

## POST /api/exams/:examId/submit

Submit exam for final evaluation and scoring.

### Authentication
Requires Student JWT token in Authorization header.

### URL Parameters
- examId (string) - The unique ID of the exam

### Request Body
No request body required.


### Success Response (200)

**Manual Submission (within time limit):**
```json
{
  "message": "Exam submitted successfully",
  "score": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "submittedAt": "2026-01-04T10:30:00.000Z",
  "autoSubmitted": false
}
```

**Auto-Submission (after time expired):**
```json
{
  "message": "Exam auto-submitted (time expired)",
  "score": 6,
  "totalQuestions": 10,
  "percentage": 60,
  "submittedAt": "2026-01-04T10:45:00.000Z",
  "autoSubmitted": true
}
```

### Error Responses

#### 400 - Attempt Not Started
```json
{
  "error": "Bad Request",
  "message": "You must start the exam before submitting"
}
```

#### 400 - Already Submitted
```json
{
  "error": "Bad Request",
  "message": "Exam has already been submitted"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid student JWT"
}
```

#### 403 - Forbidden
```json
{
  "error": "Forbidden",
  "message": "You are not enrolled in this academy"
}
```

#### 404 - Not Found
```json
{
  "error": "Not Found",
  "message": "Exam not found"
}
```

#### 500 - Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "No answers found for this attempt"
}
```

### Business Rules
- ✅ Student must have started the exam (exam_attempt must exist)
- ✅ Exam must not be already submitted (submittedAt must be null)
- ✅ All answers are evaluated against correct answers from question bank
- ✅ Score is calculated as number of correct answers
- ✅ `isCorrect` field is updated for each answer in exam_answers table
- ✅ `submittedAt` timestamp is set to current server time
- ✅ `score` is saved in exam_attempts table
- ✅ Academy isolation is enforced
- ✅ Submission is idempotent-safe (prevents double submission)

### Evaluation Logic
1. Fetch all student's answers from `exam_answers` table
2. Fetch correct answers from appropriate question bank (easy/medium/hard)
3. Compare each student answer with correct answer
4. Update `isCorrect` field for each answer
5. Calculate score as count of correct answers
6. Update exam attempt with score and submission timestamp

### Notes
- This endpoint performs the final evaluation and locks the exam.
- Once submitted, answers cannot be changed.
- The `percentage` is calculated as `(score / totalQuestions) * 100`.
- All answers are evaluated, including those with placeholder values (selectedOption: 0).
- Unanswered questions (selectedOption: 0) will be marked as incorrect.
- The submission timestamp is the server's current time in UTC.
- This endpoint should be called when student clicks "Submit Exam" or when timer expires.

### Auto-Submit Logic
- **Expiry Calculation**: `expiryTime = startedAt + durationMinutes`
- If student submits **after** expiry time:
  - Exam is still evaluated and scored normally
  - Response includes `autoSubmitted: true`
  - Message changes to "Exam auto-submitted (time expired)"
- If student submits **within** time limit:
  - Response includes `autoSubmitted: false`
  - Message is "Exam submitted successfully"
- **No background jobs**: Auto-submit detection happens on-demand when student submits
- Unanswered questions are evaluated as incorrect in both cases

### Response Fields
- `score` - Number of correct answers
- `totalQuestions` - Total number of questions in the exam
- `percentage` - Score as a percentage (rounded to nearest integer)
- `submittedAt` - Server timestamp when exam was submitted (UTC)
- `autoSubmitted` - Boolean indicating if submission was after time expired

---

## GET /api/exams/:examId/result

Fetch exam result for a student.

### Authentication
Requires Student JWT token in Authorization header.

### URL Parameters
- examId (string) - The unique ID of the exam

### Request Body
No request body required.

### Success Response (200)
```json
{
  "score": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "submittedAt": "2026-01-04T10:30:00.000Z"
}
```

### Error Responses

#### 400 - Not Submitted Yet
```json
{
  "error": "Bad Request",
  "message": "Exam has not been submitted yet"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid student JWT"
}
```

#### 403 - Forbidden
```json
{
  "error": "Forbidden",
  "message": "You are not enrolled in this academy"
}
```

#### 404 - Exam Not Found
```json
{
  "error": "Not Found",
  "message": "Exam not found"
}
```

#### 404 - Not Attempted
```json
{
  "error": "Not Found",
  "message": "You have not attempted this exam"
}
```

### Business Rules
- ✅ Student must have attempted the exam (exam_attempt must exist)
- ✅ Exam must be submitted (submittedAt must not be null)
- ✅ Exam must belong to student's academy (academy isolation)
- ✅ Only returns score and percentage, not individual answers
- ✅ Can be called multiple times (idempotent)

### Notes
- This endpoint can only be accessed after the exam has been submitted.
- Students can view their results immediately after submission.
- The result includes score, total questions, percentage, and submission timestamp.
- Individual question answers are not exposed (for security).
- Results are permanent and cannot be changed.

### Response Fields
- `score` - Number of correct answers
- `totalQuestions` - Total number of questions in the exam
- `percentage` - Score as a percentage (rounded to nearest integer)
- `submittedAt` - Server timestamp when exam was submitted (UTC)

### Use Cases
- Display results page after exam submission
- Allow students to review their score later
- Show historical exam performance





