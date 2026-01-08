# Centralized Auth & API Client - Complete ✅

## Overview

Implemented a robust, centralized authentication and API client system with automatic JWT handling, global 401 responses, and session management.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Application                        │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐             ┌────────▼────────┐
│  AuthContext   │             │   API Client    │
│  (Auth State)  │◄───────────►│  (HTTP Layer)   │
└───────┬────────┘             └────────┬────────┘
        │                               │
        │                               │
┌───────▼────────┐             ┌────────▼────────┐
│ AsyncStorage   │             │   Backend API   │
│  (JWT Store)   │             │  (REST Server)  │
└────────────────┘             └─────────────────┘
```

## Components

### 1. **AuthContext** (`store/AuthContext.tsx`)

**Purpose**: Global authentication state management

**Features:**
- ✅ JWT-based authentication state
- ✅ Automatic session restoration on app start
- ✅ Secure token storage integration
- ✅ Global 401 handler registration
- ✅ Auto-logout on token expiration
- ✅ Loading states during session check

**State:**
```typescript
{
  isAuthenticated: boolean;    // User logged in?
  student: Student | null;     // Student data
  isLoading: boolean;          // Checking session?
}
```

**Methods:**
```typescript
login(student, token): Promise<void>   // Login user
logout(): Promise<void>                // Logout user
```

**Auto-Redirect Logic:**
```typescript
// In app/_layout.tsx
if (!isAuthenticated && inAuthGroup) {
  router.replace('/');  // → Academy Select
}
if (isAuthenticated && !inAuthGroup) {
  router.replace('/(auth)/home');  // → Home
}
```

### 2. **API Client** (`services/api.ts`)

**Purpose**: Centralized HTTP client for all API requests

**Features:**
- ✅ Automatic JWT attachment to requests
- ✅ Global 401 handling (auto-logout)
- ✅ Request timeout (30s default)
- ✅ Error handling with typed responses
- ✅ Network error detection
- ✅ Singleton pattern (one instance)

**Methods:**
```typescript
apiClient.get<T>(endpoint)
apiClient.post<T>(endpoint, body)
apiClient.put<T>(endpoint, body)
apiClient.delete<T>(endpoint)
```

**Response Type:**
```typescript
{
  success: boolean;
  data?: T;
  error?: {
    error: string;
    message: string;
    statusCode?: number;
  }
}
```

**Global 401 Handler:**
```typescript
// Automatically called when API returns 401
if (response.status === 401) {
  console.warn('🔒 Unauthorized - Token expired');
  onUnauthorizedCallback();  // → logout()
}
```

### 3. **Secure Storage** (`services/storage.ts`)

**Purpose**: Persistent storage for JWT and user data

**Features:**
- ✅ AsyncStorage wrapper
- ✅ Separate keys for token and data
- ✅ Type-safe storage/retrieval
- ✅ Error handling
- ✅ Bulk clear on logout

**Storage Keys:**
```typescript
@edu_maths_auth_token    // JWT token
@edu_maths_student_data  // Student info (JSON)
```

**Methods:**
```typescript
storeAuthToken(token)
getAuthToken()
removeAuthToken()
storeStudentData(student)
getStudentData()
clearAllData()  // Logout
```

## Data Flow

### Login Flow

```
1. User enters credentials in login.tsx
   ↓
2. Call apiClient.post('/students/login', {...})
   ↓
3. API returns { token, student }
   ↓
4. AuthContext.login(student, token)
   ├─ Store token in AsyncStorage
   ├─ Store student data in AsyncStorage
   ├─ Set apiClient.setAuthToken(token)
   └─ Update state: isAuthenticated = true
   ↓
5. Auto-navigate to /(auth)/home
```

### Authenticated Request Flow

```
1. Screen calls apiClient.get('/exams/...')
   ↓
2. API Client automatically adds header:
   Authorization: Bearer <stored_jwt>
   ↓
3. Backend validates JWT
   ├─ Valid → Return data
   └─ Invalid → Return 401
   ↓
4. If 401 received:
   ├─ API Client calls onUnauthorized callback
   ├─ AuthContext.logout() triggered
   ├─ Clear AsyncStorage
   └─ Auto-navigate to /
```

### Session Restoration Flow

```
App Start
   ↓
1. AuthContext.checkExistingSession()
   ↓
2. Read token from AsyncStorage
   ↓
3. Token exists?
   ├─ YES → Restore session
   │   ├─ Set apiClient.setAuthToken(token)
   │   ├─ Update state: isAuthenticated = true
   │   └─ Navigate to /(auth)/home
   │
   └─ NO → Show login screen
```

### Logout Flow

```
User taps Logout
   ↓
1. AuthContext.logout()
   ├─ clearAllData() → Clear AsyncStorage
   ├─ apiClient.clearAuthToken()
   └─ Update state: isAuthenticated = false
   ↓
