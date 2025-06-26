import axios from "axios"

const API_BASE_URL = "http://localhost:5000/api"

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
    return Promise.reject(error)
  },
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
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
    const response = await api.post("/auth/signup", userData)
    return response.data
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post("/auth/login", credentials)
    return response.data
  },
}

// Board API calls
export const boardAPI = {
  getBoards: async () => {
    const response = await api.get("/boards")
    return response.data
  },

  createBoard: async (boardData: {
    title: string
    description?: string
    backgroundColor?: string
  }) => {
    const response = await api.post("/boards", boardData)
    return response.data
  },

  getBoard: async (boardId: string) => {
    const response = await api.get(`/boards/${boardId}`)
    return response.data
  },

  updateBoard: async (boardId: string, updates: any) => {
    const response = await api.put(`/boards/${boardId}`, updates)
    return response.data
  },

  deleteBoard: async (boardId: string) => {
    const response = await api.delete(`/boards/${boardId}`)
    return response.data
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
    const response = await api.post("/columns", columnData)
    return response.data
  },

  updateColumn: async (columnId: string, updates: any) => {
    const response = await api.put(`/columns/${columnId}`, updates)
    return response.data
  },

  deleteColumn: async (columnId: string) => {
    const response = await api.delete(`/columns/${columnId}`)
    return response.data
  },
}

// Task API calls
export const taskAPI = {
  createTask: async (taskData: any) => {
    const response = await api.post("/tasks", taskData)
    return response.data
  },

  updateTask: async (taskId: string, updates: any) => {
    const response = await api.put(`/tasks/${taskId}`, updates)
    return response.data
  },

  moveTask: async (taskId: string, moveData: { columnId: string; position: number }) => {
    const response = await api.put(`/tasks/${taskId}/move`, moveData)
    return response.data
  },

  deleteTask: async (taskId: string) => {
    const response = await api.delete(`/tasks/${taskId}`)
    return response.data
  },

  addComment: async (taskId: string, content: string) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content })
    return response.data
  },
}

export default api
