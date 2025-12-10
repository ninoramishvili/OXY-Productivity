# Development Workflow - OXY Productivity

*Complete workflow for adding new features*

---

## 🎯 Goal

**Every time we add a new feature, you should be able to test immediately without any manual setup.**

---

## ✅ Standard Feature Development Process

When we build any new feature, I will automatically handle:

### 1. **Database Changes** (if needed)
```bash
✅ Create migration file (e.g., 004_add_habits_table.sql)
✅ Run migration automatically
✅ Verify tables created
✅ Add indexes for performance
```

### 2. **Backend Implementation**
```bash
✅ Create/update API routes
✅ Add database queries
✅ Implement business logic
✅ Add error handling
✅ Test endpoints
```

### 3. **Frontend Implementation**
```bash
✅ Create/update components
✅ Connect to API endpoints
✅ Add UI elements
✅ Style according to theme
✅ Test in all 3 themes
```

### 4. **Documentation**
```bash
✅ Update feature docs
✅ Create daily update (YYYYMMDD_UPDATE.md)
✅ Update architecture if needed
✅ Add usage instructions
```

### 5. **Git Commit & Push**
```bash
✅ Stage all changes
✅ Create descriptive commit
✅ Push to GitHub
✅ Everything backed up
```

---

## 🚀 What You Do

### **NOTHING!** Just test! 🎉

