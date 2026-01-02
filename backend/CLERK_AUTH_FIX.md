# Clerk Authentication Implementation - Fixed

## Problem (Before)
- Used `@clerk/clerk-sdk-node` with manual JWT verification
- Used `clerkClient.verifyToken()` which is **incorrect** for JWT verification
- CLERK_SECRET_KEY was misused for JWT verification (it's for API calls, not JWT validation)
- Clerk JWTs use RS256 and require JWKS for proper verification
- Manual verification was failing with "Token verification failed"

## Solution (After)
Replaced manual verification with **official Clerk Express middleware** from `@clerk/express`.

### Changes Made

#### 1. Dependencies
```bash
npm uninstall @clerk/clerk-sdk-node
npm install @clerk/express
```

#### 2. Environment Variables
Updated `.env`:
```env
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### 3. Middleware Implementation
**File: `src/middlewares/auth.ts`**
- Removed all manual JWT verification logic
- Removed `clerkClient.verifyToken()` calls
- Implemented using Clerk's official `requireAuth()` middleware
- Middleware automatically:
  - Verifies JWT using Clerk's JWKS
  - Validates token signature (RS256)
  - Attaches `auth` object to request
  - Extracts and provides `userId`

```typescript
import { requireAuth } from '@clerk/express';

export const authenticateTeacher = [
  requireAuth(),  // Official Clerk middleware
  (req, res, next) => {
    req.clerkUserId = req.auth.userId;
    next();
  }
];
```

#### 4. App Integration
**File: `src/app.ts`**
```typescript
import { clerkMiddleware } from '@clerk/express';

app.use(clerkMiddleware());  // Global Clerk middleware
```

#### 5. Protected Routes
Routes using `authenticateTeacher` middleware now work correctly:
- `GET /api/auth/me` - Returns authenticated user ID
- `POST /api/academy/create` - Creates academy for authenticated teacher

## How JWT Verification Works Now

1. **Client sends request:**
   ```
   GET /api/auth/me
   Authorization: Bearer <CLERK_JWT>
   ```

2. **clerkMiddleware()** (global):
   - Intercepts all requests
   - Extracts JWT from Authorization header
   - Attaches auth context to request (doesn't block)

3. **requireAuth()** (route-specific):
   - Verifies JWT signature using Clerk's JWKS endpoint
   - Validates token claims (expiration, issuer, etc.)
   - Returns 401 if invalid
   - Attaches `auth` object with `userId` to request

4. **Custom middleware** (optional):
   - Extracts `userId` from `req.auth.userId`
   - Attaches to `req.clerkUserId` for convenience

5. **Route handler:**
   - Accesses authenticated user via `req.clerkUserId`
   - Proceeds with business logic

## Testing

### Test with Postman

1. **Get a Clerk JWT token** from your Clerk dashboard or frontend
2. **Make request:**
   ```
   GET http://localhost:3000/api/auth/me
   Headers:
     Authorization: Bearer <YOUR_CLERK_JWT>
   ```

3. **Expected Response (200 OK):**
   ```json
   {
     "success": true,
     "message": "Authentication successful",
     "userId": "user_xxxxxxxxxxxxx"
   }
   ```

4. **Without token (401 Unauthorized):**
   ```json
   {
     "errors": [
       {
         "message": "Unauthenticated",
         "longMessage": "Request is not authenticated",
         "code": "request_not_authenticated"
       }
     ]
   }
   ```

## Key Points

✅ **Correct approach:** Use `@clerk/express` official middleware
❌ **Wrong approach:** Manual JWT verification with `clerkClient.verifyToken()`

✅ **JWT verification:** Uses Clerk's JWKS automatically
❌ **Previous attempt:** Used CLERK_SECRET_KEY (wrong - that's for API calls)

✅ **Production-safe:** Official Clerk implementation
❌ **Previous attempt:** Custom verification logic prone to errors

## Environment Variables Usage

- **CLERK_PUBLISHABLE_KEY**: Used by frontend/middleware for public operations
- **CLERK_SECRET_KEY**: Used by Clerk SDK for backend API calls (NOT for JWT verification)
- **JWT Verification**: Uses JWKS from `https://your-instance.clerk.accounts.dev/.well-known/jwks.json`

## Summary

The authentication now works correctly using Clerk's official Express middleware, which handles all JWT verification complexity automatically using industry-standard JWKS. No custom JWT verification code is needed.
