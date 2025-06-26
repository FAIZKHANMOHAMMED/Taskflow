const express = require('express');
const { body, validationResult } = require('express-validator');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// GET /api/boards - Get all boards for the authenticated user
router.get('/', async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { createdBy: req.user._id },
        { 'members.user': req.user._id }
      ],
      isArchived: false
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('members.user', 'firstName lastName email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: boards
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/boards - Create a new board
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Board title is required'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const { title, description, backgroundColor } = req.body;

      const board = new Board({
        title,
        description,
        createdBy: req.user._id,
        backgroundColor: backgroundColor || '#f8f9fa',
        members: [{
          user: req.user._id,
          role: 'owner'
        }]
      });

      await board.save();
      await board.populate('createdBy', 'firstName lastName email');
      await board.populate('members.user', 'firstName lastName email');

      // Create default columns
      const defaultColumns = [
        { title: 'To Do', position: 0 },
        { title: 'In Progress', position: 1 },
        { title: 'Done', position: 2 }
      ];

      const columns = await Column.create(
        defaultColumns.map(col => ({
          ...col,
          boardId: board._id
        }))
      );

      res.status(201).json({
        success: true,
        data: {
          board,
          columns
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// GET /api/boards/:id - Get a specific board with columns and tasks
router.get('/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user has access to this board
    const hasAccess = board.createdBy._id.toString() === req.user._id.toString() ||
                     board.members.some(member => member.user._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get columns for this board
    const columns = await Column.find({ boardId: req.params.id, isArchived: false })
      .sort({ position: 1 });

    // Get tasks for this board
    const tasks = await Task.find({ boardId: req.params.id, isArchived: false })
      .populate('creator', 'firstName lastName email')
      .populate('assignee', 'firstName lastName email')
      .sort({ position: 1 });

    res.json({
      success: true,
      data: {
        board,
        columns,
        tasks
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/boards/:id - Update a board
router.put('/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user is owner or admin
    const userMember = board.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { title, description, backgroundColor } = req.body;
    
    if (title) board.title = title;
    if (description !== undefined) board.description = description;
    if (backgroundColor) board.backgroundColor = backgroundColor;

    await board.save();
    await board.populate('createdBy', 'firstName lastName email');
    await board.populate('members.user', 'firstName lastName email');

    res.json({
      success: true,
      data: board
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/boards/:id - Delete a board
router.delete('/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user is owner
    if (board.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only board owner can delete the board'
      });
    }

    // Delete associated columns and tasks
    await Column.deleteMany({ boardId: req.params.id });
    await Task.deleteMany({ boardId: req.params.id });
    await Board.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
