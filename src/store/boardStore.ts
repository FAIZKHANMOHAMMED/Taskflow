import { create } from "zustand"
import { boardAPI, taskAPI } from "../services/api"

export interface Task {
  _id: string
  title: string
  description?: string
  creator: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  assignee?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  priority: "high" | "medium" | "low"
  status: "todo" | "in-progress" | "completed"
  dueDate?: string
  columnId: string
  boardId: string
  position: number
  tags?: string[]
  comments?: Array<{
    author: {
      _id: string
      firstName: string
      lastName: string
      email: string
    }
    content: string
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
}

export interface Column {
  _id: string
  title: string
  boardId: string
  position: number
  color?: string
  createdAt: string
  updatedAt: string
}

export interface Board {
  _id: string
  title: string
  description?: string
  createdBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  members: Array<{
    user: {
      _id: string
      firstName: string
      lastName: string
      email: string
    }
    role: "owner" | "admin" | "member"
    joinedAt: string
  }>
  backgroundColor?: string
  createdAt: string
  updatedAt: string
}

interface BoardStore {
  // State
  boards: Board[]
  currentBoard: Board | null
  columns: Column[]
  tasks: Task[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchBoards: () => Promise<void>
  fetchBoard: (boardId: string) => Promise<void>
  createBoard: (boardData: { title: string; description?: string; backgroundColor?: string }) => Promise<void>
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>
  deleteBoard: (boardId: string) => Promise<void>

  createTask: (taskData: {
    title: string
    description?: string
    columnId: string
    boardId: string
    priority?: "high" | "medium" | "low"
    status?: "todo" | "in-progress" | "completed"
    dueDate?: string
    assignee?: string
  }) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  moveTask: (taskId: string, columnId: string, position: number) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  addComment: (taskId: string, content: string) => Promise<void>

  // Getters
  getColumnsByBoardId: (boardId: string) => Column[]
  getTasksByColumnId: (columnId: string) => Task[]
  getColumnById: (columnId: string) => Column | undefined

  // Utils
  clearError: () => void
  setCurrentBoard: (board: Board | null) => void
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  // Initial state
  boards: [],
  currentBoard: null,
  columns: [],
  tasks: [],
  isLoading: false,
  error: null,

  // Fetch all boards for the user
  fetchBoards: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await boardAPI.getBoards()

      // Also fetch all tasks for the dashboard
      const allTasks: Task[] = []
      const allColumns: Column[] = []

      for (const board of response.data) {
        try {
          const boardResponse = await boardAPI.getBoard(board._id)
          allColumns.push(...boardResponse.data.columns)
          allTasks.push(...boardResponse.data.tasks)
        } catch (error) {
          console.error(`Failed to fetch data for board ${board._id}:`, error)
        }
      }

      set({
        boards: response.data,
        tasks: allTasks,
        columns: allColumns,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch boards",
        isLoading: false,
      })
    }
  },

  // Fetch a specific board with its columns and tasks
  fetchBoard: async (boardId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await boardAPI.getBoard(boardId)
      const { board, columns, tasks } = response.data
      set({
        currentBoard: board,
        columns,
        tasks,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch board",
        isLoading: false,
      })
    }
  },

  // Create a new board
  createBoard: async (boardData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await boardAPI.createBoard(boardData)
      const { board, columns } = response.data
      set((state) => ({
        boards: [...state.boards, board],
        columns: [...state.columns, ...columns],
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create board",
        isLoading: false,
      })
      throw error
    }
  },

  // Update a board
  updateBoard: async (boardId: string, updates) => {
    set({ isLoading: true, error: null })
    try {
      const response = await boardAPI.updateBoard(boardId, updates)
      const updatedBoard = response.data
      set((state) => ({
        boards: state.boards.map((board) => (board._id === boardId ? updatedBoard : board)),
        currentBoard: state.currentBoard?._id === boardId ? updatedBoard : state.currentBoard,
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update board",
        isLoading: false,
      })
      throw error
    }
  },

  // Delete a board
  deleteBoard: async (boardId: string) => {
    set({ isLoading: true, error: null })
    try {
      await boardAPI.deleteBoard(boardId)
      set((state) => ({
        boards: state.boards.filter((board) => board._id !== boardId),
        currentBoard: state.currentBoard?._id === boardId ? null : state.currentBoard,
        columns: state.columns.filter((column) => column.boardId !== boardId),
        tasks: state.tasks.filter((task) => task.boardId !== boardId),
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to delete board",
        isLoading: false,
      })
      throw error
    }
  },

  // Create a new task
  createTask: async (taskData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await taskAPI.createTask(taskData)
      const newTask = response.data
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create task",
        isLoading: false,
      })
      throw error
    }
  },

  // Update a task
  updateTask: async (taskId: string, updates) => {
    set({ isLoading: true, error: null })
    try {
      const response = await taskAPI.updateTask(taskId, updates)
      const updatedTask = response.data
      set((state) => ({
        tasks: state.tasks.map((task) => (task._id === taskId ? updatedTask : task)),
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update task",
        isLoading: false,
      })
      throw error
    }
  },

  // Move a task to a different column or position
  moveTask: async (taskId: string, columnId: string, position: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await taskAPI.moveTask(taskId, { columnId, position })
      const updatedTask = response.data
      set((state) => ({
        tasks: state.tasks.map((task) => (task._id === taskId ? updatedTask : task)),
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to move task",
        isLoading: false,
      })
      throw error
    }
  },

  // Delete a task
  deleteTask: async (taskId: string) => {
    set({ isLoading: true, error: null })
    try {
      await taskAPI.deleteTask(taskId)
      set((state) => ({
        tasks: state.tasks.filter((task) => task._id !== taskId),
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to delete task",
        isLoading: false,
      })
      throw error
    }
  },

  // Add a comment to a task
  addComment: async (taskId: string, content: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await taskAPI.addComment(taskId, content)
      const newComment = response.data
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task._id === taskId ? { ...task, comments: [...(task.comments || []), newComment] } : task,
        ),
        isLoading: false,
      }))
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to add comment",
        isLoading: false,
      })
      throw error
    }
  },

  // Getters
  getColumnsByBoardId: (boardId: string) =>
    get()
      .columns.filter((column) => column.boardId === boardId)
      .sort((a, b) => a.position - b.position),

  getTasksByColumnId: (columnId: string) =>
    get()
      .tasks.filter((task) => task.columnId === columnId)
      .sort((a, b) => a.position - b.position),

  getColumnById: (columnId: string) => get().columns.find((column) => column._id === columnId),

  // Utils
  clearError: () => set({ error: null }),
  setCurrentBoard: (board: Board | null) => set({ currentBoard: board }),
}))
