# OXY Productivity - Feature Roadmap & Development Phases

*Comprehensive feature plan with phases, priorities, and descriptions*
*Last Updated: December 13, 2025*

---

## 📋 Table of Contents
1. [Completed Features](#-completed-features)
2. [Next Up - Phase 3](#phase-3---advanced-planning--next-up)
3. [Phase 4 - Analytics & Insights](#phase-4---analytics--insights)
4. [Phase 5 - Advanced Features](#phase-5---advanced-features)
5. [Recommended Next Steps](#-recommended-next-steps)

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

### Phase 2 - Productivity Techniques ✅ MOSTLY COMPLETE

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

#### 2.4 2-Minute Rule ⏳ NOT STARTED
- Quick tasks that take < 2 minutes
- Auto-suggest quick tasks
- One-click complete

#### 2.5 Time Blocking / Parkinson's Law ⏳ NOT STARTED
- Set artificial deadlines for tasks
- Time constraint visualization
- Countdown timers

---

### Additional Implemented Features ✅

#### Workflow System ✅
- ✅ **Brain Dump Workflow**:
  - New tasks → Brain Dump (To Do)
  - Prioritize → Eisenhower Matrix
  - Schedule → Day View
- ✅ Tasks appear in only ONE location based on state

#### Day View / Date Navigation ✅
- ✅ View tasks for any day (Today, past, future)
- ✅ Date navigation (prev/next/today buttons)
- ✅ Tasks filtered by scheduled date
- ✅ Timezone-aware (GMT+4)

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

---

## Phase 3 - Advanced Planning 🔜 NEXT UP
**Goal:** Calendar and scheduling features
**Priority:** 🟡 HIGH - Core productivity feature

### 3.1 Weekly View ⭐ RECOMMENDED NEXT
**Priority:** 🟡 P1 - High Priority
**Description:**
- Week-at-a-glance calendar
- 7-day grid layout
- Weekly planning mode
- Navigate between weeks

**Features:**
- 7-column layout (Mon-Sun)
- Mini task cards per day
- Weekly summary stats
- Week picker
- Drag tasks between days

**Acceptance Criteria:**
- ❌ Shows 7 days in columns
- ❌ Can navigate previous/next week
- ❌ Shows task count per day
- ❌ Can click day to see detail
- ❌ Can drag tasks to different days

---

### 3.2 Monthly View
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

### 3.3 Recurring Tasks / Habits
**Priority:** 🟡 P1 - High Priority
**Description:**
- Create recurring tasks (daily, weekly, monthly)
- Habit tracking
- Streak counting
- Skip/snooze options

**Features:**
- Recurrence pattern selection
- Auto-creation of task instances
- Habit checklist
- Streak visualization

**Acceptance Criteria:**
- ❌ Can set recurrence pattern
- ❌ Tasks auto-appear on schedule
- ❌ Tracks completion streak
- ❌ Can skip without breaking streak

---

### 3.4 Time-Blocked Calendar View
**Priority:** 🟢 P2 - Medium Priority
**Description:**
- Hour-by-hour daily calendar
- Schedule tasks to specific time slots
- Visual time blocks
- Current time indicator

**Features:**
- Hour grid layout (8 AM - 10 PM)
- Task blocks with duration
- Drag-and-drop scheduling
- Resize task blocks

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
- Estimation vs actual comparison

---

## Phase 5 - Advanced Features
**Goal:** Polish and advanced functionality
**Priority:** 🔵 LOW - Nice to have

### 5.1 2-Minute Rule Quick Tasks
- Mark tasks as quick (< 2 min)
- Quick tasks filter
- One-click complete

### 5.2 Focus Mode
**Priority:** 🟡 P1 - High Priority
- Distraction-free mode
- Hide everything except current task + timer
- Fullscreen timer
- Motivational quotes

### 5.3 Search & Quick Find
**Priority:** 🟡 P1 - High Priority
- Global search across all tasks
- Cmd+K / Ctrl+K shortcut
- Real-time search results
- Recent tasks

### 5.4 Task Templates
- Save common task patterns
- Quick-create from template
- Template library

### 5.5 More Keyboard Shortcuts
- `/` - Search
- `Space` - Complete task
- `E` - Edit task
- `?` - Show shortcuts help

### 5.6 Notifications System
- Browser push notifications
- Task reminders
- Deadline alerts
- Pomodoro end notifications

### 5.7 Planning Fallacy Counter
- Learn from estimation mistakes
- Suggest adjusted estimates
- Historical accuracy tracking

---

## 🎯 RECOMMENDED NEXT STEPS

### **Immediate Next (1-2 Sessions):**

#### Option A: Weekly View
- See entire week at a glance
- Plan multiple days ahead
- Balance workload across week
- Very useful for planning

#### Option B: Recurring Tasks / Habits
- Daily/weekly recurring tasks
- Build habit tracking
- Streak counting
- High user value

#### Option C: Completion Statistics
- See your productivity data
- Charts and graphs
- Motivating progress tracking

---

### **Priority Order Suggestion:**

1. **Weekly View** (Phase 3.1) - Most requested calendar feature
2. **Recurring Tasks** (Phase 3.3) - High value for habit building
3. **Statistics Dashboard** (Phase 4.1) - Motivating progress view
4. **Focus Mode** (Phase 5.2) - Distraction-free work
5. **Search & Quick Find** (Phase 5.3) - Better task discovery
6. **Monthly View** (Phase 3.2) - Long-term planning

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
- Pomodoro timer integration with tasks
- Theme system
- Keyboard shortcuts

**Potential Improvements:**
- More keyboard shortcuts
- Browser notifications for Pomodoro
- Better mobile responsiveness
- Offline support

---

**Which feature would you like to build next?** 🚀

*Recommended: Weekly View or Recurring Tasks*
