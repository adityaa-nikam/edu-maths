# 🗺️ API Endpoint Mapping Guide

Quick reference for frontend-backend API integration.

---

## Backend Base URL
- **Development**: `http://localhost:3000`
- **API Prefix**: `/api`
- **Full Example**: `http://localhost:3000/api/auth/me`

---

## 🔐 Authentication Endpoints

### Teacher Authentication (Clerk)
| Frontend Call | Backend Endpoint | Method | Auth Required | Purpose |
|--------------|------------------|--------|---------------|---------|
| `authAPI.verifyMe()` | `/api/auth/me` | GET | ✅ Clerk JWT | Verify teacher token |

**Token Header**: `Authorization: Bearer <CLERK_JWT>`

### Student Authentication (JWT)
| Frontend Call | Backend Endpoint | Method | Auth Required | Purpose |
|--------------|------------------|--------|---------------|---------|
| `studentAPI.login()` | `/api/students/login` | POST | ❌ Public | Student login, returns JWT |

**Request Body**:
```json
{
  "academySlug": "my-academy",
  "username": "student1",
  "password": "password123"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "student": { ... }
}
```

---

## 🏫 Academy Endpoints

| Frontend Call | Backend Endpoint | Method | Auth Required | Purpose |
|--------------|------------------|--------|---------------|---------|
| `academyAPI.create()` | `/api/academy/create` | POST | ✅ Teacher | Create new academy |
| `academyAPI.getBySlug()` | `/api/academy/:slug` | GET | ❌ Public | Get academy info |

### Create Academy Request:
```json
{
  "name": "My Academy",
  "slug": "my-academy",
  "logo_url": "https://...",
  "description": "..."
}
```

---

## 👨‍🎓 Student Management Endpoints

| Frontend Call | Backend Endpoint | Method | Auth Required | Purpose |
|--------------|------------------|--------|---------------|---------|
| `studentAPI.create()` | `/api/students/create` | POST | ✅ Teacher | Create new student |
| `teacherAPI.getAcademyStudents()` | `/api/teacher/academy/students` | GET | ✅ Teacher | **[NEW]** List all students |
| `studentAPI.getPerformance()` | `/api/students/performance` | GET | ✅ Student | Student's own performance |
| `teacherAPI.getStudentPerformance()` | `/api/teacher/students/:studentId/performance` | GET | ✅ Teacher | View student performance |

### Create Student Request:
```json
{
  "academyId": "uuid",
  "username": "student1",
  "password": "password123"
}
```

---

## 📝 Exam Management Endpoints

### Exam Creation & Listing
| Frontend Call | Backend Endpoint | Method | Auth Required | Purpose |
|--------------|------------------|--------|---------------|---------|
| `examAPI.create()` | `/api/exams/create` | POST | ✅ Teacher | Create new exam |
| `examAPI.getByAcademy()` | `/api/exams/academy/:academySlug` | GET | ❌ Public | List exams for academy |
| `teacherAPI.getAcademyExams()` | `/api/teacher/academy/exams` | GET | ✅ Teacher | Teacher's exams with stats |

### Create Exam Request:
```json
{
  "academyId": "uuid",
  "title": "Math Test 1",
  "difficulty": "easy",
  "totalQuestions": 10,
  "durationMinutes": 30,
  "startTime": "2026-01-15T10:00:00Z"
}
```

---

## 📊 Exam Monitoring (Teacher)

| Frontend Call | Backend Endpoint | Method | Auth Required | Purpose |
|--------------|------------------|--------|---------------|---------|
| `teacherAPI.getExamSummary()` | `/api/teacher/exams/:examId/summary` | GET | ✅ Teacher | Exam statistics |
| `teacherAPI.getExamAttempts()` | `/api/teacher/exams/:examId/attempts` | GET | ✅ Teacher | All student attempts |
| `teacherAPI.getStudentExamDetails()` | `/api/teacher/exams/:examId/student/:studentId` | GET | ✅ Teacher | Question-by-question view |

### Summary Response Example:
```json
{
  "examId": "uuid",
  "examTitle": "Math Test 1",
  "totalQuestions": 10,
  "difficulty": "easy",
  "summary": {
    "totalStudentsAttempted": 25,
    "totalStudentsSubmitted": 20,
    "averageScore": 7.5,
    "highestScore": 10,
    "lowestScore": 3
  }
}
```

---

## ✏️ Exam Taking (Student)

### Exam Status & Start
| Frontend Call | Backend Endpoint | Method | Auth Required | Purpose |
|--------------|------------------|--------|---------------|---------|
| `examAPI.getStatus()` | `/api/exams/:examId/status` | GET | ✅ Student | Check if can start |
| `examAPI.start()` | `/api/exams/:examId/start` | POST | ✅ Student | Start exam attempt |
| `examAPI.getQuestions()` | `/api/exams/:examId/questions` | GET | ✅ Student | Get exam questions |

