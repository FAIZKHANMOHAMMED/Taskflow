import axios from "axios"

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api" || "https://taskflowfrontend-vvba.onrender.com/api"

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error("Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message)

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

// Auth API calls
export const authAPI = {
  signup: async (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => {
    try {
      const response = await api.post("/auth/signup", userData)
      return response.data
    } catch (error: any) {
      console.error("Signup error:", error.response?.data || error.message)
      throw error
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post("/auth/login", credentials)
      return response.data
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message)
      throw error
    }
  },
}

// Board API calls
export const boardAPI = {
  getBoards: async () => {
    try {
      const response = await api.get("/boards")
      return response.data
    } catch (error: any) {
      console.error("Get boards error:", error.response?.data || error.message)
      throw error
    }
  },

  createBoard: async (boardData: {
    title: string
    description?: string
    backgroundColor?: string
  }) => {
    try {
      const response = await api.post("/boards", boardData)
      return response.data
    } catch (error: any) {
      console.error("Create board error:", error.response?.data || error.message)
      throw error
    }
  },

  getBoard: async (boardId: string) => {
    try {
      const response = await api.get(`/boards/${boardId}`)
      return response.data
    } catch (error: any) {
      console.error("Get board error:", error.response?.data || error.message)
      throw error
    }
  },

  updateBoard: async (boardId: string, updates: any) => {
    try {
      const response = await api.put(`/boards/${boardId}`, updates)
      return response.data
    } catch (error: any) {
      console.error("Update board error:", error.response?.data || error.message)
      throw error
    }
  },

  deleteBoard: async (boardId: string) => {
    try {
      const response = await api.delete(`/boards/${boardId}`)
      return response.data
    } catch (error: any) {
      console.error("Delete board error:", error.response?.data || error.message)
      throw error
    }
  },
}

// Column API calls
export const columnAPI = {
  createColumn: async (columnData: {
    title: string
    boardId: string
    position: number
    color?: string
  }) => {
    try {
      const response = await api.post("/columns", columnData)
      return response.data
    } catch (error: any) {
      console.error("Create column error:", error.response?.data || error.message)
      throw error
    }
  },

  updateColumn: async (columnId: string, updates: any) => {
    try {
      const response = await api.put(`/columns/${columnId}`, updates)
      return response.data
    } catch (error: any) {
      console.error("Update column error:", error.response?.data || error.message)
      throw error
    }
  },

  deleteColumn: async (columnId: string) => {
    try {
      const response = await api.delete(`/columns/${columnId}`)
      return response.data
    } catch (error: any) {
      console.error("Delete column error:", error.response?.data || error.message)
      throw error
    }
  },
}

// Task API calls
export const taskAPI = {
  createTask: async (taskData: any) => {
    try {
      const response = await api.post("/tasks", taskData)
      return response.data
    } catch (error: any) {
      console.error("Create task error:", error.response?.data || error.message)
      throw error
    }
  },

  updateTask: async (taskId: string, updates: any) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates)
      return response.data
    } catch (error: any) {
      console.error("Update task error:", error.response?.data || error.message)
      throw error
    }
  },

  moveTask: async (taskId: string, moveData: { columnId: string; position: number }) => {
    try {
      const response = await api.put(`/tasks/${taskId}/move`, moveData)
      return response.data
    } catch (error: any) {
      console.error("Move task error:", error.response?.data || error.message)
      throw error
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`)
      return response.data
    } catch (error: any) {
      console.error("Delete task error:", error.response?.data || error.message)
      throw error
    }
  },

  addComment: async (taskId: string, content: string) => {
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, { content })
      return response.data
    } catch (error: any) {
      console.error("Add comment error:", error.response?.data || error.message)
      throw error
    }
  },
}

export default api
