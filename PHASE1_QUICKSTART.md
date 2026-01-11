# 🚀 Quick Start: Phase 1 - Environment Setup

This guide will walk you through Phase 1 of the integration.

---

## What We'll Do in Phase 1

1. Verify backend environment configuration
2. Update frontend environment variables
3. Verify Clerk integration
4. Test that both servers start correctly

---

## Step-by-Step Instructions

### Step 1: Verify Backend Environment ✅

The backend `.env` file is already configured. Let's verify it's correct:

**File**: `backend/.env`

Required variables:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
JWT_SECRET=super_secret_student_key_change_me_in_prod
JWT_EXPIRES_IN=24h
API_URL=http://localhost:3000
```

✅ **Action**: Check that all these variables exist and have values.

---

### Step 2: Update Frontend Environment 🔧

**File**: `frontend/.env`

Current state:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_DEV_AUTH_BYPASS=true
```

**Issues to fix**:
1. Missing `/api` suffix in base URL
2. Missing Clerk publishable key
3. DEV_AUTH_BYPASS should be removed/false for production

**What needs to be done**:

#### For Development (Testing Integration):
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# Clerk Authentication (for teachers)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cHJlY2lzZS1rb2FsYS05OC5jbGVyay5hY2NvdW50cy5kZXYk

# Development Mode (set to false once we start integration)
VITE_DEV_AUTH_BYPASS=false
```

Note: The base URL should be `http://localhost:3000` (without `/api`) because the axios instance already adds `/api` prefix in the interceptor.

---

### Step 3: Verify Clerk Configuration 🔐

**File**: `frontend/src/main.jsx`

Check that ClerkProvider is properly configured:

```jsx
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

✅ **Action**: Verify this setup exists in main.jsx

---

### Step 4: Test Backend Server 🖥️

Open terminal in `backend` folder:

```bash
# Install dependencies (if not done)
npm install

# Start backend server
npm run dev
```

**Expected output**:
```
✅ CLERK_SECRET_KEY is loaded
🚀 Server is running on port 3000
🔗 Health check: http://localhost:3000/health
```

**Verify**:
- No errors in console
- Server starts on port 3000
- Health check endpoint accessible

---

### Step 5: Test Frontend Server 💻

Open terminal in `frontend` folder:

```bash
# Install dependencies (if not done)
npm install

# Start frontend server
npm run dev
```

**Expected output**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Verify**:
- No errors in console
- Server starts successfully
- Open browser to http://localhost:5173/

---

### Step 6: Browser Console Check 🔍

Open browser console (F12) and check:

✅ **Should NOT see**:
- ❌ "Failed to load environment variables"
- ❌ "Clerk publishable key is missing"
- ❌ "API base URL not configured"
- ❌ Any red errors

✅ **May see** (expected):
- ℹ️ React development mode warnings (normal)
- ℹ️ Clerk initialization logs (normal)

---

## Testing Phase 1 Completion

### Test 1: Backend Health Check
Open browser or use curl:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2026-01-11T..."
}
```

### Test 2: Frontend Loads
Navigate to: http://localhost:5173/

Expected:
- Landing page loads
- No console errors
- Navigation works

### Test 3: Clerk Authentication (Basic)
Click on "Login" or "Sign Up" button

Expected:
- Clerk modal/form appears
- No errors in console

---

## Common Issues & Solutions

### Issue 1: "Port 3000 already in use"
**Solution**: 
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=3001
```

### Issue 2: "Clerk publishable key is invalid"
**Solution**: 
- Go to Clerk dashboard: https://dashboard.clerk.com
- Copy the publishable key from your project
- Update frontend/.env

### Issue 3: "Cannot connect to database"
**Solution**:
- Verify DATABASE_URL in backend/.env
- Check Supabase connection string
- Test database connection

### Issue 4: Frontend shows network error
**Solution**:
- Verify backend is running on port 3000
- Check VITE_API_BASE_URL doesn't have trailing slash
- Open Network tab in browser DevTools

---

## Phase 1 Completion Checklist ✅

- [ ] Backend `.env` verified
- [ ] Frontend `.env` updated with:
  - [ ] Correct API base URL
  - [ ] Clerk publishable key
  - [ ] DEV_AUTH_BYPASS set to false
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Health check endpoint works
- [ ] Landing page loads in browser
- [ ] No console errors
- [ ] Clerk authentication modal appears

---

## Next Steps

Once Phase 1 is complete:
1. Mark Phase 1 as complete in INTEGRATION_CHECKLIST.md
2. Commit your changes:
   ```bash
   git add .
   git commit -m "Phase 1: Environment & Configuration Setup Complete"
   ```
3. Move to **Phase 2: Missing Backend Endpoints**

---

## Need Help?

- Check `backend/API_DOCS.md` for API documentation
- Review `INTEGRATION_PLAN.md` for detailed phase information
- Check browser console for errors
- Review terminal logs for backend errors

---

**Phase 1 Status**: 🎯 Ready to Start
**Estimated Time**: 15-30 minutes
**Difficulty**: ⭐ Easy
