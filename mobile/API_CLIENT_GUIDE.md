# API Client Usage Guide

## Quick Start

### Import the API Client

```typescript
import { apiClient } from '../services/api';
import { useAuth } from '../store/AuthContext';
```

### Making Requests

#### GET Request
```typescript
const response = await apiClient.get('/exams/academy/aditya-academy');

if (response.success) {
  const exams = response.data.exams;
  // Use the data
} else {
  Alert.alert('Error', response.error?.message);
}
```

#### POST Request
```typescript
const response = await apiClient.post('/exams/123/answer', {
  questionId: 'q1',
  selectedOption: 2
});

if (response.success) {
  console.log('Answer saved');
}
```

#### PUT Request
```typescript
const response = await apiClient.put('/profile', {
  name: 'New Name'
});
```

#### DELETE Request
```typescript
const response = await apiClient.delete('/resource/123');
```

## Common Patterns

### Pattern 1: Fetch Data on Mount

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export default function ExamScreen() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    const response = await apiClient.get('/exams/academy/my-academy');
    
    if (response.success) {
      setExams(response.data.exams);
    } else {
      Alert.alert('Error', response.error?.message);
    }
    
    setLoading(false);
  };

  // Render UI
}
```

### Pattern 2: Submit Form Data

```typescript
const handleSubmit = async () => {
  setLoading(true);

  const response = await apiClient.post('/students/login', {
    academySlug,
    username,
    password
  });

  if (response.success) {
    // Handle success
    await login(response.data.student, response.data.token);
  } else {
    // Handle error
    Alert.alert('Login Failed', response.error?.message);
  }

  setLoading(false);
};
```

### Pattern 3: Handle Loading & Errors

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);

  const response = await apiClient.get('/endpoint');

  if (response.success) {
    setData(response.data);
  } else {
    setError(response.error?.message || 'An error occurred');
  }

  setLoading(false);
};

// In render
if (loading) return <ActivityIndicator />;
if (error) return <Text>Error: {error}</Text>;
if (!data) return <Text>No data</Text>;
return <View>{/* Render data */}</View>;
```

## Authentication

### Check Auth State

```typescript
import { useAuth } from '../store/AuthContext';

export default function MyScreen() {
  const { isAuthenticated, student, logout } = useAuth();

  if (!isAuthenticated) {
    return <Text>Please login</Text>;
  }

  return (
    <View>
      <Text>Welcome, {student?.username}!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

### Access Student Data

```typescript
const { student } = useAuth();

console.log(student?.id);
console.log(student?.username);
console.log(student?.academyId);
console.log(student?.academyName);
```

## Error Handling

### Check Response Status

```typescript
const response = await apiClient.get('/endpoint');

if (response.success) {
  // Success
  console.log(response.data);
} else {
  // Error
  const { error, message, statusCode } = response.error || {};
  
  if (statusCode === 401) {
    // Already handled by global 401 handler
    // User will be logged out automatically
  } else if (statusCode === 404) {
    Alert.alert('Not Found', message);
  } else {
    Alert.alert('Error', message);
  }
}
```

### Handle Network Errors

```typescript
const response = await apiClient.get('/endpoint');

if (!response.success) {
  const errorType = response.error?.error;
  
  if (errorType === 'Network Error') {
    Alert.alert('No Connection', 'Please check your internet connection');
  } else if (errorType === 'Timeout') {
    Alert.alert('Timeout', 'Request took too long. Please try again.');
  } else {
    Alert.alert('Error', response.error?.message);
  }
}
```

## Best Practices

### ✅ DO

```typescript
// Use the centralized API client
const response = await apiClient.get('/endpoint');

// Check response.success before using data
if (response.success) {
  useData(response.data);
}

// Show user-friendly error messages
Alert.alert('Error', response.error?.message);

// Use loading states
setLoading(true);
await apiClient.get('/endpoint');
setLoading(false);
```

### ❌ DON'T

```typescript
// Don't use fetch directly
const response = await fetch('http://...');

// Don't manually add auth headers
headers: { 'Authorization': `Bearer ${token}` }

// Don't handle 401 in every screen
if (response.status === 401) { logout(); }

// Don't ignore errors
const data = response.data; // What if response.success is false?
```

## TypeScript Support

### Type Your Responses

```typescript
interface Exam {
  id: string;
  title: string;
  difficulty: string;
}

interface ExamsResponse {
  exams: Exam[];
}

const response = await apiClient.get<ExamsResponse>('/exams/academy/slug');

if (response.success) {
  // response.data is typed as ExamsResponse
  const exams: Exam[] = response.data.exams;
}
```

## Debugging

### Enable Console Logs

The API client automatically logs:
- ✅ Session restoration
- ✅ Login/logout events
- ✅ 401 responses
- ✅ Token storage

Check console for:
```
✅ Session restored: student1
🔒 Unauthorized (401) - Token invalid or expired
🔒 Auto-logout triggered by 401 response
```

### Test API Calls

Use the API test screen:
```
Navigate to /api-test
Tap "Test Connection"
```

## Common Endpoints

### Student Login
```typescript
POST /students/login
Body: { academySlug, username, password }
```

### Get Exams
```typescript
GET /exams/academy/:academySlug
```

### Get Exam Status
```typescript
GET /exams/:examId/status
```

### Start Exam
```typescript
POST /exams/:examId/start
```

### Get Questions
```typescript
GET /exams/:examId/questions
```

### Submit Answer
```typescript
POST /exams/:examId/answer
Body: { questionId, selectedOption }
```

### Submit Exam
```typescript
POST /exams/:examId/submit
```

---

**Remember**: The API client handles JWT attachment and 401 responses automatically. Just focus on your feature logic!
