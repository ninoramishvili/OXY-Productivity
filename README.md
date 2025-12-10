# Productivity & Task Management App

A modern, clean, and intuitive web application for productivity and task management. Built with React and Node.js.

---

## 🎯 Project Overview

This app helps users manage tasks, track habits, and use various productivity techniques like Pomodoro Timer, Daily Highlights, Eisenhower Matrix, and more.

**Target Users:** Busy, thoughtful people who care about personal growth and productivity.

**Design Philosophy:** Modern, calm, friendly, with lots of breathing room and intuitive interactions.

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development auto-restart

### Frontend
- **React 18+** - UI library
- **Vite** - Fast build tool
- **React Router** - Navigation
- **Axios** - HTTP client

### Data Storage
- Currently: Hardcoded in-memory (temporary)
- Future: PostgreSQL or MongoDB

---

## 📁 Project Structure

```
project-root/
├── backend/                 # Node.js + Express backend
│   ├── server.js           # Main server file
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication endpoints
│   │   └── tasks.js        # Task management endpoints
│   ├── data/               # Hardcoded data (temporary)
│   │   ├── users.js        # User data
│   │   └── tasks.js        # Tasks data
│   └── package.json
│
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   ├── Home.jsx
│   │   │   └── Home.css
│   │   ├── utils/          # Helper functions
│   │   │   └── api.js      # API client
│   │   ├── App.jsx         # Main app component
│   │   ├── App.css
│   │   └── main.jsx        # Entry point
│   └── package.json
│
├── docs/                   # Documentation
│   ├── features.md         # Feature roadmap
│   ├── architecture.md     # Technical architecture
│   └── YYYYMMDD_UPDATE.md  # Daily updates
│
└── README.md               # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)

### Installation

1. **Clone or download this project**

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

---

## ▶️ Running the Application

You need to run both backend and frontend simultaneously in separate terminal windows.

### Terminal 1: Start Backend Server

```bash
cd backend
npm run dev
```

✅ Backend will run on `http://localhost:5000`

### Terminal 2: Start Frontend App

```bash
cd frontend
npm run dev
```

✅ Frontend will run on `http://localhost:5173`

### Access the App

Open your browser and go to: **http://localhost:5173**

---

## 🔐 Demo Credentials

Use these credentials to log in:

- **Email:** `demo@example.com`
- **Password:** `demo123`

Alternative account:
- **Email:** `john@example.com`
- **Password:** `password`

---

## 🎨 Design System

### Color Palette
- **Primary:** `#4ECB71` (Mint)
- **Accent:** `#FD8D6E` (Coral) - for highlights
- **Background:** `#F8FAFC` (Soft White)
- **Text:** `#2C3E50` (Charcoal)

### Typography
- **Font:** Inter
- **Weights:** Regular (400), Medium (500), Semibold (600), Bold (700)

### UI Principles
- Rounded corners (16px)
- Soft shadows
- Lots of white space (24px+ padding)
- Smooth transitions (200ms ease)
- Card-based layout

---

## 📋 Current Features

### ✅ Implemented
- User authentication (login/logout)
- Beautiful, responsive login page
- Home dashboard with sidebar navigation
- Task display from backend
- User profile section
- Session management

### 🚧 In Progress / Planned
- Add new tasks
- Edit/delete tasks
- Mark tasks as complete
- Calendar view with drag-and-drop
- Pomodoro timer
- Daily highlight selection
- Backlog view
- Statistics and analytics
- Habit tracking

See `docs/features.md` for complete roadmap.

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Health Check
- `GET /api/health` - Server health status

---

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Starts server with nodemon (auto-restart on changes)
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server (hot-reload enabled)
```

### Build for Production
```bash
cd frontend
npm run build  # Creates optimized production build
```

---

## 📚 Documentation

All documentation is in the `docs/` folder:

- **features.md** - Complete feature roadmap and future plans
- **architecture.md** - Technical architecture and design decisions
- **YYYYMMDD_UPDATE.md** - Daily session updates and progress tracking

---

## 🐛 Known Limitations

1. **No Database:** Data is stored in memory and resets when server restarts
2. **No Password Hashing:** Passwords are stored in plain text (temporary)
3. **Limited Validation:** Minimal form validation currently
4. **Session Storage:** Simple token-based sessions (no JWT yet)

*These will be addressed in future updates as we add database integration.*

---

## 🎯 Learning Goals

This project is designed for learning web development:
- Understanding full-stack architecture
- Building RESTful APIs
- React component structure
- State management
- Authentication flow
- Responsive design
- Clean code practices

---

## 📝 Notes

- **Data Persistence:** Currently, data only persists while the server is running. Restart = fresh data.
- **CORS:** Backend has CORS enabled to allow frontend requests from different port.
- **Development Mode:** Both backend and frontend are set up for hot-reloading during development.

---

## 🆘 Troubleshooting

### Backend won't start
- Make sure you're in the `backend/` directory
- Check if port 5000 is available
- Run `npm install` to ensure dependencies are installed

### Frontend won't start
- Make sure you're in the `frontend/` directory
- Check if port 5173 is available
- Run `npm install` to ensure dependencies are installed

### Can't log in
- Make sure backend server is running
- Check console for errors
- Verify you're using correct credentials: `demo@example.com` / `demo123`

### Connection refused error
- Ensure backend is running on port 5000
- Check if `http://localhost:5000/api/health` returns a response

---

## 📈 Next Steps

1. Implement task creation functionality
2. Add task editing and deletion
3. Create backlog view
4. Build calendar with drag-and-drop
5. Add Pomodoro timer
6. Implement productivity techniques

---

## 🤝 Contributing

This is a learning project! Feel free to experiment, break things, and learn.

---

## 📄 License

This project is for educational purposes.

---

**Happy Coding! 🚀**

