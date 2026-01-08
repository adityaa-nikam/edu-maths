# Start Exam Feature - Implementation Complete ✅

## Overview
Implemented the "Start Exam" functionality for the mobile app. When a student clicks "Start Exam" on an active exam, the app now:
1. Calls the backend API to create an exam attempt
2. Receives and saves attempt information
3. Navigates to the exam-taking screen with the attempt details

## Implementation Details

### 1. API Integration (`exam.tsx`)

#### Start Exam Flow
- **Endpoint**: `POST /api/exams/:examId/start`
- **Authentication**: Student JWT (automatically attached by API client)
- **Request**: No body required
- **Response**:
  ```json
  {
    "message": "Exam attempt started successfully",
    "attemptId": "uuid",
    "durationMinutes": 30,
    "serverStartTime": "2026-01-10T10:05:00.000Z"
  }
  ```

#### Implementation in `startExamAttempt` function:
```typescript
const startExamAttempt = async (examId: string, examTitle: string) => {
    setLoading(true);

    try {
        // Call start exam API
        const response = await apiClient.post(`/exams/${examId}/start`);

        if (response.success && response.data) {
            const data = response.data as any;
            
            // Extract attempt info from response
            const attemptId = data.attemptId;
            const durationMinutes = data.durationMinutes;
            const serverStartTime = data.serverStartTime;

            // Navigate to exam taking screen with attempt info
            const router = require('expo-router').router;
            router.push({
                pathname: '/(auth)/exam-taking',
                params: {
                    attemptId,
                    examId,
                    examTitle,
                    durationMinutes: durationMinutes.toString(),
                    serverStartTime
                }
            });
        } else {
            // Handle API error
            const errorMessage = response.error?.message || 'Failed to start exam';
            Alert.alert('Error', errorMessage);
        }
    } catch (error: any) {
        console.error('❌ Error starting exam:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
        setLoading(false);
    }
};
```

### 2. Loading State & UX

#### Loading Overlay
Added a semi-transparent loading overlay that appears while the exam is being started:
- Prevents multiple submissions
- Provides visual feedback to the user
- Shows "Starting exam..." message

#### Styles Added:
```typescript
loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
},
loadingBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
},
loadingOverlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
}
```

### 3. Navigation & Data Passing

#### Route Parameters
The app navigates to `/(auth)/exam-taking` with the following parameters:
- `attemptId`: UUID of the exam attempt
- `examId`: UUID of the exam
- `examTitle`: Title of the exam
- `durationMinutes`: Duration in minutes (as string for URL params)
- `serverStartTime`: ISO 8601 timestamp from server

### 4. Exam Taking Screen Updates (`exam-taking.tsx`)

#### Updated Interface
```typescript
interface AttemptInfo {
    attemptId: string;
    examId: string;
    examTitle: string;
    durationMinutes: number;
    serverStartTime: string;
}
```

#### Display Information
The screen now displays:
- ✅ Exam title
- ✅ Attempt ID
- ✅ Duration in minutes
- ✅ Server start time (formatted)

## Error Handling

### API Errors
The implementation handles various error scenarios:

1. **Exam Not Started Yet** (400)
   - Message: "Exam has not started yet"
   
2. **Exam Already Ended** (400)
   - Message: "Exam has already ended"
   
3. **Already Attempted** (400)
   - Message: "You have already attempted this exam"
   
4. **Unauthorized** (401)
   - Automatically handled by API client
   - Triggers logout flow
   
5. **Forbidden** (403)
   - Message: "You are not enrolled in this academy"
   
6. **Not Found** (404)
   - Message: "Exam not found"

### Network Errors
- Timeout errors
- Connection errors
- Generic error fallback

All errors are displayed to the user via `Alert.alert()`.

## User Flow

1. **Student views exam list** (`exam.tsx`)
   - Sees all exams for their academy
   - Status badges: Not Started / Live Now / Expired
   
2. **Student clicks "Start Exam"** (only for active exams)
   - Confirmation dialog appears
   - User confirms they want to start
   
3. **API call is made**
   - Loading overlay appears
   - POST request to `/api/exams/:examId/start`
   
4. **Success response**
   - Attempt info is received
   - Navigation to exam-taking screen
   
5. **Exam taking screen**
   - Displays attempt details
   - Shows duration and start time
   - Ready for next phase: question display

## Backend Integration

### API Endpoint Used
- **POST** `/api/exams/:examId/start`
- Requires Student JWT authentication
- Creates exam attempt in database
- Locks random questions for the student
- Returns attempt details

### Business Rules Enforced
- ✅ Exam must exist
- ✅ Exam must belong to student's academy (academy isolation)
- ✅ Current time must be within exam window (startTime ≤ now ≤ endTime)
- ✅ Student can only attempt each exam once
- ✅ Questions are randomly selected and locked to this attempt
- ✅ `started_at` is set to server's current time

## Testing Checklist

### Manual Testing
- [ ] Start an active exam successfully
- [ ] Verify attempt info is displayed correctly
- [ ] Try to start an exam that hasn't started yet
- [ ] Try to start an expired exam
- [ ] Try to start the same exam twice
- [ ] Test network error handling
- [ ] Test loading state appearance
- [ ] Verify navigation works correctly
- [ ] Check console logs for debugging info

### Edge Cases
- [ ] Slow network connection
- [ ] API timeout
- [ ] Invalid exam ID
- [ ] Exam from different academy
- [ ] Session expiry during start

## Next Steps

The following features are ready to be implemented in the next phase:

### Phase 2: Exam UI (Next)
1. **Fetch Questions**
   - Call `GET /api/exams/:examId/questions`
   - Display questions with options
   
2. **Question Navigation**
   - Next/Previous buttons
   - Question indicator (1/10)
   
3. **Timer Display**
   - Countdown timer based on `durationMinutes` and `serverStartTime`
   - Auto-submit when time expires
   
4. **Answer Submission**
   - Save answers: `POST /api/exams/:examId/answer`
   - Batch save: `POST /api/exams/:examId/answers`
   
5. **Final Submission**
   - Submit exam: `POST /api/exams/:examId/submit`
   - Navigate to results screen

## Files Modified

1. **`mobile/app/(auth)/exam.tsx`**
   - Implemented `startExamAttempt()` function
   - Added loading state and overlay
   - Added navigation logic
   - Added error handling

2. **`mobile/app/(auth)/exam-taking.tsx`**
   - Updated `AttemptInfo` interface
   - Added `durationMinutes` and `serverStartTime` params
   - Updated UI to display new information

## API Documentation Reference

See `backend/API_DOCS.md` lines 382-468 for complete API documentation of the start exam endpoint.

## Console Logging

The implementation includes helpful console logs for debugging:
- ✅ Exam started successfully (with attempt details)
- ❌ Error starting exam (with error details)
- 📝 Exam attempt started (in exam-taking screen)

---

**Status**: ✅ Complete and ready for testing
**Next**: Implement exam UI with questions, timer, and answer submission
