# Pomodoro Timer Feature with Time Tracking

**Date:** December 10, 2025  
**Feature:** Pomodoro timer with automatic time tracking on tasks

---

## 🎯 Feature Overview

Implemented a fully functional Pomodoro timer that:
- Allows users to start focused work sessions on any task
- Tracks time spent and completed pomodoros for each task
- Saves time automatically when sessions are completed or cancelled
- Displays time statistics on task cards
- Provides visual feedback and celebrations

---

## 🔧 Technical Implementation

### 1. **Database Changes**

**Migration Script:** `backend/migrations/add-time-tracking.js`

**New Columns on `tasks` table:**
- `time_spent` (INTEGER) - Total time spent on task in seconds
- `pomodoro_count` (INTEGER) - Number of completed pomodoro sessions

**New Table: `pomodoro_sessions`**
```sql
CREATE TABLE pomodoro_sessions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_pomodoro_sessions_task` on `task_id`
- `idx_pomodoro_sessions_user` on `user_id`

### 2. **Backend API**

**New File:** `backend/routes/pomodoro.js`

**Endpoints:**

1. **POST `/api/pomodoro/start`**
   - Starts a new pomodoro session
   - Body: `{ taskId, duration }` (duration in minutes)
   - Returns: `{ success, session, message }`

2. **POST `/api/pomodoro/complete`**
   - Marks session as completed
   - Updates task's `time_spent` and `pomodoro_count`
   - Body: `{ sessionId, taskId, actualDuration }` (actualDuration in seconds)
   - Returns: `{ success, task, message }`

3. **POST `/api/pomodoro/cancel`**
   - Cancels session but still saves partial time
   - Updates task's `time_spent` (but not `pomodoro_count`)
   - Body: `{ sessionId, taskId, actualDuration }`
   - Returns: `{ success, task, message }`

4. **GET `/api/pomodoro/history/:taskId`**
   - Retrieves last 10 completed pomodoro sessions for a task
   - Returns: `{ success, sessions }`

**Updated:** `backend/server.js` to include pomodoro routes

### 3. **Frontend Components**

**New Component:** `frontend/src/components/PomodoroTimer.jsx`

**Features:**
- Duration selection (25, 15, or 5 minutes)
- Circular progress indicator
- Start/Pause/Resume functionality
- Cancel with time saving
- Real-time countdown display
- Task information display (title, time spent, pomodoro count)

**State Management:**
- `timeLeft` - Remaining time in seconds
- `isRunning` - Timer running state
- `sessionId` - Active session ID from backend
- `duration` - Selected duration in minutes
- `showSettings` - Show/hide duration selector
- Uses refs for accurate time tracking

**Time Tracking Logic:**
- Tracks elapsed time using `startTimeRef` and `elapsedSecondsRef`
- Calculates actual duration even if user pauses/resumes
- Sends accurate time to backend on complete/cancel

**New File:** `frontend/src/components/PomodoroTimer.css`
- Circular progress ring using SVG
- Responsive design
- Themed colors for all modes

### 4. **Integration with Home Page**

**File:** `frontend/src/pages/Home.jsx`

**New Features:**
- Timer button (⏱️) on each task card
- Click to open Pomodoro timer modal
- Time statistics display on task cards:
  - Clock icon + minutes spent
  - Tomato emoji + pomodoro count
- Pomodoro completion celebration overlay

**New State:**
- `activePomodoroTask` - Currently active pomodoro task
- `showPomodoroComplete` - Show completion celebration

**New Handlers:**
- `handleStartPomodoro(task)` - Opens timer for task
- `handlePomodoroComplete()` - Shows celebration, closes timer
- `handlePomodoroCancel()` - Closes timer
- `handleUpdateTaskFromPomodoro(updatedTask)` - Updates task in state

**Updated:**
- `SortableTaskCard` component to include pomodoro button
- Task cards to display time statistics
- Modal overlay for timer

**File:** `frontend/src/pages/Home.css`
- Styles for pomodoro button
- Styles for time statistics
- Styles for pomodoro modal
- Styles for pomodoro celebration

### 5. **API Integration**

**File:** `frontend/src/utils/api.js`

**New Export:** `pomodoroAPI`
```javascript
{
  startSession(taskId, duration),
  completeSession(sessionId, taskId, actualDuration),
  cancelSession(sessionId, taskId, actualDuration),
  getHistory(taskId)
}
```

---

## 🎨 UI/UX Details

### Pomodoro Timer Design

**Header:**
- 🍅 Tomato emoji icon
- Task title
- Current statistics (time spent, pomodoros completed)

**Duration Selection (before start):**
- Three preset buttons: 25 min, 15 min, 5 min
- Active button highlighted in coral

**Timer Display:**
- Large circular progress ring
- Animated progress fill in coral
- Center: Large time display (MM:SS format)
- Status label below time

