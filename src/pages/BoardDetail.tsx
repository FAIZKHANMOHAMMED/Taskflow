"use client"

import React, { useState, useEffect } from "react"
import { v4 as uuidv4 } from 'uuid'
import { useParams, Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, Menu } from "lucide-react"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useTaskStore, type Task } from "@/store/taskStore"
import { useBoardStore } from "@/store/boardStore"
import { TaskColumn } from "@/components/TaskColumn"
import { TaskCard } from "@/components/TaskCard"
import { CreateTaskDialog } from "@/components/CreateTaskDialog"
import { SearchBar, type SearchFilters } from "@/components/SearchBar"
import { useSearch } from "@/hooks/useSearch"
import { useIsMobile } from "@/hooks/use-mobile"

const BoardDetail = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { 
    currentBoard: board, 
    columns: allColumns, 
    fetchBoard, 
    isLoading 
  } = useBoardStore()
  const {
    getTasksByColumnId,
    addColumn,
    deleteColumn,
    moveTask,
  } = useTaskStore()

  // Fetch board data when component mounts or boardId changes
  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId).catch(() => {
        // Handle error if board is not found
      })
    }
  }, [boardId, fetchBoard])

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isCreateColumnDialogOpen, setIsCreateColumnDialogOpen] = useState(false)
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<string>("")
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({})
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 10 : 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: isMobile ? 150 : 0,
        tolerance: isMobile ? 10 : 5,
      },
    }),
  )

  // Use the columns from boardStore which are already filtered by boardId
  const allTasks = allColumns.flatMap((column) => getTasksByColumnId(column._id))

  // Use search hook
  const {
    tasks: filteredTasks,
    columns: filteredColumns,
    totalResults,
    availableAssignees,
    availableCreators,
  } = useSearch(allTasks, allColumns, searchQuery, searchFilters)

  const hasActiveSearch = searchQuery.length > 0 || Object.keys(searchFilters).length > 0

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (newColumnTitle.trim()) {
      addColumn({
        id: uuidv4(),
        title: newColumnTitle.trim(),
        boardId,
        position: allColumns.length,
      })
      setNewColumnTitle("")
      setIsCreateColumnDialogOpen(false)
      if (isMobile && "vibrate" in navigator) {
        navigator.vibrate(25)
      }
    }
  }

  const handleDeleteColumn = (columnId: string) => {
    if (window.confirm("Are you sure you want to delete this column? All tasks in this column will also be deleted.")) {
      deleteColumn(columnId)
      if (isMobile && "vibrate" in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === "task") {
      setActiveTask(active.data.current.task)

      // Add haptic feedback for mobile devices
      if (isMobile && "vibrate" in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === "task") {
      const activeTaskId = active.id as string
      const activeColumnId = active.data.current?.columnId

      if (overType === "column") {
        const overColumnId = over.id as string
        const overTasks = useTaskStore.getState().getTasksByColumnId(overColumnId)
        moveTask(activeTaskId, activeColumnId, overColumnId, overTasks.length)
      } else if (overType === "task") {
        const overTask = over.data.current?.task
        const overColumnId = overTask.columnId
        const overTasks = useTaskStore.getState().getTasksByColumnId(overColumnId)
        const overIndex = overTasks.findIndex((task) => task.id === overTask.id)
        moveTask(activeTaskId, activeColumnId, overColumnId, overIndex)
      }

      // Add success haptic feedback for mobile
      if (isMobile && "vibrate" in navigator) {
        navigator.vibrate(25)
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === "task" && overType === "task") {
      const activeTaskId = active.id as string
      const overTask = over.data.current?.task
      const activeColumnId = active.data.current?.columnId
      const overColumnId = overTask.columnId

      if (activeColumnId !== overColumnId) {
        const overTasks = useTaskStore.getState().getTasksByColumnId(overColumnId)
        const overIndex = overTasks.findIndex((task) => task.id === overTask.id)
        moveTask(activeTaskId, activeColumnId, overColumnId, overIndex)
      }
    }
  }

  // Get tasks for each column (filtered or all)
  const getColumnTasks = (columnId: string) => {
    if (hasActiveSearch) {
      return filteredTasks.filter((task) => task.columnId === columnId)
    }
    return getTasksByColumnId(columnId)
  }

  // Determine which columns to show
  const columnsToShow = hasActiveSearch ? filteredColumns : allColumns

  const MobileActions = () => (
    <div className="space-y-3 p-4">
      <Button
        onClick={() => setIsCreateColumnDialogOpen(true)}
        variant="outline"
        className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Column
      </Button>
      <Button
        onClick={() => setIsCreateTaskDialogOpen(true)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Task
      </Button>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-pulse text-slate-400">Loading board...</div>
      </div>
    )
  }

  if (!boardId || !board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="text-center animate-in fade-in-0 zoom-in-95 max-w-md mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl border border-slate-600">
            😔
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-100 mb-4">Board not found</h1>
          <Link
            to="/"
            className="text-blue-400 hover:text-blue-300 transition-colors hover:underline text-sm sm:text-base"
          >
            ← Back to Boards
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-in fade-in-0">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="flex flex-col space-y-4 sm:space-y-6 animate-in slide-in-from-top-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col space-y-3 w-full lg:w-auto">
              <Link
                to="/"
                className="flex items-center text-slate-400 hover:text-blue-400 transition-all duration-200 hover:scale-105 group text-sm sm:text-base self-start"
              >
                <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Boards
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                  {board.title}
                </h1>
                {board.description && (
                  <p
                    className="text-sm sm:text-base text-slate-400 mt-1 animate-in slide-in-from-left-2 line-clamp-2"
                    style={{ animationDelay: "200ms" }}
                  >
                    {board.description}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-2 animate-in slide-in-from-right-4 w-full lg:w-auto">
              <Dialog open={isCreateColumnDialogOpen} onOpenChange={setIsCreateColumnDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="hover:bg-slate-700 hover:border-blue-400 transition-all duration-200 hover:scale-105 w-full lg:w-auto border-slate-600 text-slate-300 hover:text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Column
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md mx-4 animate-in fade-in-0 zoom-in-95 bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-slate-100">Create New Column</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateColumn} className="space-y-4">
                    <div>
                      <Label htmlFor="columnTitle" className="text-slate-300">
                        Column Title
                      </Label>
                      <Input
                        id="columnTitle"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        placeholder="Enter column title"
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateColumnDialogOpen(false)}
                        className="hover:bg-slate-700 transition-colors w-full sm:w-auto border-slate-600 text-slate-300 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors w-full sm:w-auto"
                      >
                        Create Column
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                onClick={() => setIsCreateTaskDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl w-full lg:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="sm:hidden w-full">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:text-white">
                    <Menu className="w-4 h-4 mr-2" />
                    Actions
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-slate-900 border-slate-700 text-white">
                  <MobileActions />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Search Bar */}
          <div className="animate-in slide-in-from-top-4" style={{ animationDelay: "300ms" }}>
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={searchFilters}
              onFiltersChange={setSearchFilters}
              availableAssignees={availableAssignees}
              availableCreators={availableCreators}
              resultsCount={hasActiveSearch ? totalResults : undefined}
            />
          </div>

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            <div
              className={`flex ${
                isMobile ? "space-x-3" : "space-x-4 lg:space-x-6"
              } overflow-x-auto pb-4 lg:pb-6 -mx-3 sm:-mx-4 lg:-mx-8 px-3 sm:px-4 lg:px-8 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800`}
            >
              <SortableContext items={columnsToShow.map((col) => col._id)} strategy={horizontalListSortingStrategy}>
                {columnsToShow.map((column, index) => {
                  const columnTasks = getColumnTasks(column._id)
                  const isColumnFiltered =
                    hasActiveSearch &&
                    (column.title.toLowerCase().includes(searchQuery.toLowerCase()) || columnTasks.length > 0)

                  return (
                    <div
                      key={column._id}
                      className="animate-in slide-in-from-bottom-4 flex-shrink-0"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <TaskColumn
                        column={column}
                        boardId={boardId}
                        tasks={columnTasks}
                        onDeleteColumn={handleDeleteColumn}
                        onCreateTask={(columnId) => {
                          setSelectedColumnId(columnId)
                          setIsCreateTaskDialogOpen(true)
                        }}
                        searchQuery={searchQuery}
                        isFiltered={!hasActiveSearch || isColumnFiltered}
                      />
                    </div>
                  )
                })}
              </SortableContext>

              {columnsToShow.length === 0 && (
                <div className="flex-1 flex items-center justify-center py-12 lg:py-16 animate-in fade-in-0 zoom-in-95">
                  <div className="text-center px-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl animate-bounce border border-slate-600">
                      {hasActiveSearch ? "🔍" : "📋"}
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-slate-100 mb-2">
                      {hasActiveSearch ? "No results found" : "No columns yet"}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-400 mb-4">
                      {hasActiveSearch
                        ? "Try adjusting your search terms or filters"
                        : "Create your first column to start organizing tasks"}
                    </p>
                    {!hasActiveSearch && (
                      <Button
                        onClick={() => setIsCreateColumnDialogOpen(true)}
                        variant="outline"
                        className="hover:bg-slate-700 hover:border-blue-400 transition-all duration-200 hover:scale-105 border-slate-600 text-slate-300 hover:text-white w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Column
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
          </DndContext>

          <CreateTaskDialog
            isOpen={isCreateTaskDialogOpen}
            onClose={() => {
              setIsCreateTaskDialogOpen(false)
              setSelectedColumnId("")
            }}
            boardId={boardId}
            columnId={selectedColumnId}
          />
        </div>
      </div>
    </div>
  )
}

export default BoardDetail
