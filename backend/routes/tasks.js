const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken } = require('./auth');

// Get all tasks for logged-in user with tags
router.get('/', verifyToken, async (req, res) => {
  try {
    const tasksResult = await query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY display_order ASC, created_at DESC',
      [req.userId]
    );
    
    // Get tags for each task
    const tasks = await Promise.all(tasksResult.rows.map(async (task) => {
      const tagsResult = await query(
        `SELECT tags.* FROM tags 
         JOIN task_tags ON tags.id = task_tags.tag_id 
         WHERE task_tags.task_id = $1`,
        [task.id]
      );
      return { ...task, tags: tagsResult.rows };
    }));
    
    res.json({ 
      success: true, 
      tasks 
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tasks' 
    });
  }
});

// Create new task
router.post('/', verifyToken, async (req, res) => {
  const { title, description, priority, scheduledDate, scheduledTime, tagIds, isUrgent, isImportant, isPrioritized } = req.body;

  if (!title) {
    return res.status(400).json({ 
      success: false, 
      message: 'Task title is required' 
    });
  }

  try {
    const result = await query(
      `INSERT INTO tasks (user_id, title, description, priority, scheduled_date, scheduled_time, is_urgent, is_important, is_prioritized) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        req.userId,
        title,
        description || '',
        priority || 'medium',
        scheduledDate || null,
        scheduledTime || null,
        isUrgent || false,
        isImportant || false,
        isPrioritized || false
      ]
    );

    const task = result.rows[0];

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await query(
          'INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)',
          [task.id, tagId]
        );
      }
    }

    // Fetch tags for response
    const tagsResult = await query(
      `SELECT tags.* FROM tags 
       JOIN task_tags ON tags.id = task_tags.tag_id 
       WHERE task_tags.task_id = $1`,
      [task.id]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Task created successfully',
      task: { ...task, tags: tagsResult.rows }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create task' 
    });
  }
});

// Update task
router.put('/:id', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id);
  const { title, description, completed, priority, scheduledDate, scheduledTime, tagIds } = req.body;

  console.log('Update task request:', { taskId, tagIds });

  try {
    // Check if task belongs to user
    const checkResult = await query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount}`);
      values.push(completed);
      paramCount++;
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }
    if (scheduledDate !== undefined) {
      updates.push(`scheduled_date = $${paramCount}`);
      // Convert empty string to null for database
      const dateValue = scheduledDate === '' ? null : scheduledDate;
      values.push(dateValue);
      paramCount++;
      
      // If removing date (setting to null), also unprioritize - send back to To Do
      if (dateValue === null) {
        updates.push(`is_prioritized = $${paramCount}`);
        values.push(false);
        paramCount++;
      }
    }
    if (scheduledTime !== undefined) {
      updates.push(`scheduled_time = $${paramCount}`);
      values.push(scheduledTime);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(taskId);
    values.push(req.userId);

    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1} 
       RETURNING *`,
      values
    );

    // Update tags if tagIds is provided
    if (tagIds !== undefined) {
      console.log('Updating tags for task', taskId, 'New tagIds:', tagIds);
      
      // Delete existing tags
      await query('DELETE FROM task_tags WHERE task_id = $1', [taskId]);
      
      // Add new tags
      if (tagIds && tagIds.length > 0) {
        for (const tagId of tagIds) {
          await query(
            'INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)',
            [taskId, tagId]
          );
        }
      }
    }

    // Fetch tags for response
    const tagsResult = await query(
      `SELECT tags.* FROM tags 
       JOIN task_tags ON tags.id = task_tags.tag_id 
       WHERE task_tags.task_id = $1`,
      [taskId]
    );

    res.json({ 
      success: true, 
      message: 'Task updated successfully',
      task: { ...result.rows[0], tags: tagsResult.rows }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update task' 
    });
  }
});

// Delete task
router.delete('/:id', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id);

  try {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [taskId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Task deleted successfully' 
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete task' 
    });
  }
});

// Update Eisenhower Matrix quadrant for a task
router.put('/:id/eisenhower', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id);
  const { isUrgent, isImportant } = req.body;

  try {
    // When moving to Eisenhower, also mark as prioritized
    const result = await query(
      `UPDATE tasks 
       SET is_urgent = $1, is_important = $2, is_prioritized = TRUE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 AND user_id = $4 
       RETURNING *`,
      [isUrgent, isImportant, taskId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Get tags for the task
    const tagsResult = await query(
      `SELECT tags.* FROM tags 
       JOIN task_tags ON tags.id = task_tags.tag_id 
       WHERE task_tags.task_id = $1`,
      [taskId]
    );

    res.json({ 
      success: true, 
      message: 'Eisenhower quadrant updated',
      task: { ...result.rows[0], tags: tagsResult.rows }
    });
  } catch (error) {
    console.error('Update Eisenhower error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update Eisenhower quadrant' 
    });
  }
});

// Schedule all prioritized tasks for today
router.post('/schedule-all-today', verifyToken, async (req, res) => {
  const { date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // Update all prioritized, unscheduled tasks to today
    // Set display_order based on Eisenhower priority:
    // Do First (urgent+important) = 0, Schedule = 1, Delegate = 2, Eliminate = 3
    const result = await query(
      `UPDATE tasks 
       SET scheduled_date = $1, 
           display_order = CASE 
             WHEN is_urgent AND is_important THEN 0
             WHEN NOT is_urgent AND is_important THEN 1
             WHEN is_urgent AND NOT is_important THEN 2
             ELSE 3
           END,
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND is_prioritized = TRUE AND scheduled_date IS NULL
       RETURNING id`,
      [targetDate, req.userId]
    );

    res.json({ 
      success: true, 
      message: `${result.rows.length} tasks scheduled for today`,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Schedule all today error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to schedule tasks' 
    });
  }
});

// Send task back to To Do (unprioritize)
router.put('/:id/unprioritize', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id);

  try {
    const result = await query(
      `UPDATE tasks 
       SET is_prioritized = FALSE, is_urgent = FALSE, is_important = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [taskId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Get tags for the task
    const tagsResult = await query(
      `SELECT tags.* FROM tags 
       JOIN task_tags ON tags.id = task_tags.tag_id 
       WHERE task_tags.task_id = $1`,
      [taskId]
    );

    res.json({ 
      success: true, 
      message: 'Task sent back to To Do',
      task: { ...result.rows[0], tags: tagsResult.rows }
    });
  } catch (error) {
    console.error('Unprioritize task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unprioritize task' 
    });
  }
});

