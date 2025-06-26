const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Board = require('../models/Board');
const Column = require('../models/Column');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// POST /api/tasks - Create a new task
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Task title is required'),
    body('columnId').notEmpty().withMessage('Column ID is required'),
    body('boardId').notEmpty().withMessage('Board ID is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('status').optional().isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status')
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
      const { title, description, columnId, boardId, priority, status, dueDate, assignee } = req.body;

      // Check if user has access to the board
      const board = await Board.findById(boardId);
      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      const hasAccess = board.createdBy.toString() === req.user._id.toString() ||
                       board.members.some(member => member.user.toString() === req.user._id.toString());

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if column exists
      const column = await Column.findById(columnId);
      if (!column || column.boardId.toString() !== boardId) {
        return res.status(404).json({
          success: false,
          message: 'Column not found'
        });
      }

      // Get the position for the new task (last position in the column)
      const lastTask = await Task.findOne({ columnId }).sort({ position: -1 });
      const position = lastTask ? lastTask.position + 1 : 0;

      const task = new Task({
        title,
        description,
        creator: req.user._id,
        assignee: assignee || req.user._id,
        priority: priority || 'medium',
        status: status || 'todo',
        dueDate: dueDate ? new Date(dueDate) : null,
        columnId,
        boardId,
        position
      });

      await task.save();
      await task.populate('creator', 'firstName lastName email');
      await task.populate('assignee', 'firstName lastName email');

      res.status(201).json({
        success: true,
        data: task
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

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the board
    const board = await Board.findById(task.boardId);
    const hasAccess = board.createdBy.toString() === req.user._id.toString() ||
                     board.members.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { title, description, priority, status, dueDate, assignee } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignee !== undefined) task.assignee = assignee;

    await task.save();
    await task.populate('creator', 'firstName lastName email');
    await task.populate('assignee', 'firstName lastName email');

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/tasks/:id/move - Move task to different column or position
router.put('/:id/move', async (req, res) => {
  try {
    const { columnId, position } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the board
    const board = await Board.findById(task.boardId);
    const hasAccess = board.createdBy.toString() === req.user._id.toString() ||
                     board.members.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const oldColumnId = task.columnId;
    const oldPosition = task.position;

    // Update task column and position
    task.columnId = columnId;
    task.position = position;
    await task.save();

    // Update positions of other tasks in the old column
    if (oldColumnId.toString() !== columnId.toString()) {
      await Task.updateMany(
        { columnId: oldColumnId, position: { $gt: oldPosition } },
        { $inc: { position: -1 } }
      );
    }

    // Update positions of tasks in the new column
    await Task.updateMany(
      { 
        columnId: columnId, 
        position: { $gte: position },
        _id: { $ne: task._id }
      },
      { $inc: { position: 1 } }
    );

    await task.populate('creator', 'firstName lastName email');
    await task.populate('assignee', 'firstName lastName email');

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the board
    const board = await Board.findById(task.boardId);
    const hasAccess = board.createdBy.toString() === req.user._id.toString() ||
                     board.members.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const columnId = task.columnId;
    const position = task.position;

    await Task.findByIdAndDelete(req.params.id);

    // Update positions of remaining tasks
    await Task.updateMany(
      { columnId: columnId, position: { $gt: position } },
      { $inc: { position: -1 } }
    );

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/tasks/:id/comments - Add a comment to a task
router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the board
    const board = await Board.findById(task.boardId);
    const hasAccess = board.createdBy.toString() === req.user._id.toString() ||
                     board.members.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    task.comments.push({
      author: req.user._id,
      content: content.trim()
    });

    await task.save();
    await task.populate('comments.author', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: task.comments[task.comments.length - 1]
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