1. **Refresh your browser** (http://localhost:5173)
2. **Test the new feature**
3. **Give feedback**
4. **That's it!**

---

## 📋 Feature Development Checklist

For each feature, I will complete:

- [ ] **Plan** - Review feature requirements
- [ ] **Database** - Create migration if needed
- [ ] **Backend** - Implement API endpoints
- [ ] **Frontend** - Build UI components
- [ ] **Styling** - Apply theme support (all 3 themes)
- [ ] **Testing** - Verify functionality
- [ ] **Documentation** - Update docs
- [ ] **Git** - Commit and push to GitHub
- [ ] **Notify** - Tell you it's ready to test!

---

## 🔄 Typical Feature Flow

### **Example: Adding "Create Task" Feature**

#### Step 1: Database (if needed)
```sql
-- No new tables needed for this feature
-- Uses existing tasks table
```

#### Step 2: Backend
```javascript
// POST /api/tasks already exists
// Just needs to be connected to frontend
```

#### Step 3: Frontend
```jsx
// Create TaskModal component
// Add "Add Task" button functionality
// Connect to API
```

#### Step 4: Test
```
✅ Component renders
✅ Modal opens/closes
✅ Form validation works
✅ API call succeeds
✅ Task appears in list
✅ Database updated
```

#### Step 5: Git
```bash
git add .
git commit -m "feat: Add task creation modal with form validation"
git push origin main
```

#### Step 6: Tell You
```
✅ "Create Task feature is ready! 
   Refresh and click 'Add Task' button to test."
```

---

## 🗂️ Repository Structure

```
OXY-Productivity/
├── backend/
│   ├── config/           # Database configuration
│   ├── migrations/       # SQL migration files
│   ├── routes/           # API endpoints
│   └── server.js         # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React contexts
│   │   ├── utils/        # Helper functions
│   │   └── styles/       # CSS files
│   └── public/           # Static assets
│
├── docs/
│   ├── architecture.md           # System design
│   ├── FEATURES_ROADMAP.md      # What to build
│   ├── DEVELOPMENT_WORKFLOW.md  # This file
│   └── YYYYMMDD_UPDATE.md       # Daily updates
│
├── .gitignore            # Git ignore rules
└── README.md             # Project overview
```

---

## 🔐 Environment Variables

### **Backend (.env)**
```env
DATABASE_URL=postgresql://...  # PostgreSQL connection
PORT=5000                      # Server port
NODE_ENV=development           # Environment
```

**Important:** `.env` is in `.gitignore` - never committed to Git!

---

## 🌿 Git Workflow

### **Branching Strategy:**
- `main` - Production-ready code
- Feature development happens on `main` (since you're solo developer)

### **Commit Messages:**
```bash
feat: Add new feature
fix: Fix bug in X
docs: Update documentation
style: Update UI styling
refactor: Improve code structure
test: Add tests
chore: Update dependencies
```

### **After Each Feature:**
```bash
git add .
git commit -m "feat: Feature description"
git push origin main
```

---

## 📊 Database Migration Workflow

### **When Adding New Tables:**

1. **Create migration file:**
```sql
-- backend/migrations/004_add_new_table.sql
CREATE TABLE IF NOT EXISTS new_table (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  -- ... more columns
);
```

2. **Run migration:**
```bash
cd backend
npm run migrate
```

3. **Verify:**
```
✅ Table created
✅ Indexes added
✅ Foreign keys set up
```

4. **Update backend routes** to use new table

5. **Update frontend** to call new endpoints

---

## 🧪 Testing Checklist

Before marking feature complete:

- [ ] **Functionality** - Feature works as intended
- [ ] **Database** - Data saves correctly
- [ ] **API** - Endpoints return correct data
- [ ] **UI** - Components render properly
- [ ] **Themes** - Works in Dark, Light, AND OXY modes
- [ ] **Responsive** - Works on different screen sizes
- [ ] **Errors** - Error handling works
- [ ] **Loading** - Loading states display
- [ ] **Validation** - Form validation works

---

## 📝 Documentation Updates

### **After Each Feature:**

1. **Create daily update:**
```markdown
docs/YYYYMMDD_UPDATE.md
- What was built
- How it works
- How to test it
```

2. **Update FEATURES_ROADMAP.md:**
```markdown
- [x] Feature name ✅ COMPLETED
```

3. **Update architecture.md** if needed

---

## 🎨 Theme Compatibility

### **Every feature MUST support all 3 themes:**

- 🌙 **Dark Mode** - Test it
- ☀️ **Light Mode** - Test it  
- 🌸 **OXY Mode** - Test it

### **Use CSS variables:**
```css
/* Good - theme aware */
background: var(--bg-card);
color: var(--text-primary);

/* Bad - hardcoded */
background: white;
color: black;
```

---

## 🚨 Emergency Rollback

### **If something breaks:**

```bash
# View recent commits
git log --oneline

# Rollback to previous commit
git reset --hard <commit-hash>

# Force push (careful!)
git push origin main --force
```

**Note:** I'll make sure features work before pushing, so this rarely needed!

---

## 📊 Progress Tracking

### **Feature Status:**
```
✅ Completed - Working and tested
🚧 In Progress - Currently building
📋 Planned - In roadmap
💡 Idea - Future consideration
```

### **Updated In:**
- `FEATURES_ROADMAP.md` - Overall progress
- `YYYYMMDD_UPDATE.md` - Daily session log
- Git commits - Detailed history

---

## 🎯 Quality Standards

### **Every feature includes:**

1. **Clean Code**
   - Readable and maintainable
   - Proper comments
   - Consistent style

2. **Error Handling**
   - Try-catch blocks
   - User-friendly errors
   - Logging

3. **User Experience**
   - Intuitive interface
   - Loading states
   - Success feedback

4. **Theme Support**
   - Works in all themes
   - Uses CSS variables
   - Consistent styling

5. **Documentation**
   - How to use
   - Technical details
   - Examples

---

## 🔄 Continuous Improvement

### **After Each Feature:**
1. Review what worked well
2. Note any improvements needed
3. Update workflow if needed
4. Apply learnings to next feature

---

## 🎉 Summary

**Your Job:** Test and give feedback
**My Job:** Everything else!

### **Standard Flow:**
```
1. You request feature
      ↓
2. I implement completely
      ↓
3. I commit and push to GitHub
      ↓
4. I tell you it's ready
      ↓
5. You refresh browser
      ↓
6. You test immediately!
      ↓
7. You give feedback
      ↓
8. Repeat!
```

---

## 📞 Quick Reference

### **To Test New Feature:**
```
1. Refresh browser (http://localhost:5173)
2. Login (demo@example.com / demo123)
3. Test the feature
4. Done!
```

### **If Servers Not Running:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **If Database Issue:**
```bash
cd backend
npm run migrate
```

---

**Everything automated for seamless development! 🚀**

**Focus on testing, I'll handle the rest!** ✨

