# Clerk JWT Template Testing Guide (Postman)

## Problem Statement

When testing Clerk-protected APIs in Postman, the default session JWT does NOT include custom claims (like `role`, `academyId`, etc.) that are defined in JWT templates.

**Why?**
- Clerk's JWT templates are NOT applied automatically
- Only the backend server can request a JWT using a specific template
- Copying tokens from Clerk Dashboard gives you DEFAULT JWTs only
- Postman cannot directly request templated JWTs from Clerk

## Solution

We've created a development-only backend endpoint that:
1. Receives a session ID from Postman
2. Requests a JWT from Clerk using your custom template
3. Returns the JWT with custom claims to Postman

---

## Step-by-Step Usage

### Step 1: Get a Session ID from Clerk

You need an active Clerk session ID. You can get this by:

**Option A: Via Clerk API**
```bash
# Login and get session
POST https://api.clerk.com/v1/client/sessions
```

**Option B: Via Clerk Dashboard**
1. Go to Clerk Dashboard → Users
2. Find your test user
3. Click on the user
4. Go to "Sessions" tab
5. Copy an active session ID (starts with `sess_`)

**Option C: Get all sessions for a user**
```bash
GET https://api.clerk.com/v1/sessions?user_id=user_xxxxx
Authorization: Bearer YOUR_CLERK_SECRET_KEY
```

---

### Step 2: Request JWT with Template

**Endpoint:** `POST http://localhost:3000/api/auth/dev/get-clerk-token`

**Request Body:**
```json
{
  "sessionId": "sess_37fcqn91h7lIej4zRsNMe4ppukD",
  "template": "testing"
}
```

**Headers:**
```
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "JWT generated successfully using template",
  "template": "testing",
  "jwt": "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zN2ZPc0dNRTRHZTNMMzNoWkE1M2hnQ0J3dHIiLCJ0eXAiOiJKV1QifQ...",
  "expiresAt": "2026-01-05T02:15:00.000Z",
  "lifetime": "60 seconds",
  "payload": {
    "exp": 1767550880,
    "iat": 1767550820,
    "iss": "https://precise-koala-98.clerk.accounts.dev",
    "sub": "user_37fWRyAzFCstRkEbk4Rb77fdiE7",
    "sid": "sess_37fcqn91h7lIej4zRsNMe4ppukD",
    "role": "teacher",
    "academyId": "academy_123",
    ...
  },
  "usage": {
    "description": "Use this JWT in Authorization header",
    "example": "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
  }
}
```

---

### Step 3: Use JWT in Protected Routes

Copy the `jwt` value from the response and use it in your Postman requests:

**Example: Test Teacher Analytics**
```
GET http://localhost:3000/api/teacher/academy/exams
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zN2ZPc0dNRTRHZTNMMzNoWkE1M2hnQ0J3dHIiLCJ0eXAiOiJKV1QifQ...
```

---

## Postman Collection Setup

### Environment Variables

Create a Postman environment with:

```
clerk_session_id = sess_37fcqn91h7lIej4zRsNMe4ppukD
clerk_template = testing
base_url = http://localhost:3000
clerk_token = (will be set automatically)
```

### Pre-request Script (Auto Token Refresh)

Add this to your Postman collection or folder:

```javascript
// Check if token exists and is not expired
const tokenExpiry = pm.environment.get("token_expiry") || 0;
const now = Math.floor(Date.now() / 1000);

// If token doesn't exist or is about to expire (within 10 seconds)
if (!pm.environment.get("clerk_token") || tokenExpiry < now + 10) {
    console.log("Token expired or missing, requesting new token...");
    
    pm.sendRequest({
        url: pm.environment.get("base_url") + "/api/auth/dev/get-clerk-token",
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                sessionId: pm.environment.get("clerk_session_id"),
                template: pm.environment.get("clerk_template")
            })
        }
    }, function (err, response) {
        if (err) {
            console.error("Error getting token:", err);
            return;
        }
        
        const data = response.json();
        
        if (data.success) {
            pm.environment.set("clerk_token", data.jwt);
            pm.environment.set("token_expiry", data.payload.exp);
            console.log("✅ New token obtained, expires at:", data.expiresAt);
        } else {
            console.error("❌ Failed to get token:", data.message);
        }
    });
}
```