**Controls:**
- **Start/Resume Button** - Primary coral button with play icon
- **Pause Button** - Secondary button with pause icon
- **Cancel Button** - Red accent button with X icon

**Task Card Integration:**
- Timer button (⏱️) in red color
- Time stats section with border separator
- Clock icon + minutes
- Tomato emoji + count

**Celebration:**
- Full-screen overlay with red background
- Large tomato emoji (🍅)
- "Pomodoro Complete! 🎉" message
- Auto-dismisses after 3 seconds

---

## 🔄 Data Flow

### Starting a Pomodoro:
1. User clicks timer button on task card
2. Modal opens with duration selection
3. User selects duration and clicks "Start"
4. Frontend calls `pomodoroAPI.startSession()`
5. Backend creates session record
6. Timer starts counting down
7. Progress ring animates

### Completing a Pomodoro:
1. Timer reaches 00:00
2. Frontend calls `pomodoroAPI.completeSession()`
3. Backend:
   - Marks session as completed
   - Updates task `time_spent` += duration
   - Increments task `pomodoro_count`
4. Frontend:
   - Updates task in state
   - Shows celebration overlay
   - Closes timer after 3 seconds

### Cancelling a Pomodoro:
1. User clicks "Cancel" button
2. Frontend calculates actual time spent
3. Frontend calls `pomodoroAPI.cancelSession()`
4. Backend:
   - Deletes session (not completed)
   - Updates task `time_spent` += actual duration
   - Does NOT increment `pomodoro_count`
5. Frontend:
   - Updates task in state
   - Closes timer immediately

### Pausing/Resuming:
1. User clicks "Pause"
2. Timer stops, elapsed time saved in ref
3. User clicks "Resume"
4. Timer continues from where it left off
5. Accurate time tracking maintained

---

## 🧪 Testing Checklist

- [x] Start 25-minute pomodoro
- [x] Start 15-minute pomodoro
- [x] Start 5-minute pomodoro
- [x] Pause and resume timer
- [x] Complete full pomodoro
- [x] Cancel pomodoro mid-session
- [x] Time is saved on completion
- [x] Time is saved on cancellation
- [x] Pomodoro count increments only on completion
- [x] Time statistics display on task cards
- [x] Celebration shows on completion
- [x] Timer works in all themes
- [x] Multiple pomodoros on same task accumulate time
- [x] Timer modal closes properly
- [x] Task updates reflect immediately

---

## 📊 Time Tracking Details

### Time Spent (`time_spent`):
- Stored in **seconds**
- Accumulates across all sessions (completed or cancelled)
- Displayed in **minutes** on task cards
- Persists even if pomodoro is cancelled

### Pomodoro Count (`pomodoro_count`):
- Only increments on **completed** pomodoros
- Does NOT increment on cancelled sessions
- Represents successful focus sessions
- Displayed with 🍅 emoji on task cards

### Calculation Example:
```
Task: "Write documentation"

Session 1: 25 min pomodoro, completed
  → time_spent = 1500s (25min)
  → pomodoro_count = 1

Session 2: 25 min pomodoro, cancelled after 10 min
  → time_spent = 2100s (35min total)
  → pomodoro_count = 1 (unchanged)

Session 3: 15 min pomodoro, completed
  → time_spent = 3000s (50min total)
  → pomodoro_count = 2

Display: "⏱️ 50m spent  🍅 2 completed"
```

---

## 🎯 Pomodoro Technique

The implementation follows the classic Pomodoro Technique:
- **25 minutes** - Standard pomodoro (default)
- **15 minutes** - Short pomodoro for quick tasks
- **5 minutes** - Micro pomodoro for very small tasks

**Benefits:**
- Improves focus and concentration
- Reduces burnout
- Provides clear work intervals
- Tracks productivity objectively
- Encourages taking breaks

---

## 🚀 Future Enhancements

Potential improvements for future iterations:
- Break timer (5 min short break, 15 min long break)
- Auto-start breaks after pomodoro completion
- Pomodoro statistics and analytics
- Daily/weekly pomodoro goals
- Sound notifications
- Browser notifications
- Pomodoro history view
- Export time tracking data
- Integration with calendar
- Pomodoro streaks and achievements

---

## 📝 Technical Notes

### Timer Accuracy:
- Uses `setInterval` with 1-second precision
- Tracks actual elapsed time using `Date.now()`
- Compensates for JavaScript timing drift
- Ensures accurate time reporting to backend

### Session Management:
- Session created on "Start"
- Session ID stored in component state
- Session updated/deleted on complete/cancel
- Prevents orphaned sessions

### State Synchronization:
- Task state updated immediately after pomodoro
- Highlighted/frog tasks also updated
- No page refresh needed
- Optimistic UI updates

### Modal Behavior:
- Click outside to cancel (with confirmation)
- Escape key support (future enhancement)
- Prevents body scroll when open
- Proper z-index layering

---

**Status:** ✅ Complete and pushed to GitHub

