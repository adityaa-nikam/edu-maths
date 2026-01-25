# Exam UI Testing Guide

## 🧪 Manual Testing Checklist

### Prerequisites
- ✅ Backend running on `http://localhost:3000`
- ✅ Mobile app running via Expo
- ✅ At least one active exam in the database
- ✅ Student account created and logged in

---

## Test Suite 1: Basic Functionality

### Test 1.1: Load Questions
**Steps:**
1. Navigate to Exams tab
2. Click "Start Exam" on an active exam
3. Confirm in the dialog

**Expected:**
- ✅ Loading overlay appears
- ✅ Questions load successfully
- ✅ First question is displayed
- ✅ Timer starts counting down
- ✅ Progress shows "Question 1 of X"

**Console Check:**
```
✅ Exam started successfully: { attemptId, durationMinutes, serverStartTime }
✅ Questions loaded: { totalQuestions, timeRemaining }
```

---

### Test 1.2: Select Answer
**Steps:**
1. Tap on option B

**Expected:**
- ✅ Option B is highlighted (blue background)
- ✅ Circle is filled
- ✅ Other options remain unselected

**Console Check:**
```
✅ Answer saved for question: <questionId>
```

---

### Test 1.3: Change Answer
**Steps:**
1. Select option B
2. Select option C

**Expected:**
- ✅ Option B becomes unselected
- ✅ Option C becomes selected
- ✅ Only one option selected at a time

**Console Check:**
```
✅ Answer saved for question: <questionId>
✅ Answer saved for question: <questionId>
```

---

### Test 1.4: Navigate Next
**Steps:**
1. Select an answer on question 1
2. Click "Next" button

**Expected:**
- ✅ Question 2 is displayed
- ✅ Progress shows "Question 2 of X"
- ✅ Progress bar increases
- ✅ Previous button is now enabled
- ✅ Selected answer from Q1 is saved

---

### Test 1.5: Navigate Previous
**Steps:**
1. On question 2, click "Previous"

**Expected:**
- ✅ Question 1 is displayed
- ✅ Progress shows "Question 1 of X"
- ✅ Previous button is disabled
- ✅ Previously selected answer is still selected

---

### Test 1.6: First Question State
**Steps:**
1. Navigate to question 1

**Expected:**
- ✅ Previous button is disabled (gray)
- ✅ Next button is enabled (blue)

---

### Test 1.7: Last Question State
**Steps:**
1. Navigate to the last question

**Expected:**
- ✅ Next button is disabled (gray)
- ✅ Previous button is enabled (blue)

---

## Test Suite 2: Timer Functionality

### Test 2.1: Timer Countdown
**Steps:**
1. Start exam
2. Observe timer for 60 seconds

**Expected:**
- ✅ Timer counts down every second
- ✅ Format is MM:SS (e.g., 29:59, 29:58)
- ✅ Leading zeros are present (09:05, not 9:5)

---

### Test 2.2: Timer Warning State
**Steps:**
1. Start an exam with 6 minutes duration
2. Wait until 5 minutes remaining

**Expected:**
- ✅ Timer background turns red at 05:00
- ✅ Timer remains red until 00:00

**Note:** For quick testing, you can modify the warning threshold in code:
```typescript
const isLowTime = timeRemaining <= 300; // Change to 60 for 1-minute warning
```

---

### Test 2.3: Timer Expiry (Auto-Submit)
**Steps:**
1. Start an exam with 1 minute duration
2. Wait for timer to reach 00:00

**Expected:**
- ✅ Timer reaches 00:00
- ✅ Submitting overlay appears automatically
- ✅ Exam is submitted without confirmation
- ✅ Navigate to results screen
- ✅ Results show "auto-submitted"

**Console Check:**
```
✅ Exam submitted: { score, autoSubmitted: true }
```

---

## Test Suite 3: Submission

### Test 3.1: Manual Submit
**Steps:**
1. Answer some questions
2. Click "Submit Exam" button

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Dialog shows warning about no changes after submission

---

### Test 3.2: Submit Confirmation - Cancel
**Steps:**
1. Click "Submit Exam"
2. Click "Cancel" in dialog

**Expected:**
- ✅ Dialog closes
- ✅ Remain on exam screen
- ✅ Can continue answering

---

### Test 3.3: Submit Confirmation - Confirm
**Steps:**
1. Click "Submit Exam"
2. Click "Submit" in dialog

**Expected:**
- ✅ Submitting overlay appears
- ✅ API call is made
- ✅ Navigate to results screen
- ✅ Results display correctly

**Console Check:**
```
✅ Exam submitted: { score, totalQuestions, percentage, autoSubmitted: false }
```

---

### Test 3.4: Submit with Unanswered Questions
**Steps:**
1. Answer only 5 out of 10 questions
2. Submit exam

**Expected:**
- ✅ Submission works
- ✅ Unanswered questions count as incorrect
- ✅ Score reflects answered questions only

---

## Test Suite 4: Edge Cases

### Test 4.1: Rapid Answer Changes
**Steps:**
1. Quickly tap different options multiple times

**Expected:**
- ✅ UI updates immediately
- ✅ Only last selection is highlighted
- ✅ Multiple API calls are made (check console)
- ✅ No UI glitches or freezing

---

### Test 4.2: Navigation While Saving
**Steps:**
1. Select an answer
2. Immediately click "Next"

