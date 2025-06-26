"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBoardStore } from "@/store/boardStore"

interface CreateTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  columnId: string
  boardId: string
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ isOpen, onClose, columnId, boardId }) => {
  const { createTask } = useBoardStore()
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "high" | "medium" | "low",
    status: "todo" as "todo" | "in-progress" | "completed",
    dueDate: "",
  })

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.title.trim()) {
      try {
        await createTask({
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          columnId,
          boardId,
          priority: newTask.priority,
          status: newTask.status,
          dueDate: newTask.dueDate || undefined,
        })
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          status: "todo",
          dueDate: "",
        })
        onClose()
      } catch (error) {
        console.error("Failed to create task:", error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <Label htmlFor="taskTitle" className="text-slate-300">
              Task Title
            </Label>
            <Input
              id="taskTitle"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task title"
              required
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="taskDescription" className="text-slate-300">
              Description
            </Label>
            <Textarea
              id="taskDescription"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Enter task description"
              rows={3}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taskPriority" className="text-slate-300">
                Priority
              </Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: "high" | "medium" | "low") => setNewTask({ ...newTask, priority: value })}
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
              <Label htmlFor="taskStatus" className="text-slate-300">
                Status
              </Label>
              <Select
                value={newTask.status}
                onValueChange={(value: "todo" | "in-progress" | "completed") =>
                  setNewTask({ ...newTask, status: value })
                }
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
            <Label htmlFor="taskDueDate" className="text-slate-300">
              Due Date
            </Label>
            <Input
              id="taskDueDate"
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white focus:ring-blue-500"
            />
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
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
