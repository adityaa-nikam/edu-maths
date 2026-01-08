# Exam List Feature - Complete ✅

## Overview

Implemented exam list fetching and display on the Exam screen with real-time status calculation and conditional action buttons.

## API Integration

### Endpoint
```
GET /api/exams/academy/:academySlug
```

### Request
```typescript
const response = await apiClient.get(`/exams/academy/${student.academySlug}`);
```

### Response (Success)
```json
{
  "exams": [
    {
      "id": "uuid",
      "title": "Monthly Abacus Test - January",
      "difficulty": "easy",
      "startTime": "2026-01-10T10:00:00Z",
      "endTime": "2026-01-10T10:30:00Z"
    }
  ]
}
```

## Features Implemented

### 1. **Exam List Display**
- Fetches exams on screen mount
- Shows all exams for student's academy
- Empty state when no exams available
- Pull-to-refresh functionality

### 2. **Exam Status Calculation**
- **Not Started**: Current time < start time
- **Live Now**: Current time between start and end
- **Expired**: Current time > end time
- Real-time status badges with color coding

### 3. **Exam Card Information**
- ✅ Title
- ✅ Difficulty (Easy/Medium/Hard)
- ✅ Status badge (Not Started/Live Now/Expired)
- ✅ Start time
- ✅ End time
- ✅ Action button (conditional)

### 4. **Conditional Action Buttons**

**Live Now (Active):**
- Green "Start Exam" button
- Clickable, shows confirmation dialog
- Ready to start exam attempt

**Not Started:**
- Gray disabled button
- Shows "Not Started Yet"
- Not clickable

**Expired:**
- Gray disabled button
- Shows "Exam Ended"
- Not clickable

### 5. **Loading States**
- Initial loading spinner
- "Loading exams..." text
- Pull-to-refresh indicator

### 6. **Error Handling**
- Error message display
- Retry button
- Network error handling
- Empty state handling

## User Flow

```
1. Navigate to Exam tab
   ↓
2. Loading spinner shows
   ↓
3. API call: GET /api/exams/academy/:slug
   ↓
4. Exams displayed with status
   ├─ Live Now → Green "Start Exam" button
   ├─ Not Started → Gray "Not Started Yet"
   └─ Expired → Gray "Exam Ended"
   ↓
5. User taps "Start Exam" (if live)
   ↓
6. Confirmation dialog
   ↓
7. Start exam attempt
   (Coming soon: Exam taking interface)
```

## Status Logic

### Status Calculation
```typescript
const getExamStatus = (exam: Exam): ExamStatus => {
  const now = new Date();
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);

  if (now < startTime) {
    return 'not_started';  // Future exam
  } else if (now >= startTime && now <= endTime) {
    return 'active';       // Ongoing exam
  } else {
    return 'expired';      // Past exam
  }
};
```

