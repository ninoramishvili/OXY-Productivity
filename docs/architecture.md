# Architecture Documentation

*Last Updated: December 10, 2025*

---

## 🏗️ System Overview

This is a full-stack productivity and task management web application designed for simplicity and gradual feature expansion.

### Technology Stack

**Frontend:**
- React 18+ (with Vite for fast development)
- React Router (for navigation)
- React DnD or React Beautiful DnD (drag-and-drop functionality)
- Axios (HTTP client)
- CSS Modules or styled-components (styling)

**Backend:**
- Node.js (runtime)
- Express.js (web framework)
- CORS (cross-origin resource sharing)
- JSON for data storage (hardcoded initially, no database)

**Development Tools:**
- npm (package manager)
- Nodemon (auto-restart backend during development)

---

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── server.js           # Main Express server
│   ├── routes/             # API route handlers
│   ├── data/               # Hardcoded data (users, tasks)
│   ├── middleware/         # Authentication, validation
│   └── package.json        # Backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page-level components
│   │   ├── styles/         # CSS/styling files
│   │   ├── utils/          # Helper functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
└── docs/
    ├── features.md         # Feature roadmap
    ├── architecture.md     # This file
    └── YYYYMMDD_UPDATE.md  # Daily updates
```

---

## 🔄 Data Flow (Current Implementation)

### Authentication Flow
1. User enters credentials on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates against hardcoded user data
4. Backend returns user object and session token
5. Frontend stores token in localStorage
6. Protected routes check for valid token

### Task Management Flow
1. User creates/edits task in UI
2. Frontend sends API request to backend
3. Backend updates in-memory data store (hardcoded object)
4. Backend returns updated data
5. Frontend updates UI state

*Note: Currently no database. Data persists only while server is running. Will add database in future.*

---

## 🎨 Design System

### Color Palette
- **Primary:** `#4ECB71` (Mint) or `#5BA1F3` (Soft Blue)
- **Accent:** `#FD8D6E` (Coral - for highlights, active states)
- **Background:** `#F8FAFC` (Soft White) / `#F1F5F9` (Light Grey)
- **Text:** `#2C3E50` (Charcoal) / `#475569` (Muted Slate)

### Typography
- **Font Family:** Inter or Poppins
- **Headings:** Medium weight
- **Body:** Regular weight

### UI Components
- **Cards:** White/soft-grey, 16px rounded corners, soft shadow
- **Buttons:** Rounded, soft colors, no hard edges
- **Icons:** Simple line icons (e.g., Lucide React, Heroicons)
- **Spacing:** Minimum 24px padding, lots of breathing room

---

## 🔐 Security Considerations (Current)

**Current Phase:**
- Simple session-based authentication
- Tokens stored in localStorage
- Basic validation on backend
- No password hashing yet (hardcoded plain text users)

**Future Enhancements:**
- JWT authentication
- Password hashing (bcrypt)
- Refresh tokens
- HTTPS only
- Rate limiting

---

## 📡 API Endpoints (Planned)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (future)
- `POST /api/auth/logout` - User logout

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Calendar
- `GET /api/calendar/:date` - Get tasks for specific date
- `PUT /api/tasks/:id/schedule` - Schedule task to calendar

### Productivity Features (Future)
- `GET /api/pomodoro/sessions` - Get pomodoro history
- `POST /api/pomodoro/start` - Start pomodoro session
- `GET /api/habits` - Get user habits
- `GET /api/stats/weekly` - Get weekly statistics

---

## 🎯 Development Phases

### Phase 1: Foundation (Current)
- ✅ Project setup
- ✅ Login page
- ✅ Home page structure
- Basic navigation
- Simple task list

### Phase 2: Core Task Management
- Task CRUD operations
- Backlog view
- Calendar view
- Drag and drop

### Phase 3: Productivity Tools
- Pomodoro timer
- Daily highlight
- Eisenhower matrix

### Phase 4: Analytics & Habits
- Weekly/monthly views
- Statistics
- Habit tracking

### Phase 5: Advanced Features
- Multiple productivity techniques
- Enhanced analytics
- Customization options

---

## 🔧 Deployment (Future)

**Planned Deployment Strategy:**
- Frontend: Vercel or Netlify
- Backend: Railway, Render, or Heroku
- Database: PostgreSQL or MongoDB (when added)
- Environment variables for configuration

---

## 📝 Development Guidelines

1. **Keep it Simple:** Beginner-friendly code, clear comments
2. **Incremental:** One feature at a time, test before moving forward
3. **Documentation:** Update docs after significant changes
4. **User-Centric:** Always prioritize UX and simplicity
5. **Design Consistency:** Follow style guide strictly

