const express = require("express")
const { body, validationResult } = require("express-validator")
const Column = require("../models/Column")
const Board = require("../models/Board")
const Task = require("../models/Task")
const { protect } = require("../middleware/auth")

const router = express.Router()

// Apply authentication middleware to all routes
router.use(protect)

// POST /api/columns - Create a new column
router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Column title is required"),
    body("boardId").notEmpty().withMessage("Board ID is required"),
    body("position").isNumeric().withMessage("Position must be a number"),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }

    try {
      const { title, boardId, position, color } = req.body

      // Check if user has access to the board
      const board = await Board.findById(boardId)
      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        })
      }

      const hasAccess =
        board.createdBy.toString() === req.user._id.toString() ||
        board.members.some((member) => member.user.toString() === req.user._id.toString())

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      const column = new Column({
        title,
        boardId,
        position,
        color: color || "#e9ecef",
      })

      await column.save()

      res.status(201).json({
        success: true,
        data: column,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// PUT /api/columns/:id - Update a column
router.put("/:id", async (req, res) => {
  try {
    const column = await Column.findById(req.params.id)

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      })
    }

    // Check if user has access to the board
    const board = await Board.findById(column.boardId)
    const hasAccess =
      board.createdBy.toString() === req.user._id.toString() ||
      board.members.some((member) => member.user.toString() === req.user._id.toString())

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const { title, position, color } = req.body

    if (title) column.title = title
    if (position !== undefined) column.position = position
    if (color) column.color = color

    await column.save()

    res.json({
      success: true,
      data: column,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// DELETE /api/columns/:id - Delete a column
router.delete("/:id", async (req, res) => {
  try {
    const column = await Column.findById(req.params.id)

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      })
    }

    // Check if user has access to the board
    const board = await Board.findById(column.boardId)
    const hasAccess =
      board.createdBy.toString() === req.user._id.toString() ||
      board.members.some((member) => member.user.toString() === req.user._id.toString())

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Delete all tasks in this column
    await Task.deleteMany({ columnId: req.params.id })

    // Delete the column
    await Column.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Column deleted successfully",
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
