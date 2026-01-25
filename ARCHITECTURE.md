# 🏗️ System Architecture Overview

Visual representation of the Education Management System architecture.

---

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                      http://localhost:5173                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Teacher    │  │   Student    │  │   Public     │         │
│  │   Routes     │  │   Routes     │  │   Routes     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                           │                                     │
│                    ┌──────▼──────┐                             │
│                    │  API Layer  │                             │
│                    │ (Axios)     │                             │
│                    └──────┬──────┘                             │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTP/JSON
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      BACKEND (Express.js)                       │
│                     http://localhost:3000                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Middleware Layer                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │  │
│  │  │   CORS     │  │   Clerk    │  │  Express   │          │  │
│  │  │            │  │   Auth     │  │   JSON     │          │  │
│  │  └────────────┘  └────────────┘  └────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                  │
│  ┌──────────────────────────▼────────────────────────────── ┐  │
│  │                    Route Handlers                        │  │
│  │  ┌──────┐ ┌────────┐ ┌─────────┐ ┌──────┐ ┌─────────┐    │  │
│  │  │ Auth │ │Academy │ │Students │ │Exams │ │Teacher  │    │  │
│  │  └──────┘ └────────┘ └─────────┘ └──────┘ └─────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │                 Database Layer (Drizzle ORM)            │   │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQL
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   PostgreSQL Database                           │
│                        (Supabase)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### Teacher Authentication (Clerk)
```
┌─────────┐       ┌──────────┐       ┌─────────┐       ┌──────────┐
│ Teacher │──────▶│  Clerk   │──────▶│Frontend │──────▶│ Backend  │
│         │ Login │ (OAuth)  │ JWT   │         │ JWT   │          │
└─────────┘       └──────────┘       └─────────┘       └──────────┘
     │                                      │                 │
     │                                      │                 │
     └──────────────────┬───────────────────┘                 │
                        │                                     │
                   ✅ Verified                           ✅ Verified
                   (Client)                             (Server)
```

### Student Authentication (JWT)
```
┌─────────┐       ┌─────────┐       ┌──────────┐
│ Student │──────▶│Backend  │──────▶│PostgreSQL│
│         │ Login │  Auth   │ Query │          │
└─────────┘       └────┬────┘       └──────────┘
     ▲                 │
     │                 │ Generate JWT
     │                 ▼
     │           ┌──────────┐
     └───────────┤   JWT    │
     Returns     │  Token   │
                 └──────────┘
```

---

## 🎯 User Roles & Permissions

```
┌─────────────────────────────────────────────────────────────┐
│                         TEACHER                             │
│  (Authenticated via Clerk)                                  │
├─────────────────────────────────────────────────────────────┤
│  ✅ Create Academy                                          │
│  ✅ Manage Students (Create, View, Delete)                  │
│  ✅ Create Exams                                            │
│  ✅ View Exam Statistics                                    │
│  ✅ Monitor Student Performance                             │
│  ✅ View Question-by-Question Analysis                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         STUDENT                             │
│  (Authenticated via JWT)                                    │
├─────────────────────────────────────────────────────────────┤
│  ✅ Login to Academy                                        │
│  ✅ View Available Exams                                    │
│  ✅ Take Exams                                              │
│  ✅ View Own Results                                        │
│  ✅ View Own Performance History                            │
│  ❌ Cannot see other students' data                         │
│  ❌ Cannot create exams                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      PUBLIC (No Auth)                       │
├─────────────────────────────────────────────────────────────┤
│  ✅ View Landing Page                                       │
│  ✅ View Academy Public Info                                │
│  ✅ See Available Exams List (metadata only)               │
│  ❌ Cannot take exams                                       │
│  ❌ Cannot view results                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Data Models

### Database Schema Relationships

```
┌──────────────┐
│  academies   │
│──────────────│        1:N
│ id (PK)      │◄───────────┐
│ name         │            │
│ slug (UNIQUE)│            │
│ clerkUserId  │            │
└──────────────┘            │
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
┌─────────▼──────┐                   ┌────────▼───────┐
│    students    │                   │     exams      │
│────────────────│         N:M       │────────────────│
│ id (PK)        │◄─────────────────▶│ id (PK)        │
│ academyId (FK) │                   │ academyId (FK) │
│ username       │                   │ title          │
│ passwordHash   │                   │ difficulty     │
└────────┬───────┘                   └────────┬───────┘
         │                                    │
         │           1:N                      │ 1:N
         │      ┌─────────────────────────────┘
         │      │
         │      │
