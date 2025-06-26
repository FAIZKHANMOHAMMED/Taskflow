"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { type Column, useBoardStore } from "@/store/boardStore"
import { TaskCard } from "./TaskCard"
import { CreateTaskDialog } from "./CreateTaskDialog"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

interface TaskColumnProps {
  column: Column
  boardId: string
  tasks?: any[] // Optional since we're also getting tasks from the store
  onDeleteColumn?: (columnId: string) => void
  onCreateTask?: (columnId: string) => void
  searchQuery?: string
  isFiltered?: boolean
}

export const TaskColumn: React.FC<TaskColumnProps> = ({ column, boardId }) => {
  const { getTasksByColumnId } = useBoardStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const tasks = getTasksByColumnId(column._id)
  const taskIds = tasks.map((task) => task._id)

  const { setNodeRef } = useDroppable({
    id: column._id,
  })

  const getColumnColor = () => {
    if (column.color) return column.color

    // Default colors based on common column names
    const title = column.title.toLowerCase()
    if (title.includes("todo") || title.includes("backlog")) return "bg-slate-50 border-slate-200"
    if (title.includes("progress") || title.includes("doing")) return "bg-blue-50 border-blue-200"
    if (title.includes("done") || title.includes("complete")) return "bg-green-50 border-green-200"
    if (title.includes("review") || title.includes("testing")) return "bg-yellow-50 border-yellow-200"

    return "bg-gray-50 border-gray-200"
  }

  return (
    <>
      <Card className={`w-80 flex-shrink-0 ${getColumnColor()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              {column.title}
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div ref={setNodeRef} className="space-y-3 min-h-[200px] pb-4">
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </SortableContext>

            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm text-center">No tasks yet</p>
                <p className="text-xs text-center mt-1">Click + to add a task</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        columnId={column._id}
        boardId={boardId}
      />
    </>
  )
}
