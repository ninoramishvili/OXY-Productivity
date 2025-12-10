const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken } = require('./auth');

// Get all tasks for logged-in user with tags
router.get('/', verifyToken, async (req, res) => {
  try {
    const tasksResult = await query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
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
  const { title, description, priority, scheduledDate, scheduledTime, tagIds } = req.body;

  if (!title) {
    return res.status(400).json({ 
      success: false, 
      message: 'Task title is required' 
    });
  }

  try {
    const result = await query(
      `INSERT INTO tasks (user_id, title, description, priority, scheduled_date, scheduled_time) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        req.userId,
        title,
        description || '',
        priority || 'medium',
        scheduledDate || null,
        scheduledTime || null
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
      values.push(scheduledDate);
      paramCount++;
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

module.exports = router;