┌────────▼──────▼────┐
│   examAttempts     │
│────────────────────│         1:N
│ id (PK)            │◄────────────┐
│ studentId (FK)     │             │
│ examId (FK)        │             │
│ startedAt          │             │
│ submittedAt        │             │
│ score              │             │
└────────────────────┘             │
                                   │
                        ┌──────────▼──────────┐
                        │    examAnswers      │
                        │─────────────────────│
                        │ id (PK)             │
                        │ attemptId (FK)      │
                        │ questionId          │
                        │ selectedOption      │
                        │ isCorrect           │
                        └─────────────────────┘

┌─────────────────┐
│  questions      │
│─────────────────│
│ • questionsEasy │ (Separate tables)
│ • questionsMedium│
│ • questionsHard │
└─────────────────┘
```

---

## 🔄 Core User Flows

### Teacher Flow
```
1. Sign Up/Login (Clerk)
   ↓
2. Create Academy
   ↓
3. Add Students
   ↓
4. Create Exams
   ↓
5. Monitor Student Performance
   ↓
6. View Detailed Results
```

### Student Flow
```
1. Receive credentials from teacher
   ↓
2. Login to academy
   ↓
3. View available exams
   ↓
4. Check exam status
   ↓
5. Start exam attempt
   ↓
6. Answer questions
   ↓
7. Submit exam
   ↓
8. View results
```

---

## 🛣️ Routing Structure

### Frontend Routes

#### Public Routes (No Auth)
```
/                          → Landing Page
/:academySlug              → Academy Public Page
/:academySlug/login        → Student Login
/login                     → Teacher Login
/signup                    → Teacher Signup
```

#### Teacher Protected Routes
```
/create-academy                               → Create Academy
/:academySlug/dashboard                       → Teacher Dashboard
/:academySlug/dashboard/create-exam           → Create Exam
/:academySlug/dashboard/exams/:examId         → Exam Monitoring
/:academySlug/dashboard/exams/:examId/student/:studentId → Student Details
/:academySlug/students                        → Students List
```

#### Student Protected Routes
```
/:academySlug/exam/:examId                    → Exam Taking
/:academySlug/exam/:examId/result             → Exam Results
```

---

## 🔌 API Endpoints Structure

### Backend Routes
```
/api/auth
  └─ GET  /me                    (Teacher Auth Check)

/api/academy
  ├─ POST /create                (Create Academy)
  └─ GET  /:slug                 (Get Academy Info)

/api/students
  ├─ POST /create                (Create Student - Teacher)
  ├─ POST /login                 (Student Login)
  └─ GET  /performance           (Student Performance - Self)

/api/exams
  ├─ POST /create                           (Create Exam - Teacher)
  ├─ GET  /academy/:academySlug             (List Exams - Public)
  ├─ GET  /:examId/status                   (Check Status - Student)
  ├─ POST /:examId/start                    (Start Exam - Student)
  ├─ GET  /:examId/questions                (Get Questions - Student)
  ├─ POST /:examId/answer                   (Save Answer - Student)
  ├─ POST /:examId/answers                  (Batch Save - Student)
  ├─ POST /:examId/submit                   (Submit Exam - Student)
  └─ GET  /:examId/result                   (Get Results - Student)