**Expected:**
- ✅ Navigation works immediately
- ✅ Answer save happens in background
- ✅ No blocking or delay

---

### Test 4.3: Network Error During Question Fetch
**Steps:**
1. Turn off backend server
2. Start an exam

**Expected:**
- ✅ Error alert appears
- ✅ Error message is clear
- ✅ Navigate back to exam list
- ✅ No crash

---

### Test 4.4: Network Error During Answer Save
**Steps:**
1. Start exam successfully
2. Turn off backend server
3. Select an answer

**Expected:**
- ✅ UI updates immediately
- ✅ Error logged in console
- ✅ No error shown to user
- ✅ Can continue exam

**Console Check:**
```
❌ Error saving answer: <error details>
```

---

### Test 4.5: Network Error During Submit
**Steps:**
1. Answer questions
2. Turn off backend server
3. Submit exam

**Expected:**
- ✅ Error alert appears
- ✅ Remain on exam screen
- ✅ Can retry after server is back

---

### Test 4.6: Double Submit Prevention
**Steps:**
1. Click "Submit Exam"
2. Quickly click "Submit" in dialog multiple times

**Expected:**
- ✅ Only one submission occurs
- ✅ Submitting overlay prevents further clicks
- ✅ No duplicate submissions in backend

---

## Test Suite 5: UI/UX

### Test 5.1: Question Text Wrapping
**Steps:**
1. Create a question with very long text
2. View in exam

**Expected:**
- ✅ Text wraps properly
- ✅ No text cutoff
- ✅ Card expands to fit content
- ✅ Readable line spacing

---

### Test 5.2: Option Text Wrapping
**Steps:**
1. Create options with long text
2. View in exam

**Expected:**
- ✅ Text wraps properly
- ✅ Circle stays aligned to top
- ✅ No text cutoff

---

### Test 5.3: Scroll Behavior
**Steps:**
1. View a question with long text and options
2. Scroll up and down

**Expected:**
- ✅ Smooth scrolling
- ✅ Header stays fixed
- ✅ Navigation bar stays fixed
- ✅ Only question area scrolls

---

### Test 5.4: Progress Bar Accuracy
**Steps:**
1. Navigate through all questions
2. Observe progress bar

**Expected:**
- ✅ Progress bar fills proportionally
- ✅ 10% per question (for 10 questions)
- ✅ 100% on last question

---

## Test Suite 6: Data Persistence

### Test 6.1: Answer Persistence Across Navigation
**Steps:**
1. Answer Q1: Select B
2. Answer Q2: Select C
3. Navigate back to Q1

**Expected:**
- ✅ Q1 still shows B selected
- ✅ Navigate to Q2, still shows C selected

---

### Test 6.2: Answer Persistence After Save Error
**Steps:**
1. Turn off backend
2. Select an answer
3. Turn on backend
4. Navigate to next question
5. Navigate back

**Expected:**
- ✅ Answer is still selected in UI
- ✅ Answer will be saved on submit

---

## Test Suite 7: Results Integration

### Test 7.1: Navigate to Results
**Steps:**
1. Complete and submit exam
2. Check results screen

**Expected:**
- ✅ Score is displayed
- ✅ Total questions is displayed
- ✅ Percentage is displayed
- ✅ Exam title is displayed

---

### Test 7.2: Auto-Submit Flag
**Steps:**
1. Let timer expire
2. Check results screen

**Expected:**
- ✅ Results show "auto-submitted" indicator
- ✅ Score is still calculated correctly

---

## Performance Tests

### Perf 1: Initial Load Time
**Measure:**
- Time from "Start Exam" click to questions displayed

**Target:**
- < 2 seconds on good network

---

### Perf 2: Answer Selection Response
**Measure:**
- Time from tap to visual feedback

**Target:**
- Instant (< 100ms)

---

### Perf 3: Navigation Response
**Measure:**
- Time from Next/Previous click to new question

**Target:**
- Instant (< 100ms)

---

## Accessibility Tests

### A11y 1: Touch Targets
**Check:**
- All buttons are at least 44x44 points
- Options are easy to tap

---

### A11y 2: Text Readability
**Check:**
- Font sizes are readable (minimum 14px)
- Sufficient contrast ratios
- Line spacing is comfortable

---

### A11y 3: Visual Feedback
**Check:**
- Clear selected state
- Clear disabled state
- Clear loading states

---

## Regression Tests

After any code changes, run:
- ✅ Test 1.1 - 1.7 (Basic functionality)
- ✅ Test 2.1 (Timer countdown)
- ✅ Test 3.3 (Submit confirmation)
- ✅ Test 4.1 (Rapid changes)
- ✅ Test 6.1 (Answer persistence)

---

## Bug Report Template

If you find a bug, report it with:

```
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Console Logs:**
[Any relevant console output]

**Screenshots:**
[If applicable]

**Environment:**
- Device: [Android/iOS]
- Expo version: [version]
- Backend version: [version]
```

---

## ✅ Sign-off Checklist

Before marking as complete:
- [ ] All Test Suite 1 tests pass
- [ ] All Test Suite 2 tests pass
- [ ] All Test Suite 3 tests pass
- [ ] At least 3 edge cases tested
- [ ] UI looks good on different screen sizes
- [ ] No console errors during normal flow
- [ ] Performance is acceptable
- [ ] Tested with real backend data

---

**Happy Testing! 🎉**
