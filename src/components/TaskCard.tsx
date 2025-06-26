"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar, Check, Clock, MoreVertical, Pencil, Play, Trash2, User } from "lucide-react"
import { type Task, useBoardStore } from "@/store/boardStore"
import { EditTaskDialog } from "./EditTaskDialog"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TaskCardProps {
  task: Task
  isOverlay?: boolean
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, isOverlay = false }) => {
  const { deleteTask, updateTask } = useBoardStore()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleDeleteTask = async () => {
    try {
      await deleteTask(task._id)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const handleStatusChange = async (newStatus: "todo" | "in-progress" | "completed") => {
    try {
      // First update the task status
      await updateTask(task._id, { status: newStatus })
      
      // Find the target column based on status
      const { columns, getTasksByColumnId, moveTask } = useBoardStore.getState()
      
      // Try to find a column that matches the status
      const findMatchingColumn = (status: string) => {
        const statusMap: Record<string, string[]> = {
          'todo': ['todo', 'backlog', 'to do'],
          'in-progress': ['in-progress', 'in progress', 'doing', 'in work', 'wip'],
          'completed': ['done', 'complete', 'finished', 'completed']
        }
        
        const searchTerms = statusMap[status] || []
        
        return columns.find(column => {
          const columnName = column.title.toLowerCase()
          return searchTerms.some(term => columnName.includes(term))
        })
      }
      
      // Find the target column
      let targetColumn = findMatchingColumn(newStatus)
      
      // If no column matches, try to find any column that might be relevant
      if (!targetColumn) {
        targetColumn = columns.find(col => 
          col.title.toLowerCase().includes(newStatus.replace('-', ''))
        )
      }
      
      // If we found a target column and it's different from current, move the task
      if (targetColumn && targetColumn._id !== task.columnId) {
        // Get current tasks in the target column to determine position
        const targetTasks = getTasksByColumnId(targetColumn._id)
        const newPosition = targetTasks.length // Add to the end of the target column
        
        // Move the task to the new column
        await moveTask(task._id, targetColumn._id, newPosition)
      }
    } catch (error) {
      console.error("Failed to update task status or move task:", error)
    }
  }

  const getStatusButtonProps = (status: string) => {
    switch (status) {
      case 'todo':
        return {
          icon: <Play className="w-3 h-3 mr-1" />,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          nextStatus: 'in-progress' as const,
          label: 'Start Progress'
        }
      case 'in-progress':
        return {
          icon: <Check className="w-3 h-3 mr-1" />,
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          nextStatus: 'completed' as const,
          label: 'Mark Complete'
        }
      case 'completed':
        return {
          icon: <Clock className="w-3 h-3 mr-1" />,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          nextStatus: 'todo' as const,
          label: 'Reopen'
        }
      default:
        return {
          icon: <Play className="w-3 h-3 mr-1" />,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
          nextStatus: 'todo' as const,
          label: 'Start'
        }
    }
  }

  const statusButton = getStatusButtonProps(task.status)

  const getUserDisplayName = (user: { firstName: string; lastName: string; email: string }) => {
    return `${user.firstName} ${user.lastName}`.trim() || user.email
  }

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
      <Card
        className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
          isOverlay ? 'shadow-xl scale-105' : 'cursor-grab active:cursor-grabbing'
        } ${isDragging ? 'ring-2 ring-blue-500' : ''} group`}
        {...attributes}
        {...listeners}
      >
        {/* Status indicator */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            task.status === 'completed'
              ? 'bg-green-500'
              : task.status === 'in-progress'
              ? 'bg-blue-500'
              : 'bg-gray-400'
          }`}
        />

        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-3 pt-0">
          {/* Status button */}
          <div className="mb-2">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs h-7 px-2 ${statusButton.className} border-0`}
              onClick={() => handleStatusChange(statusButton.nextStatus)}
            >
              {statusButton.icon}
              {statusButton.label}
            </Button>
          </div>

          {/* Task details */}
          {task.description && <p className="text-xs text-slate-600 mb-2 line-clamp-2">{task.description}</p>}
          
          <div className="space-y-2 mt-2">
            {task.dueDate && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            
            <div className="flex items-center text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span className="truncate">
                {task.assignee 
                  ? `Assigned to: ${task.assignee.firstName} ${task.assignee.lastName}`
                  : `Created by: ${getUserDisplayName(task.creator)}`
                }
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 pt-1">
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${
                task.priority === 'high' 
                  ? 'bg-red-100 text-red-800 border-red-200' 
                  : task.priority === 'medium' 
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-green-100 text-green-800 border-green-200'
              }`}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${
                task.status === 'completed'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : task.status === 'in-progress'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {task.status.replace('-', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTaskDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        task={task}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
