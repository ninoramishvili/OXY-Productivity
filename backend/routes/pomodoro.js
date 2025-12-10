const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken } = require('./auth');

// Start a pomodoro session
router.post('/start', verifyToken, async (req, res) => {
  const { taskId, duration } = req.body; // duration in minutes

  try {
    // Verify task belongs to user
    const taskCheck = await query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, req.userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Create pomodoro session
    const result = await query(
      `INSERT INTO pomodoro_sessions (task_id, user_id, duration, completed)
       VALUES ($1, $2, $3, FALSE)
       RETURNING *`,
      [taskId, req.userId, duration]
    );

    res.json({ 
      success: true, 
      session: result.rows[0],
      message: 'Pomodoro session started'
    });
  } catch (error) {
    console.error('Start pomodoro error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start pomodoro session' 
    });
  }
});

// Complete a pomodoro session and update task time
router.post('/complete', verifyToken, async (req, res) => {
  const { sessionId, taskId, actualDuration } = req.body; // actualDuration in seconds

  try {
    await query('BEGIN');

    // Mark session as completed
    await query(
      `UPDATE pomodoro_sessions 
       SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2`,
      [sessionId, req.userId]
    );

    // Update task time_spent and pomodoro_count
    const taskResult = await query(
      `UPDATE tasks 
       SET time_spent = time_spent + $1, 
           pomodoro_count = pomodoro_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [actualDuration, taskId, req.userId]
    );

    // Fetch tags for the task
    const tagsResult = await query(
      `SELECT tags.* FROM tags 
       JOIN task_tags ON tags.id = task_tags.tag_id 
       WHERE task_tags.task_id = $1`,
      [taskId]
    );

    await query('COMMIT');

    res.json({ 
      success: true, 
      task: { ...taskResult.rows[0], tags: tagsResult.rows },
      message: 'Pomodoro completed!'
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Complete pomodoro error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete pomodoro session' 
    });
  }
});

// Cancel a pomodoro session (update time spent but don't count as completed pomodoro)
router.post('/cancel', verifyToken, async (req, res) => {
  const { sessionId, taskId, actualDuration } = req.body; // actualDuration in seconds

  try {
    await query('BEGIN');

    // Delete the session (not completed)
    await query(
      'DELETE FROM pomodoro_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.userId]
    );

    // Still update time spent (partial work counts)
    if (actualDuration > 0) {
      const taskResult = await query(
        `UPDATE tasks 
         SET time_spent = time_spent + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [actualDuration, taskId, req.userId]
      );

      // Fetch tags
      const tagsResult = await query(
        `SELECT tags.* FROM tags 
         JOIN task_tags ON tags.id = task_tags.tag_id 
         WHERE task_tags.task_id = $1`,
        [taskId]
      );

      await query('COMMIT');

      res.json({ 
        success: true, 
        task: { ...taskResult.rows[0], tags: tagsResult.rows },
        message: 'Pomodoro cancelled, time saved'
      });
    } else {
      await query('COMMIT');
      res.json({ 
        success: true, 
        message: 'Pomodoro cancelled'
      });
    }
  } catch (error) {
    await query('ROLLBACK');
    console.error('Cancel pomodoro error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel pomodoro session' 
    });
  }
});

// Get pomodoro history for a task
router.get('/history/:taskId', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.taskId);

  try {
    const result = await query(
      `SELECT * FROM pomodoro_sessions 
       WHERE task_id = $1 AND user_id = $2 AND completed = TRUE
       ORDER BY completed_at DESC
       LIMIT 10`,
      [taskId, req.userId]
    );

    res.json({ 
      success: true, 
      sessions: result.rows
    });
  } catch (error) {
    console.error('Get pomodoro history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get pomodoro history' 
    });
  }
});

module.exports = router;