2. Auto-navigate to /
```

## Usage in Screens

### ❌ **DON'T DO THIS** (Repeating fetch logic)

```typescript
// BAD - Direct fetch in screen
const response = await fetch('http://...', {
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});
```

### ✅ **DO THIS** (Use centralized API client)

```typescript
// GOOD - Use API client
import { apiClient } from '@services/api';

const response = await apiClient.get('/exams/123/status');

if (response.success) {
  console.log(response.data);
} else {
  Alert.alert('Error', response.error?.message);
}
```

### Example: Fetch Exams

```typescript
import { apiClient } from '../services/api';

const fetchExams = async (academySlug: string) => {
  const response = await apiClient.get(`/exams/academy/${academySlug}`);
  
  if (response.success) {
    setExams(response.data.exams);
  } else {
    Alert.alert('Error', response.error?.message);
  }
};
```

### Example: Submit Answer

```typescript
import { apiClient } from '../services/api';

const submitAnswer = async (examId: string, questionId: string, answer: number) => {
  const response = await apiClient.post(`/exams/${examId}/answer`, {
    questionId,
    selectedOption: answer,
  });
  
  if (response.success) {
    console.log('Answer saved');
  } else {
    if (response.error?.statusCode === 401) {
      // Already handled by global 401 handler
      // User will be logged out automatically
    } else {
      Alert.alert('Error', response.error?.message);
    }
  }
};
```

## Error Handling

### Network Errors
```typescript
{
  success: false,
  error: {
    error: 'Network Error',
    message: 'Unable to connect to server'
  }
}
```

### Timeout Errors
```typescript
{
  success: false,
  error: {
    error: 'Timeout',
    message: 'Request timed out. Please check your connection.'
  }
}
```

### 401 Unauthorized
```typescript
{
  success: false,
  error: {
    error: 'Unauthorized',
    message: 'Session expired. Please login again.',
    statusCode: 401
  }
}
// + Auto-logout triggered
```

### Other API Errors
```typescript
{
  success: false,
  error: {
    error: 'Bad Request',
    message: 'Invalid exam ID',
    statusCode: 400
  }
}
```

## Security Features

### ✅ Automatic JWT Attachment
- No manual header management
- Token automatically added to all requests
- Centralized token storage

### ✅ Global 401 Handling
- Automatic logout on token expiration
- No need to check 401 in every screen
- Consistent behavior across app

### ✅ Secure Storage
- JWT stored in AsyncStorage (encrypted on device)
- Separate storage for token and user data
- Automatic cleanup on logout

### ✅ Session Persistence
- User stays logged in across app restarts
- Token validated on app start
- Graceful handling of invalid tokens

## Configuration

### API Base URL
```typescript
// .env
EXPO_PUBLIC_API_BASE_URL=http://192.168.31.143:3000/api
```

### Timeout
```typescript
// .env
EXPO_PUBLIC_API_TIMEOUT=30000  // 30 seconds
```

## Testing

### Test Auto-Logout on 401

1. **Login successfully**
2. **Manually invalidate token** (delete from backend DB)
3. **Make any authenticated request** (e.g., fetch exams)
4. **Result**: Should auto-logout and redirect to login

### Test Session Persistence

1. **Login successfully**
2. **Close app** (force quit)
3. **Reopen app**
4. **Result**: Should stay logged in

### Test Network Error

1. **Turn off WiFi**
2. **Try to login**
3. **Result**: Should show "Unable to connect to server"

### Test Timeout

1. **Set very low timeout** (e.g., 1ms)
2. **Make request**
3. **Result**: Should show "Request timed out"

## Console Logs

### Successful Login
```
✅ Token stored securely
✅ Student data stored
✅ Student logged in: student1
```

### Session Restored
```
✅ Session restored: student1
```

### 401 Auto-Logout
```
🔒 Unauthorized (401) - Token invalid or expired
🔒 Auto-logout triggered by 401 response
✅ All data cleared
👋 Student logged out
```

## Benefits

### For Developers
- ✅ No repeated fetch logic
- ✅ Consistent error handling
- ✅ Type-safe responses
- ✅ Easy to test
- ✅ Single source of truth

### For Users
- ✅ Automatic session management
- ✅ Seamless login experience
- ✅ Graceful error handling
- ✅ Secure token storage

## Next Steps

### Immediate
- ✅ Auth state management complete
- ✅ API client with 401 handling complete
- ✅ Secure storage complete
- ✅ Session persistence complete

### Future Enhancements
- ⏳ Token refresh mechanism
- ⏳ Retry logic for failed requests
- ⏳ Request queuing for offline mode
- ⏳ Request caching
- ⏳ Optimistic updates

---

**Status**: ✅ Centralized Auth & API Client Complete  
**Date**: 2026-01-07  
**Ready for**: Building authenticated features