// Set task as daily highlight
router.put('/:id/highlight', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id);
  const { date } = req.body; // Accept date from frontend

  try {
    // Start transaction
    await query('BEGIN');

    // Use provided date or fallback to server date
    const today = date || new Date().toISOString().split('T')[0];
    console.log('Setting highlight for date:', today);

    // Check if task belongs to user
    const checkResult = await query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, req.userId]
    );

    if (checkResult.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Remove ALL existing highlights for this user (regardless of date)
    const clearResult = await query(
      `UPDATE tasks 
       SET is_daily_highlight = FALSE, highlight_date = NULL 
       WHERE user_id = $1 AND is_daily_highlight = TRUE
       RETURNING id`,
      [req.userId]
    );
    console.log('Cleared', clearResult.rows.length, 'existing highlights for user:', req.userId);

    // Set new highlight AND remove frog status if this task was a frog
    console.log('Setting task', taskId, 'as highlight with date:', today);
    const result = await query(
      `UPDATE tasks 
       SET is_daily_highlight = TRUE, highlight_date = $1, is_frog = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [today, taskId, req.userId]
    );
    console.log('Updated task result:', result.rows[0].id, 'highlight_date:', result.rows[0].highlight_date, 'is_daily_highlight:', result.rows[0].is_daily_highlight);

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
      message: 'Task set as daily highlight',
      task: { ...result.rows[0], tags: tagsResult.rows }
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Set highlight error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to set daily highlight' 
    });
  }
});

// Remove daily highlight
router.delete('/:id/highlight', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id);

  try {
    const result = await query(
      `UPDATE tasks 
       SET is_daily_highlight = FALSE, highlight_date = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [taskId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Fetch tags for the task
    const tagsResult = await query(
      `SELECT tags.* FROM tags 
       JOIN task_tags ON tags.id = task_tags.tag_id 
       WHERE task_tags.task_id = $1`,
      [taskId]
    );

    res.json({ 
      success: true, 
      message: 'Daily highlight removed',
      task: { ...result.rows[0], tags: tagsResult.rows }
    });
  } catch (error) {
    console.error('Remove highlight error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove daily highlight' 
    });
  }
});

// Set task as frog (hardest task)
router.put('/:id/frog', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id);

  try {
    await query('BEGIN');

    // Remove existing frog for this user
    await query(
      `UPDATE tasks 
       SET is_frog = FALSE 
       WHERE user_id = $1 AND is_frog = TRUE`,
      [req.userId]
    );

    // Set new frog AND remove highlight status if this task was a highlight
    const result = await query(
      `UPDATE tasks 
       SET is_frog = TRUE, is_daily_highlight = FALSE, highlight_date = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [taskId, req.userId]
    );

    if (result.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

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
      message: 'Task marked as frog',
      task: { ...result.rows[0], tags: tagsResult.rows }
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Set frog error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark task as frog' 
    });
  }
});

// Remove frog status
router.delete('/:id/frog', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id);

  try {
    const result = await query(
      `UPDATE tasks 
       SET is_frog = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [taskId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Fetch tags for the task
    const tagsResult = await query(
      `SELECT tags.* FROM tags 
       JOIN task_tags ON tags.id = task_tags.tag_id 
       WHERE task_tags.task_id = $1`,
      [taskId]
    );

    res.json({ 
      success: true, 
      message: 'Frog status removed',
      task: { ...result.rows[0], tags: tagsResult.rows }
    });
  } catch (error) {
    console.error('Remove frog error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove frog status' 
    });
  }
});

// Reorder tasks
router.post('/reorder', verifyToken, async (req, res) => {
  const { taskOrders } = req.body; // Array of { id, display_order }

  try {
    await query('BEGIN');

    // Update display_order for each task
    for (const taskOrder of taskOrders) {
      await query(
        'UPDATE tasks SET display_order = $1 WHERE id = $2 AND user_id = $3',
        [taskOrder.display_order, taskOrder.id, req.userId]
      );
    }

    await query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Task order updated' 
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Reorder tasks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reorder tasks' 
    });
  }
});

module.exports = router;
