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
- ✅ started_at is set to server's current time
- ✅ submitted_at and score remain null until submission

### Notes
- The `serverStartTime` returned is the authoritative start time for the exam.
- Students should use this time to calculate their remaining duration.
- The unique constraint on (student_id, exam_id) prevents duplicate attempts.
- This endpoint creates an entry in the `exam_attempts` table.



---

## GET /api/exams/:examId/questions

Fetch exam questions for a student (only during active exam time).

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
- **400 Bad Request**: Exam has not started yet or has already ended.
- **401 Unauthorized**: Missing or invalid student JWT.
- **403 Forbidden**: Exam does not belong to student's academy.
- **404 Not Found**: Exam not found.

### Notes
- Questions are randomly selected based on exam difficulty and totalQuestions.
- **Correct answers are NOT included** in the response for security.
- Exam must be in active state (between startTime and endTime).
- Academy isolation is enforced.
- No attempt tracking at this stage.

### Important: Time Zones
- All times are stored and compared in UTC.
- When creating exams, convert local time to UTC before sending startTime.
- Example: For 2:00 AM IST, send 2026-01-02T20:30:00.000Z (UTC).

