# Phase 3: Teacher Authentication Testing Guide

## 🎯 What We're Testing

1. Clerk authentication setup
2. Token flow to backend
3. Protected routes
4. User data persistence
5. Academy data flow

---

## ✅ Testing Checklist

### Test 1: Landing Page & Initial Load
**Steps:**
1. Open browser: http://localhost:5173/
2. Open DevTools (F12) → Console tab
3. Check for errors

**Expected:**
- ✅ Landing page loads without errors
- ✅ No red errors in console
- ✅ Clerk initialization messages (if any)

**Common Issues:**
- ❌ "Clerk publishable key is missing" → Check `.env` file
- ❌ Network errors → Backend not running

---

### Test 2: Teacher Sign Up Flow
**Steps:**
1. Click "Sign Up" or "Get Started" button
2. Clerk sign-up modal should appear
3. Create a new account:
   - Email: test-teacher@example.com
   - Password: TestPassword123!
4. Complete sign-up process

**Expected:**
- ✅ Clerk sign-up form appears
- ✅ Can enter email and password
- ✅ After sign-up, redirected to create-academy page
- ✅ Console shows: "✅ Found existing academy from backend" or redirect

**Common Issues:**
- ❌ Modal doesn't appear → Clerk key issue
- ❌ Stuck on loading → Backend not responding

---

### Test 3: Backend Token Verification
**Steps:**
1. After successful sign-up/login
2. Open DevTools → Network tab
3. Look for API calls
4. Check `/api/auth/me` request
5. Click on request → Headers tab
6. Look for "Authorization" header

**Expected:**
- ✅ `Authorization: Bearer eyJhbGci...` header present
- ✅ Response status: 200 OK
- ✅ Response body: `{"success": true, "userId": "..."}`

**Common Issues:**
- ❌ No Authorization header → Token not being sent
- ❌ 401 Unauthorized → Clerk keys mismatch
- ❌ Network error → Backend not running

---

### Test 4: Academy Creation (New Teacher)
**Steps:**
1. If redirected to `/create-academy`
2. Fill out academy form:
   - Name: "Test Academy"
   - Slug: "test-academy-123"
3. Submit form

**Expected:**
- ✅ Form submits successfully
- ✅ Success notification appears
- ✅ Redirected to dashboard: `/test-academy-123/dashboard`
- ✅ Academy data saved in localStorage

**Check in DevTools:**
```javascript
// In Console, check:
localStorage.getItem('teacher_academy_user_xxx')
// Should show academy data
```

**Common Issues:**
- ❌ Slug already taken → Use unique slug
- ❌ 403 Forbidden → Token not valid

---

### Test 5: Teacher Login (Existing Account)
**Steps:**
1. Sign out (if signed in)
2. Go to `/login`
3. Sign in with existing credentials
4. Should redirect to dashboard

**Expected:**
- ✅ Login form appears
- ✅ Can sign in successfully
- ✅ Redirected to dashboard
- ✅ Academy data loaded from localStorage or backend

**Common Issues:**
- ❌ Redirected to create-academy → Academy not found
- ❌ Stuck on login → Token issue

---

### Test 6: Protected Route Access
**Steps:**
1. Sign out completely
2. Try to access: `http://localhost:5173/test-academy-123/dashboard`
3. Should redirect to login

**Expected:**
- ✅ Immediately redirected to `/login`
- ✅ Cannot access dashboard without auth

**Then:**
1. Sign in again
2. Should redirect back to dashboard

---

### Test 7: Token Persistence
**Steps:**
1. Sign in to dashboard
2. Refresh the page (F5)
3. Wait for page to load

**Expected:**
- ✅ Still logged in after refresh
- ✅ Dashboard loads correctly
- ✅ No redirect to login

**Common Issues:**
- ❌ Logged out after refresh → Token not persisting
- ❌ Redirect to login → Session expired

---

### Test 8: API Calls with Token
**Steps:**
1. Signed in as teacher
2. Open DevTools → Network tab
3. Try to create a student or exam (any API call)
4. Check request headers

**Expected:**
- ✅ All API calls include `Authorization: Bearer ...` header
- ✅ Backend accepts the token
- ✅ No 401 errors

---

## 🐛 Debugging Console Commands

Open browser console (F12) and run these:

### Check if Clerk is loaded:
```javascript
window.Clerk
// Should return Clerk object
```

### Check current session:
```javascript
window.Clerk.session
// Should show session object if logged in
```

### Get current token:
```javascript
await window.Clerk.session.getToken()
// Should return JWT token string
```

### Check teacher data:
```javascript
localStorage.getItem('teacher_data')
// Should show teacher info
```

### Check academy data:
```javascript
Object.keys(localStorage).filter(k => k.startsWith('teacher_academy'))
// Should show academy key(s)
```

### Test API call manually:
```javascript
const token = await window.Clerk.session.getToken();
fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json()).then(console.log);
// Should return: {success: true, userId: "..."}
```

---

## ✅ Phase 3 Success Criteria

All of these should be ✅:

- [ ] Teacher can sign up successfully
- [ ] Teacher can log in successfully
- [ ] Clerk modal appears and works
- [ ] Token is sent in API requests
- [ ] `/api/auth/me` returns success
- [ ] Protected routes redirect when not logged in
- [ ] Protected routes allow access when logged in
- [ ] Academy data persists after refresh
- [ ] No console errors
- [ ] Network tab shows Authorization headers

---

## 🎯 Next Steps After Phase 3

Once all tests pass:
1. Mark Phase 3 complete in checklist
2. Commit your progress
3. Move to Phase 4: Academy Management

---

## 📞 Need Help?

### Clerk Dashboard
- URL: https://dashboard.clerk.com
- Check your app settings
- Verify API keys
- Check allowed callback URLs

### Common Fixes

**Problem: Clerk key invalid**
```bash
# In frontend/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
# Get correct key from Clerk dashboard
```

**Problem: Backend not receiving token**
```javascript
// Check in frontend/src/services/api.js
// Verify request interceptor is working
```

**Problem: 401 errors**
```bash
# In backend/.env
CLERK_SECRET_KEY=sk_test_...
# Must match Clerk dashboard
```

---

**Ready to test?** Open http://localhost:5173/ and start with Test 1!