### Status Colors
| Status | Color | Badge Text |
|--------|-------|------------|
| Active | Green (#34c759) | "Live Now" |
| Not Started | Blue (#007AFF) | "Not Started" |
| Expired | Gray (#999) | "Expired" |

### Difficulty Colors
| Difficulty | Color |
|------------|-------|
| Easy | Green (#34c759) |
| Medium | Orange (#ff9500) |
| Hard | Red (#ff3b30) |

## UI Components

### Exam Card Layout

```
┌──────────────────────────────────────┐
│ Exam Title              [Live Now]   │
├──────────────────────────────────────┤
│ Difficulty: EASY                     │
│ Start: 1/10/2026, 10:00 AM          │
│ End: 1/10/2026, 10:30 AM            │
├──────────────────────────────────────┤
│        [Start Exam]                  │
└──────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────┐
│                                      │
│        📝 No exams available         │
│   Check back later for upcoming     │
│              exams                   │
│                                      │
└──────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────┐
│                                      │
│           [Spinner]                  │
│       Loading exams...               │
│                                      │
└──────────────────────────────────────┘
```

## State Management

```typescript
const [exams, setExams] = useState<Exam[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### State Flow

```
Initial:
  loading: true
  exams: []
  error: null

Fetching:
  loading: true
  exams: []
  error: null

Success:
  loading: false
  exams: [...]
  error: null

Error:
  loading: false
  exams: []
  error: "Failed to load exams"

Refreshing:
  loading: false
  refreshing: true
  exams: [...]  // Keep existing data
  error: null
```

## Pull-to-Refresh

```typescript
<ScrollView
  refreshControl={
    <RefreshControl 
      refreshing={refreshing} 
      onRefresh={onRefresh} 
    />
  }
>
```

**Usage:**
1. Pull down on exam list
2. Refreshing indicator shows
3. Fetches latest exams
4. Updates list

## Start Exam Flow

```typescript
const handleStartExam = async (exam: Exam) => {
  // 1. Check status
  if (status !== 'active') {
    Alert.alert('Cannot Start', 'This exam is not currently active');
    return;
  }

  // 2. Show confirmation
  Alert.alert(
    'Start Exam',
    `Ready to start "${exam.title}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: () => startExamAttempt(exam.id) }
    ]
  );
};
```

## Academy Slug Storage

### Updated Student Interface
```typescript
interface Student {
  id: string;
  username: string;
  academyId: string;
  academyName: string;
  academySlug: string;  // NEW - for API calls
}
```

### Stored During Login
```typescript
await login({
  id: student.id,
  username: student.username,
  academyId: student.academyId,
  academyName: student.academyName,
  academySlug: academySlug,  // From login params
}, token);
```

### Used in Exam Screen
```typescript
const response = await apiClient.get(
  `/exams/academy/${student.academySlug}`
);
```

## Testing

### Test Exam List

1. **Login to app**
2. **Navigate to Exam tab**
3. **Expected**:
   - Loading spinner shows
   - Exams list appears
   - Each exam shows title, difficulty, times
   - Status badges show correct status
   - Action buttons show based on status

### Test Pull-to-Refresh

1. **On Exam tab**
2. **Pull down list**
3. **Expected**:
   - Refresh indicator shows
   - List updates with latest data

### Test Empty State

1. **Login to academy with no exams**
2. **Navigate to Exam tab**
3. **Expected**:
   - "No exams available" message
   - "Check back later" subtext

### Test Start Exam

1. **Find exam with "Live Now" status**
2. **Tap "Start Exam"**
3. **Expected**:
   - Confirmation dialog appears
   - Shows exam title
   - "Cancel" and "Start" options

### Test Status Badges

**Create test exams with different times:**
- Future exam → Blue "Not Started"
- Current exam → Green "Live Now"
- Past exam → Gray "Expired"

## Error Handling

| Scenario | Display |
|----------|---------|
| No academy slug | "Academy information not available" |
| Network error | "Unable to connect to server" |
| API error | Error message from API |
| Empty list | "No exams available" |

## Code Examples

### Fetch Exams
```typescript
const fetchExams = async () => {
  const response = await apiClient.get(
    `/exams/academy/${student.academySlug}`
  );

  if (response.success) {
    setExams(response.data.exams || []);
  } else {
    setError(response.error?.message);
  }
};
```

### Render Exam Card
```typescript
exams.map((exam) => {
  const status = getExamStatus(exam);
  return (
    <View style={styles.examCard}>
      <Text>{exam.title}</Text>
      <Badge status={status} />
      <Details exam={exam} />
      <ActionButton status={status} exam={exam} />
    </View>
  );
})
```

## Next Steps

### Immediate
- ✅ Exam list fetching complete
- ✅ Status calculation complete
- ✅ Conditional buttons complete
- ✅ Pull-to-refresh complete

### Future
- ⏳ Implement exam start API call
- ⏳ Navigate to exam taking screen
- ⏳ Show exam timer
- ⏳ Display questions
- ⏳ Submit answers

## Benefits

### For Students
- ✅ See all available exams
- ✅ Know which exams are live
- ✅ See exam schedules
- ✅ Start exams when ready
- ✅ Pull to refresh for updates

### For Developers
- ✅ Uses centralized API client
- ✅ Proper state management
- ✅ Real-time status calculation
- ✅ Clean code structure
- ✅ Type-safe responses

---

**Status**: ✅ Exam List Feature Complete  
**Date**: 2026-01-07  
**API**: GET /api/exams/academy/:slug  
**Ready for**: Exam taking implementation
