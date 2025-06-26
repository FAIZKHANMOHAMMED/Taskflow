"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Task, useBoardStore } from "@/store/boardStore"

interface EditTaskDialogProps {
  task: Task
  isOpen: boolean
  onClose: () => void
}

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({ task, isOpen, onClose }) => {
  const { updateTask, columns } = useBoardStore()
  const [editTask, setEditTask] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate || "",
    columnId: task.columnId,
  })

  useEffect(() => {
    setEditTask({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || "",
      columnId: task.columnId,
    })
  }, [task])

  const taskColumn = columns.find((col) => col._id === task.columnId)
  const boardColumns = columns.filter((col) => col.boardId === taskColumn?.boardId)

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editTask.title.trim()) {
      try {
        await updateTask(task._id, {
          ...editTask,
          title: editTask.title.trim(),
          description: editTask.description.trim(),
        })
        onClose()
      } catch (error) {
        console.error("Failed to update task:", error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div>
            <Label htmlFor="editTaskTitle" className="text-slate-300">
              Task Title
            </Label>
            <Input
              id="editTaskTitle"
              value={editTask.title}
              onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
              placeholder="Enter task title"
              required
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="editTaskDescription" className="text-slate-300">
              Description
            </Label>
            <Textarea
              id="editTaskDescription"
              value={editTask.description}
              onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              placeholder="Enter task description"
              rows={3}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editTaskPriority" className="text-slate-300">
                Priority
              </Label>
              <Select
                value={editTask.priority}
                onValueChange={(value: "high" | "medium" | "low") => setEditTask({ ...editTask, priority: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editTaskStatus" className="text-slate-300">
                Status
              </Label>
              <Select
                value={editTask.status}
                onValueChange={(value: "todo" | "in-progress" | "completed") => setEditTask({ ...editTask, status: value })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="editTaskDueDate" className="text-slate-300">
              Due Date
            </Label>
            <Input
              id="editTaskDueDate"
              type="date"
              value={editTask.dueDate}
              onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="editTaskColumn" className="text-slate-300">
              Column
            </Label>
            <Select value={editTask.columnId} onValueChange={(value) => setEditTask({ ...editTask, columnId: value })}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {boardColumns.map((column) => (
                  <SelectItem key={column._id} value={column._id}>
                    {column.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Update Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
