const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken } = require('./auth');

// Get all tags for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM tags WHERE user_id = $1 ORDER BY name',
      [req.userId]
    );
    
    res.json({ 
      success: true, 
      tags: result.rows 
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tags' 
    });
  }
});

// Create new tag
router.post('/', verifyToken, async (req, res) => {
  const { name, color } = req.body;

  if (!name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tag name is required' 
    });
  }

  try {
    const result = await query(
      'INSERT INTO tags (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, name, color || '#00CED1']
    );

    res.status(201).json({ 
      success: true, 
      tag: result.rows[0] 
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create tag' 
    });
  }
});

// Delete tag
router.delete('/:id', verifyToken, async (req, res) => {
  const tagId = parseInt(req.params.id);

  try {
    const result = await query(
      'DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING id',
      [tagId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tag not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Tag deleted successfully' 
    });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete tag' 
    });
  }
});

module.exports = router;

