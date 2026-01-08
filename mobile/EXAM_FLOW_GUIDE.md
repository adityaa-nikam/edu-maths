# Complete Exam Flow - Visual Guide

## 🎯 Full User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                     STUDENT LOGIN                            │
│  • Enter academy slug, username, password                   │
│  • Receive JWT token                                         │
│  • Navigate to authenticated area                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     ACADEMY HOME                             │
│  • Display academy name and logo                             │
│  • Show welcome message                                      │
│  • Navigate to Exams tab                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     EXAM LIST                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Monthly Abacus Test              [Live Now]           │  │
│  │ Difficulty: MEDIUM                                    │  │
│  │ Start: Jan 7, 2026 10:00 AM                          │  │
│  │ End: Jan 7, 2026 10:30 AM                            │  │
│  │                                                       │  │
│  │              [Start Exam] ← Click here               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Weekly Practice                  [Not Started]        │  │
│  │ Difficulty: EASY                                      │  │
│  │ Start: Jan 8, 2026 2:00 PM                           │  │
│  │                                                       │  │
│  │              [Not Started Yet]                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CONFIRMATION DIALOG                             │
│                                                              │
│  Ready to start "Monthly Abacus Test"?                       │
│                                                              │
│  Once started, the timer will begin.                         │
│                                                              │
│           [Cancel]          [Start]                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              LOADING OVERLAY                                 │
│                                                              │
│                    ⏳ Loading...                             │
│                Starting exam...                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   API: POST /exams/:id/start
                   Returns: attemptId, duration, startTime
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              EXAM TAKING SCREEN                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Monthly Abacus Test                    ⏱️ 29:45        │ │
│ │ MEDIUM                                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │         Question 1 of 10                                │ │
│ │ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 10%          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │  What is 15 + 27?                                       │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ A. 32                                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ◉ B. 42  ← Selected (blue background)                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ C. 52                                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ D. 62                                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  [← Previous]              [Next →]                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              [Submit Exam]                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
              Student clicks "Submit Exam"
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              SUBMIT CONFIRMATION                             │
│                                                              │
│  Are you sure you want to submit?                           │
│  You cannot change answers after submission.                │
│                                                              │
│           [Cancel]          [Submit]                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   API: POST /exams/:id/submit
                   Returns: score, percentage, etc.
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              RESULTS SCREEN                                  │
│                                                              │
│  🎉 Exam Completed!                                          │
│                                                              │
│  Score: 8/10                                                 │
│  Percentage: 80%                                             │
│                                                              │
│           [Return to Home]                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Auto-Submit Flow (Timer Expires)

```
┌─────────────────────────────────────────────────────────────┐
│              EXAM TAKING SCREEN                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Monthly Abacus Test                    ⏱️ 04:30 🔴     │ │
│ │ MEDIUM                          (Warning: < 5 min)      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Timer continues counting down...                            │
│                                                              │
│  04:29... 04:28... 04:27...                                  │
│  ...                                                         │
│  00:03... 00:02... 00:01... 00:00                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Timer reaches 00:00
                   Auto-submit triggered
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              SUBMITTING OVERLAY                              │
│                                                              │
│                    ⏳ Loading...                             │
│                Submitting exam...                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   API: POST /exams/:id/submit
                   Returns: autoSubmitted: true
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              RESULTS SCREEN                                  │
│                                                              │
│  ⏰ Time Expired - Auto Submitted                            │
│                                                              │
│  Score: 6/10                                                 │
│  Percentage: 60%                                             │
│                                                              │
│           [Return to Home]                                   │
└─────────────────────────────────────────────────────────────┘
```

## 📊 State Transitions

### Question Navigation State
```
Question 1:  [Previous: DISABLED] [Next: ENABLED]
Question 5:  [Previous: ENABLED]  [Next: ENABLED]
Question 10: [Previous: ENABLED]  [Next: DISABLED]
```

### Timer States
```
30:00 → Normal (white background)
05:00 → Warning (red background)
00:00 → Auto-submit triggered
```

### Answer Selection State
```
Unselected: ○ White background, gray border
Selected:   ◉ Blue background, blue border, filled circle
```

## 🔌 API Call Sequence

### 1. Start Exam
```
POST /api/exams/:examId/start
↓
Response: { attemptId, durationMinutes, serverStartTime }
↓
Navigate to exam-taking screen
```

### 2. Load Questions
```
GET /api/exams/:examId/questions
↓
Response: { questions: [...], totalQuestions, ... }
↓
Display first question
Start timer
```

### 3. Answer Questions (Auto-save)
```
User selects option
↓
Update local state immediately
↓
POST /api/exams/:examId/answer
Body: { questionId, selectedOption }
↓
Silent save (no user notification)
```

### 4. Submit Exam
```
User clicks Submit (or timer expires)
↓
POST /api/exams/:examId/submit
↓
Response: { score, totalQuestions, percentage, autoSubmitted }
↓
Navigate to results screen
```

## 🎨 UI Components Breakdown

### Header Component
- Exam title (left)
- Difficulty badge (left, below title)
- Timer (right, large and prominent)
- Blue background (#007AFF)

### Progress Component
- Question number text ("Question X of Y")
- Progress bar (blue fill)
- White background

### Question Card
- White card with shadow
- Large question text (18px)
- Rounded corners
- Padding for readability

### Option Buttons
- Radio-style circles
- A, B, C, D labels
- Touch-friendly size
- Visual feedback on selection

### Navigation Bar
- Two equal-width buttons
- Previous (left) / Next (right)
- Disabled state (gray)
- Fixed to bottom

### Submit Button
- Green background (#34c759)
- Full width
- Prominent placement
- Loading state support

## 🔐 Security & Validation

### Client-Side
- ✅ Validate exam data before display
- ✅ Prevent navigation to invalid questions
- ✅ Disable buttons appropriately
- ✅ Confirm before destructive actions

### Server-Side (Backend handles)
- ✅ Verify student owns the attempt
- ✅ Check exam time window
- ✅ Validate question belongs to exam
- ✅ Prevent duplicate submissions
- ✅ Academy isolation

## 📱 Responsive Behavior

### Portrait Mode (Primary)
- Full-screen layout
- Scrollable question area
- Fixed header and navigation
- Optimized for one-handed use

### Landscape Mode
- Same layout (no special handling in MVP)
- Future: Side-by-side question/options

## ⚡ Performance Metrics

### Load Times
- Question fetch: < 1s
- Answer save: < 500ms (background)
- Submit: < 2s

### UI Responsiveness
- Answer selection: Instant feedback
- Navigation: Instant transition
- Timer update: Every 1 second

## 🐛 Error Scenarios

### Network Errors
```
Question fetch fails
↓
Show error alert
↓
Navigate back to exam list
```

### Answer save fails
```
Auto-save fails
↓
Log error silently
↓
Continue exam (will save on submit)
```

### Submit fails
```
Submit API fails
↓
Show error alert
↓
Keep user on exam screen
↓
Allow retry
```

---

**Complete Flow**: Login → Exam List → Start Exam → Take Exam → Submit → Results ✅