### Answer Submission
| Frontend Call | Backend Endpoint | Method | Auth Required | Purpose |
|--------------|------------------|--------|---------------|---------|
| `examAPI.saveAnswer()` | `/api/exams/:examId/answer` | POST | ✅ Student | Save single answer |
| `examAPI.saveAllAnswers()` | `/api/exams/:examId/answers` | POST | ✅ Student | Batch save answers |
| `examAPI.submit()` | `/api/exams/:examId/submit` | POST | ✅ Student | Submit exam |
| `examAPI.getResult()` | `/api/exams/:examId/result` | GET | ✅ Student | Get exam results |

### Save Answer Request:
```json
{
  "questionId": "uuid",
  "selectedOption": "A"
}
```

### Batch Save Request:
```json
{
  "answers": [
    { "questionId": "uuid1", "selectedOption": "A" },
    { "questionId": "uuid2", "selectedOption": "B" }
  ]
}
```

---

## 🔄 Request Flow Examples

### Teacher Flow: Create Exam
```
1. Login with Clerk → Get JWT token
2. POST /api/academy/create → Create academy (if not exists)
3. POST /api/students/create → Add students
4. POST /api/exams/create → Create exam
5. GET /api/teacher/academy/exams → View all exams
6. GET /api/teacher/exams/:examId/summary → Monitor exam
```

### Student Flow: Take Exam
```
1. POST /api/students/login → Get JWT token
2. GET /api/exams/academy/:slug → See available exams
3. GET /api/exams/:examId/status → Check if can start
4. POST /api/exams/:examId/start → Start attempt
5. GET /api/exams/:examId/questions → Load questions
6. POST /api/exams/:examId/answer (multiple) → Save answers
7. POST /api/exams/:examId/submit → Submit exam
8. GET /api/exams/:examId/result → View results
```

---

## 🚨 Error Codes & Handling

| Status | Error | Frontend Action |
|--------|-------|-----------------|
| 400 | Bad Request | Show validation error |
| 401 | Unauthorized | Redirect to login, clear token |
| 403 | Forbidden | Show "No permission" message |
| 404 | Not Found | Show "Not found" page |
| 409 | Conflict | Show "Already exists" error |
| 500 | Server Error | Show "Server error" message |

---

## 📦 Frontend API Service Files

### Current Structure:
```
frontend/src/
  ├── services/
  │   └── api.js          # Main API service (✅ Configured)
  ├── api/
  │   ├── studentAPI.js   # Student-specific APIs (⚠️ Old, may need update)
  │   └── teacherAPI.js   # Teacher-specific APIs (⚠️ Old, may need update)
  └── utils/
      └── axios.js        # Axios instance (⚠️ Different from api.js)
```

### ⚠️ Important:
- `services/api.js` is the **main** API service to use (most up-to-date)
- `api/studentAPI.js` and `api/teacherAPI.js` might be **older versions**
- `utils/axios.js` is a **separate** instance (used by old API files)

### Recommendation:
**Use** `services/api.js` for all new integrations:
```javascript
import { authAPI, academyAPI, studentAPI, examAPI, teacherAPI } from '../services/api';
```

---

## 🆕 Missing Endpoints (To Be Added in Phase 2)

### GET /api/teacher/academy/students
**Purpose**: List all students in teacher's academy

**Response Example**:
```json
{
  "academyId": "uuid",
  "academyName": "My Academy",
  "totalStudents": 25,
  "students": [
    {
      "id": "uuid",
      "username": "student1",
      "createdAt": "2026-01-10T..."
    }
  ]
}
```

**Used By**: `StudentsList.jsx` component

---

## 🔑 Token Storage

### Teacher (Clerk JWT)
- Managed by Clerk SDK
- Retrieved via: `await window.Clerk.session.getToken()`
- Stored automatically by Clerk

### Student (Custom JWT)
- Stored in: `localStorage.getItem('studentToken')`
- Set after login: `localStorage.setItem('studentToken', token)`
- Cleared on logout: `localStorage.removeItem('studentToken')`

---

## 🎯 Quick Integration Tips

1. **Always check token first** before making authenticated requests
2. **Handle errors globally** in axios interceptor
3. **Show loading states** while waiting for API responses
4. **Validate data** before sending to backend
5. **Use TypeScript types** if converting to TS (recommended)

---

## 📝 Testing Endpoints

### Using curl:
```bash
# Health check
curl http://localhost:3000/health

# Student login
curl -X POST http://localhost:3000/api/students/login \
  -H "Content-Type: application/json" \
  -d '{"academySlug":"test","username":"student1","password":"pass123"}'

# With auth token
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman:
1. Set base URL: `http://localhost:3000`
2. Add prefix: `/api`
3. Add header: `Authorization: Bearer <token>`
4. Test each endpoint

---

## 🔗 Related Documentation

- **Full API Documentation**: `backend/API_DOCS.md`
- **Integration Plan**: `INTEGRATION_PLAN.md`
- **Checklist**: `INTEGRATION_CHECKLIST.md`

---

**Last Updated**: January 11, 2026
**Status**: Ready for integration
