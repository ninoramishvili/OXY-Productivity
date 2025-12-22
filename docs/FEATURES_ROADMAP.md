# OXY Productivity - Feature Roadmap & Development Phases

*Comprehensive feature plan with phases, priorities, and descriptions*
*Last Updated: December 22, 2025*

---

## 📋 Table of Contents
1. [Completed Features](#-completed-features)
2. [Next Up - Task Features](#-next-up---task-features)
3. [Habit Management (Paused)](#-habit-management-paused)
4. [Phase 4 - Analytics & Insights](#phase-4---analytics--insights)
5. [Phase 5 - Advanced Features](#phase-5---advanced-features)
6. [Recommended Next Steps](#-recommended-next-steps)

---

## ✅ COMPLETED FEATURES

### Phase 1 - MVP Core Features ✅ COMPLETE

#### 1.1 Task Management - CRUD Operations ✅
- ✅ Create new tasks with title, priority, tags
- ✅ Edit existing tasks
- ✅ Delete tasks with confirmation modal
- ✅ Mark tasks as complete/incomplete
- ✅ View task list with sorting options

#### 1.2 Task Priority System ✅ (Eisenhower-based)
- ✅ Four priority quadrants: Do First, Schedule, Delegate, Eliminate
- ✅ Visual distinction with colored badges
- ✅ Sort tasks by Eisenhower priority
- ✅ Priority selector in task modal (4 quadrant buttons)

#### 1.3 Brain Dump / To Do View ✅
- ✅ Renamed from "Backlog" to "Brain Dump"
- ✅ Info box explaining the Brain Dump method
- ✅ Only shows unprioritized tasks
- ✅ "Prioritize" button to move tasks to Eisenhower
- ✅ Search and filter functionality
- ✅ Drag-and-drop reordering
- ✅ Quick Wins section for 2-minute tasks

#### 1.4 Daily Highlight Feature ✅
- ✅ Select ONE most important task per day
- ✅ Prominently displayed section on Today view
- ✅ Special visual treatment
- ✅ Large complete button in section
- ✅ Can toggle highlight on/off

#### 1.5 Task Categories/Tags ✅
- ✅ Single tag per task (simplified from multiple)
- ✅ Color-coded tags
- ✅ Tag filter functionality
- ✅ Create custom tags in task modal
- ✅ Delete tags (removes from all tasks)

---

### Phase 2 - Productivity Techniques ✅ COMPLETE

#### 2.1 Pomodoro Timer ✅
- ✅ Classic 25 min work / 5 min break
- ✅ Visual countdown timer with progress ring
- ✅ Start/pause/cancel controls
- ✅ Link timer to specific tasks
- ✅ Short break (5 min) and long break (30 min)
- ✅ Auto long break after 4 sessions
- ✅ Manual mode switching (Focus/Short Break/Long Break)
- ✅ Floating independent timer (corner of screen)
- ✅ Different colors for modes (red/green/blue)
- ✅ Time tracking saved to tasks
- ✅ Pomodoro session count per task
- ✅ Reset Pomodoro data with confirmation

#### 2.2 Eisenhower Matrix ✅
- ✅ 2x2 matrix view with 4 quadrants
- ✅ Drag-and-drop tasks between quadrants
- ✅ Visual categorization with colors
- ✅ "Move All to Today" button
- ✅ "Send back to To Do" button per task
- ✅ Only shows prioritized, unscheduled tasks

#### 2.3 Eat That Frog ✅
- ✅ Mark hardest task as "Frog"
- ✅ Frog section on Today view
- ✅ Special celebration when completing frog
- ✅ Large complete button in section
- ✅ Can toggle frog on/off
- ✅ Frog stays visible when completed (shows "Eaten!")

#### 2.4 2-Minute Rule (Quick Wins) ✅
- ✅ Quick tasks (≤2 min) identified by time estimate
- ✅ Dedicated Quick Wins section in Daily View
- ✅ Dedicated Quick Wins section in To Do List
- ✅ Quick tasks skip Eisenhower prioritization
- ✅ Checkbox with strikethrough on completion
- ✅ Delete option for quick tasks
- ✅ Total minutes display per section
- ✅ Always visible section (even when empty)

#### 2.5 Time Blocking / Parkinson's Law ✅
- ✅ Time estimate field (estimated_minutes)
- ✅ Scheduled time field for specific time slots
- ✅ 24-hour calendar view with 30-min intervals
- ✅ Visual time blocks based on duration
- ✅ Current time indicator
- ✅ Quick navigation (Morning/Noon/Evening/Night/Now)
- ✅ Click empty slot to create task at that time
- ✅ Multiple tasks in same slot display side-by-side
- ✅ Collapsible sections (Focus, Quick Wins, Tasks)

#### 2.6 Planning Fallacy ✅
- ✅ Estimated vs actual time comparison
- ✅ Visual accuracy indicators (🎯 faster, ✅ spot on, 📊 over, 💡 under-estimated)
- ✅ Educational info panel explaining the technique
- ✅ Per-task accuracy display
- ✅ Encourages learning from estimation mistakes

---

### Phase 3 - Advanced Planning ✅ MOSTLY COMPLETE

#### 3.1 Weekly View ✅
- ✅ Week-at-a-glance calendar
- ✅ 7-day grid layout (Mon-Sun)
- ✅ Navigate between weeks
- ✅ Mini task cards per day
- ✅ Task count/stats per day
- ✅ Drag tasks between days
- ✅ Add task to specific day
- ✅ Click day to go to Daily View
- ✅ Time estimate and accuracy badges

#### 3.2 Monthly View ⏳ NOT STARTED
**Priority:** 🟢 P2 - Medium Priority
**Description:**
- Traditional month calendar
- Task dots on dates
- Monthly goals overview
- Month navigation

**Features:**
- Calendar grid (month view)
- Colored dots for tasks by priority
- Click date to see/add tasks
- Monthly summary

---

### Additional Implemented Features ✅

#### Workflow System ✅
- ✅ **Brain Dump Workflow**:
  - New tasks → Brain Dump (To Do)
  - Prioritize → Eisenhower Matrix
  - Schedule → Day View
- ✅ Tasks appear in only ONE location based on state
- ✅ Quick tasks (≤2 min) bypass Eisenhower

#### Day View / Date Navigation ✅
- ✅ View tasks for any day (Today, past, future)
- ✅ Date navigation (prev/next/today buttons)
- ✅ Tasks filtered by scheduled date
- ✅ Timezone-aware (GMT+4)
- ✅ URL parameter support (?date=YYYY-MM-DD)

#### Theme System ✅
- ✅ Dark Mode
- ✅ Light Mode  
- ✅ OXY Mode (unique coral/teal theme)
- ✅ Theme selector dropdown

#### Keyboard Shortcuts ✅
- ✅ Ctrl+Alt+N - Add new task
- ✅ Hotkey hint displayed in task modal

#### UI/UX Improvements ✅
- ✅ Drag-and-drop task reordering
- ✅ Sorting (priority, date, name)
- ✅ Custom confirmation modals
- ✅ Success messages (bottom-right)
- ✅ Schedule date field in task modal
- ✅ Clear date button
- ✅ Collapsible sidebar
- ✅ Reordered menu (To Do, Daily, Weekly, Eisenhower, Analytics)

#### Authentication ✅
- ✅ User login
- ✅ User registration
- ✅ Password visibility toggle
- ✅ Remember Me checkbox
- ✅ Session management

---

## 🔜 NEXT UP - TASK FEATURES

### Option A: Monthly View
**Priority:** 🟢 P2 - Medium Priority
**Effort:** Medium
**Description:**
- Traditional month calendar grid
- See task distribution across month
- Click date to view/add tasks
- Colored indicators by priority

**Why Build:**
- Long-term planning visibility
- Completes the calendar suite (Daily → Weekly → Monthly)
- See patterns and busy periods

---

### Option B: Focus Mode
**Priority:** 🟡 P1 - High Priority
**Effort:** Medium
**Description:**
- Distraction-free mode
- Hide everything except current task + Pomodoro timer
- Fullscreen timer option
- Optional: Motivational quotes

**Why Build:**
- Deep work requires zero distractions
- Leverages existing Pomodoro timer
- High user value for productivity

---

### Option C: Search & Quick Find
**Priority:** 🟡 P1 - High Priority
**Effort:** Medium
**Description:**
- Global search across all tasks
- Cmd+K / Ctrl+K shortcut
- Real-time search results
- Search by title, tag, description

**Why Build:**
- Finding tasks becomes slow as database grows
- Power user feature
- Industry standard (Notion, Linear, etc.)

---

### Option D: Completion Statistics Dashboard
**Priority:** 🟡 P1 - High Priority
**Effort:** Medium-High
**Description:**
- Tasks completed per day/week/month
- Completion rate percentage
- Visual charts (bar, line, pie)
- Trend analysis
- Pomodoro session stats

**Why Build:**
- Motivation through visible progress
- Data-driven productivity insights
- Answers "Am I being productive?"

---

### Option E: Task Reminders & Notifications
**Priority:** 🟢 P2 - Medium Priority
**Effort:** Medium
**Description:**
- Browser push notifications
- Reminder before scheduled task time
- Pomodoro completion alerts
- Daily summary notification

**Why Build:**
- Don't miss scheduled tasks
- Proactive productivity
- Requires user to enable browser notifications

---

### Option F: Subtasks / Checklists
**Priority:** 🟢 P2 - Medium Priority
**Effort:** Medium
**Description:**
- Break tasks into smaller steps
- Checklist within task modal
- Progress indicator (3/5 done)
- Collapse/expand subtasks

**Why Build:**
- Large tasks are overwhelming
- Track progress within a task
- "Eat the elephant one bite at a time"

---

## ⏸️ HABIT MANAGEMENT (PAUSED)

*Architecture complete. Implementation paused until task features are done.*

### Architectural Notes

**Key Insight: Habits ≠ Tasks**

| Dimension | Task | Habit |
|-----------|------|-------|
| Purpose | Achieve outcome | Build identity |
| Lifecycle | Created → Done → Gone | Created → Repeated → Forever |
| Success | Completed | Consistency over time |
| Failure | Incomplete | Broken streak (recoverable) |
| Mental Model | Obligation | Identity |

**Core Principles:**
- "Tasks build outcomes. Habits build identity."
- "Task = obligation system. Habit = identity system."
- "Completing the minimum version counts as success."
- "Missing a habit is a pause, not a failure."

### Proposed Data Model

```sql
-- Habit definition
CREATE TABLE habits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  minimum_action VARCHAR(255),      -- "Just 1 pushup" (2-min rule)
  frequency VARCHAR(20) NOT NULL,   -- 'daily', 'weekly', 'weekdays', 'custom'
  frequency_days INTEGER[],         -- [1,3,5] for Mon/Wed/Fri
  target_time TIME,
  color VARCHAR(7),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Completion instances
CREATE TABLE habit_completions (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note TEXT,
  UNIQUE(habit_id, completed_date)
);
```

### Habit Features (Prioritized)

#### Tier 1: MVP
| Feature | Why It Exists |
|---------|---------------|
| Create/Edit/Delete Habit | Core CRUD |
| Today's Habits Widget | Daily visibility on Home |
| Mark Habit Complete | Core interaction |
| Current Streak Display | Motivation |
| Minimum Action Field | 2-Minute Rule integration |

#### Tier 2: Reinforcement
| Feature | Why It Exists |
|---------|---------------|
| Streak Calendar (GitHub-style) | Visual progress |
| Habits Page | Dedicated management |
| Skip/Pause Day | "Pause, not failure" |
| Weekly Frequency | Not all habits are daily |
| Habit Categories | Organization |

#### Tier 3: Integration
| Feature | Why It Exists |
|---------|---------------|
| Frog Habit (hardest first) | Eat That Frog integration |
| Keystone Habit (most important) | Daily Highlight integration |
| Habit + Pomodoro Link | Time tracking for habits |
| Weekly View Habit Row | See habits across week |

#### Tier 4: Analytics
| Feature | Why It Exists |
|---------|---------------|
| Completion Rate Stats | Identify struggling habits |
| Best Days Analysis | Optimize scheduling |
| Longest Streak Record | Long-term motivation |
| Habit Archive | Retire without deleting |

---

## Phase 4 - Analytics & Insights
**Goal:** Track progress and provide insights
**Priority:** 🟢 MEDIUM - Value-add features

### 4.1 Completion Statistics
**Priority:** 🟡 P1 - High Priority
- Tasks completed per day/week/month
- Completion rate percentage
- Visual charts and graphs
- Trend analysis

### 4.2 Productivity Insights
**Priority:** 🟢 P2 - Medium Priority
- Most productive hours
- Task completion patterns
- Pomodoro session analysis
- Weekly/monthly reports

### 4.3 Habit Streak Tracking
**Priority:** 🟢 P2 - Medium Priority
- Track consecutive days of habit completion
- Streak calendar visualization
- Longest streak record
- Streak freeze (grace days)

### 4.4 Time Tracking Analysis
**Priority:** 🟢 P2 - Medium Priority
- Actual time spent on tasks (from Pomodoro)
- Time allocation by category/tag
- Estimation vs actual comparison (Planning Fallacy insights)

---

## Phase 5 - Advanced Features
**Goal:** Polish and advanced functionality
**Priority:** 🔵 LOW - Nice to have

### 5.1 Focus Mode
**Priority:** 🟡 P1 - High Priority
- Distraction-free mode
- Hide everything except current task + timer
- Fullscreen timer
- Motivational quotes

### 5.2 Search & Quick Find
**Priority:** 🟡 P1 - High Priority
- Global search across all tasks
- Cmd+K / Ctrl+K shortcut
- Real-time search results
- Recent tasks

### 5.3 Task Templates
- Save common task patterns
- Quick-create from template
- Template library

### 5.4 More Keyboard Shortcuts
- `/` - Search
- `Space` - Complete task
- `E` - Edit task
- `?` - Show shortcuts help

### 5.5 Notifications System
- Browser push notifications
- Task reminders
- Deadline alerts
- Pomodoro end notifications

### 5.6 Subtasks / Checklists
- Break tasks into steps
- Checklist within task
- Progress indicator

---

## 🎯 RECOMMENDED NEXT STEPS

### **For Tasks (Immediate):**

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | **Focus Mode** | Medium | High |
| 2 | **Search & Quick Find** | Medium | High |
| 3 | **Completion Statistics** | Medium-High | High |
| 4 | **Subtasks/Checklists** | Medium | Medium |
| 5 | **Monthly View** | Medium | Medium |
| 6 | **Task Reminders** | Medium | Medium |

### **For Habits (Later):**

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Database + API | Medium | High |
| 2 | Today's Habits Widget | Low | High |
| 3 | Mark Complete + Streak | Low | High |
| 4 | Streak Calendar | Medium | High |
| 5 | Habits Page | Medium | Medium |

---

## 📊 Priority Legend

- 🔥 **P0 - Critical** - Must have for MVP ✅ DONE
- 🟡 **P1 - High** - Important for full product
- 🟢 **P2 - Medium** - Nice to have, adds value
- 🔵 **P3 - Low** - Polish, can wait

---

## 💡 Development Notes

**What's Working Well:**
- Brain Dump → Eisenhower → Day View workflow
- Quick Wins (2-Minute Rule) integration
- Time Blocking calendar with quick navigation
- Planning Fallacy feedback loop
- Pomodoro timer integration with tasks
- Theme system
- Keyboard shortcuts
- Collapsible sidebar

**Potential Improvements:**
- More keyboard shortcuts
- Browser notifications for Pomodoro
- Better mobile responsiveness
- Offline support

---

**Which feature would you like to build next?** 🚀

*Recommended for Tasks: Focus Mode or Search & Quick Find*
*Habits: Paused until task features complete*