/api/teacher
  ├─ GET  /academy/exams                          (List All Exams)
  ├─ GET  /academy/students                       (List All Students) ⚠️ NEW
  ├─ GET  /exams/:examId/summary                  (Exam Statistics)
  ├─ GET  /exams/:examId/attempts                 (All Attempts)
  ├─ GET  /exams/:examId/student/:studentId       (Student Details)
  └─ GET  /students/:studentId/performance        (Student Performance)
```

---

## 🔧 Technology Stack

### Frontend
```
┌─────────────────────────────────┐
│ React 18                        │
│ ├─ React Router DOM            │
│ ├─ @clerk/clerk-react           │
│ ├─ Axios                        │
│ └─ Vite                         │
└─────────────────────────────────┘
```

### Backend
```
┌─────────────────────────────────┐
│ Node.js + Express              │
│ ├─ @clerk/express              │
│ ├─ Drizzle ORM                 │
│ ├─ jsonwebtoken (for students) │
│ ├─ bcryptjs (password hashing) │
│ └─ cors                         │
└─────────────────────────────────┘
```

### Database
```
┌─────────────────────────────────┐
│ PostgreSQL (Supabase)          │
│ ├─ academies                   │
│ ├─ students                    │
│ ├─ exams                       │
│ ├─ examAttempts                │
│ ├─ examAnswers                 │
│ └─ questions (3 tables)        │
└─────────────────────────────────┘
```

---

## 📦 Project Structure

```
edu-maths/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app setup
│   │   ├── server.ts              # Server entry point
│   │   ├── db/
│   │   │   ├── index.ts           # Database connection
│   │   │   ├── schema/            # Database schemas
│   │   │   └── migrations/        # Database migrations
│   │   ├── middlewares/
│   │   │   ├── auth.ts            # Auth middleware
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── auth.ts            # Auth routes
│   │   │   ├── academy.ts         # Academy routes
│   │   │   ├── students.ts        # Student routes
│   │   │   ├── exams.ts           # Exam routes
│   │   │   └── teacher.ts         # Teacher routes
│   │   ├── services/
│   │   │   └── questions.ts       # Question service
│   │   └── utils/
│   │       ├── jwt.ts             # JWT utilities
│   │       ├── password.ts        # Password utilities
│   │       └── cron.ts            # Scheduled tasks
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx               # App entry point
│   │   ├── App.jsx                # Main app component
│   │   ├── auth/                  # Authentication components
│   │   ├── academy/               # Academy components
│   │   ├── dashboard/             # Dashboard components
│   │   ├── exam/                  # Exam components
│   │   ├── components/            # Reusable components
│   │   ├── contexts/              # React contexts
│   │   ├── services/
│   │   │   └── api.js             # API service
│   │   └── utils/
│   │       ├── axios.js           # Axios instance
│   │       ├── tokenStorage.js    # Token management
│   │       └── notifications.js   # Toast notifications
│   ├── package.json
│   └── .env
│
└── [Integration Documentation]
    ├── INTEGRATION_PLAN.md        # Detailed plan
    ├── INTEGRATION_CHECKLIST.md   # Progress checklist
    ├── PHASE1_QUICKSTART.md       # Phase 1 guide
    └── API_MAPPING.md             # This file
```

---

## 🎯 Integration Points

### Phase 1-2: Foundation
- ✅ Environment setup
- ✅ Missing endpoints added
- ✅ Base configuration verified

### Phase 3-4: Teacher Flow
- 🔐 Clerk authentication
- 🏫 Academy management
- 👥 Student management

### Phase 5-6: Exam Management
- 📝 Exam creation
- 📊 Dashboard statistics
- 🔍 Monitoring & analytics

### Phase 7-8: Student Flow
- 🔐 JWT authentication
- ✏️ Exam taking
- 📈 Results viewing

### Phase 9-10: Polish
- 🎨 UX improvements
- ⚠️ Error handling
- 📱 Responsive design

### Phase 11-12: Production
- 🧪 Testing
- 🚀 Deployment
- 📚 Documentation

---

**System Architecture Version**: 1.0
**Last Updated**: January 11, 2026
**Status**: Ready for Integration