### Authorization Setup

In your Postman requests, set:

**Type:** Bearer Token  
**Token:** `{{clerk_token}}`

---

## Troubleshooting

### Issue 1: Token Expires Too Quickly (60 seconds)

**Cause:** Clerk's backend API has a hardcoded 60-second limit for tokens generated via `/sessions/{sessionId}/tokens` endpoint.

**Solution:** Use the auto-refresh script above to automatically get new tokens.

### Issue 2: Custom Claims Not in JWT

**Cause:** You're using the wrong template name or the template isn't configured correctly.

**Solution:**
1. Check your Clerk Dashboard → JWT Templates
2. Verify the template name matches exactly (case-sensitive)
3. Ensure custom claims are added to the template
4. Use the correct template name in the request

### Issue 3: Session ID Invalid

**Cause:** Session expired or doesn't exist.

**Solution:**
1. Get a fresh session ID from Clerk
2. Make sure the session is "active" status
3. Check session expiry time

### Issue 4: 403 Forbidden

**Cause:** Endpoint is disabled in production.

**Solution:** This endpoint only works in development mode. Set `NODE_ENV=development` or remove the production check.

---

## Security Notes

⚠️ **IMPORTANT:** This endpoint is for **DEVELOPMENT/TESTING ONLY**

**Why it's safe in development:**
- Only works when `NODE_ENV !== 'production'`
- Requires valid Clerk session ID
- Uses Clerk's own authentication
- No sensitive data exposed

**For production:**
- This endpoint will be automatically disabled
- Use Clerk's frontend SDK for real applications
- Implement proper OAuth flows

---

## Example Postman Requests

### 1. Get Token
```
POST http://localhost:3000/api/auth/dev/get-clerk-token
Content-Type: application/json

{
  "sessionId": "sess_37fcqn91h7lIej4zRsNMe4ppukD",
  "template": "testing"
}
```

### 2. Test Protected Route
```
GET http://localhost:3000/api/teacher/academy/exams
Authorization: Bearer {{clerk_token}}
```

### 3. Test with Different Template
```
POST http://localhost:3000/api/auth/dev/get-clerk-token
Content-Type: application/json

{
  "sessionId": "sess_37fcqn91h7lIej4zRsNMe4ppukD",
  "template": "production"
}
```

---

## How It Works (Technical)

```
┌─────────┐                ┌─────────────┐                ┌───────────┐
│ Postman │                │   Backend   │                │   Clerk   │
└────┬────┘                └──────┬──────┘                └─────┬─────┘
     │                            │                              │
     │  POST /dev/get-clerk-token │                              │
     │  { sessionId, template }   │                              │
     ├───────────────────────────>│                              │
     │                            │                              │
     │                            │  POST /sessions/{id}/tokens  │
     │                            │  { template: "testing" }     │
     │                            ├─────────────────────────────>│
     │                            │                              │
     │                            │  JWT with custom claims      │
     │                            │<─────────────────────────────┤
     │                            │                              │
     │  { jwt, payload, ... }     │                              │
     │<───────────────────────────┤                              │
     │                            │                              │
     │  Use JWT in protected APIs │                              │
     │                            │                              │
```

---

## Quick Reference

| What | Value |
|------|-------|
| Endpoint | `POST /api/auth/dev/get-clerk-token` |
| Required | `sessionId` |
| Optional | `template` (default: "testing") |
| Returns | JWT with custom claims |
| Token Lifetime | 60 seconds (Clerk limitation) |
| Environment | Development only |

---

## Next Steps

1. ✅ Get a session ID from Clerk
2. ✅ Call the dev endpoint to get JWT
3. ✅ Copy the JWT
4. ✅ Use it in Authorization header
5. ✅ Test your protected routes
6. ✅ Set up auto-refresh in Postman (optional)

**Happy Testing!** 🚀
