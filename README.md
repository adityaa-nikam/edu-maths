# Edu-Maths - Abacus Exam Platform

A full-stack web application used for managing Abacus exams and academies.

## 🏗️ Architecture
- **Frontend**: React, Vite, TypeScript, Clerk (Auth).
- **Backend**: Node.js, Express, TypeScript, Clerk (Auth Middleware), Drizzle ORM, PostgreSQL.
- **Database**: PostgreSQL (via Supabase/Neon).

## 🚀 Getting Started

### 1. Backend Setup
The backend handles API requests, database interactions, and authentication verification.

```bash
cd backend
npm install
# Create .env file with CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, DATABASE_URL
npm run dev
```
**Server runs on:** `http://localhost:3000`

### 2. Frontend Setup
The frontend is a React app for user interaction.

```bash
cd frontend
npm install
# Create .env file with VITE_CLERK_PUBLISHABLE_KEY
npm run dev
```
**App runs on:** `http://localhost:5173`

---

## 🔐 Authentication & Testing (Important)

We use **Clerk** for authentication.

### Testing API with Postman
Clerk "Session Tokens" are extremely short-lived (60 seconds). To test endpoints in Postman without the token expiring immediately:

1. Go to **Frontend** (`http://localhost:5173`).
2. Sign in.
3. Click the green button **"Get Long-Lived Token (For Postman)"**.
   - *Prerequisite*: You must have created a JWT Template named `testing` in your Clerk Dashboard with a lifetime of 3600 seconds (1 hour).
4. Copy the token.
5. In **Postman**, set `Authorization` header: `Bearer <YOUR_TOKEN>`.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Server health check | ❌ No |
| `GET` | `/api/auth/me` | Returns current authenticated user ID | ✅ Yes |
| `GET` | `/api/academy/:slug` | Get public academy info | ❌ No |
| `POST` | `/api/academy/create` | Create a new academy | ✅ Yes |
| `POST` | `/api/students/create` | Create a new student | ✅ Yes |
| `POST` | `/api/students/login` | Student login (returns JWT) | ❌ No |
| `POST` | `/api/exams/create` | Create/schedule an exam | ✅ Yes |

For detailed API documentation, see [backend/API_DOCS.md](backend/API_DOCS.md).

---

## 📅 Development Status

- ✅ **Phase 1: Foundation**
  - Project Setup (Frontend + Backend)
  - Database Schema (Academies)
  - Teacher Auth (Clerk)
  - Academy Management

- ✅ **Phase 2: Student Authentication**
  - Database Schema (Students)
  - Student Creation (Scoped to Academy)
  - Student Login (JWT Issue)
  - Student Auth Middleware
  - Cross-Academy Security Checks

- ⏳ **Phase 3: Exams**
  - ✅ Exam Schema
  - ✅ Question Bank (Easy/Medium/Hard)
  - ✅ Exam Creation & Scheduling
  - ⏳ Exam Listing (Academy-scoped)
  - ⏳ Exam Attempts
  - ⏳ Answer Evaluation
