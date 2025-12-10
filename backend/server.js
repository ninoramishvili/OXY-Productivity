require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { router: authRouter } = require('./routes/auth');
const tasksRouter = require('./routes/tasks');
const tagsRouter = require('./routes/tags');
const { pool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests from React app
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/tags', tagsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api`);
  
  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log(`✅ Database connected successfully`);
  } catch (error) {
    console.error(`❌ Database connection error:`, error.message);
  }
});

