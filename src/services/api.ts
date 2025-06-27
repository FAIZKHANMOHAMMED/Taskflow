import axios from "axios"

// Use production backend URL or fallback to local development
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "taskflowfrontend-vvba.onrender.com"
    ? "https://taskflow-sw5r.onrender.com" // Replace with your actual backend URL
    : "http://localhost:5000")

console.log("API Base URL:", API_BASE_URL)

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // 30 second timeout for production
  headers: {
    "Content-Type": "application/json",
  },
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`Making ${config.method?.toUpperCase()} request to:`, config.baseURL + config.url)
    return config
  },
  (error) => {
    console.error("Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// Handle auth errors and network issues
api.interceptors.response.use(
  (response) => {
    console.log(`Response received: ${response.status} from ${response.config.url}`)
    return response
  },
  (error) => {
    console.error("API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    })

    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }

    // Enhance error messages for better UX
    if (error.code === "NETWORK_ERROR" || error.message === "Network Error") {
      error.message = "Unable to connect to server. Please check your internet connection."
    } else if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      error.message = "Request timeout. The server is taking too long to respond."
    } else if (!error.response) {
      error.message = "Server is not responding. Please try again later."
    }

    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log("Attempting login for:", credentials.email)

      // For demo purposes, if backend is not available, use mock data
      if (credentials.email === "demo@taskflow.com" && credentials.password === "demo123") {
        console.log("Using demo credentials - mock login")
        return {
          success: true,
          token: "demo-jwt-token-" + Date.now(),
          user: {
            id: "demo-user-id",
            firstName: "Demo",
            lastName: "User",
            email: "demo@taskflow.com",
            avatar: null,
            role: "admin",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
      }

      const response = await api.post("/auth/login", credentials)
      console.log("Login response:", response.data)

      // Handle different response formats
      if (response.data) {
        // If response has success field
        if (response.data.success !== undefined) {
          return response.data
        }
        // If response has token directly
        if (response.data.token && response.data.user) {
          return {
            success: true,
            token: response.data.token,
            user: response.data.user,
          }
        }
        // If response is just the user data with token
        if (response.data.token) {
          return {
            success: true,
            token: response.data.token,
            user: response.data.user || response.data,
          }
        }
      }

      throw new Error("Invalid response format from server")
    } catch (error: any) {
      console.error("Login error:", error)

      // Handle specific login errors
      if (error.response?.status === 401) {
        throw new Error("Invalid email or password. Please check your credentials.")
      } else if (error.response?.status === 429) {
        throw new Error("Too many login attempts. Please try again later.")
      } else if (error.response?.status >= 500) {
        throw new Error("Server error. Please try again later.")
      } else if (error.message.includes("Network Error") || !error.response) {
        throw new Error("Unable to connect to server. Please check your internet connection.")
      }

      throw error
    }
  },

  register: async (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => {
    try {
      console.log("Attempting registration for:", userData.email)
      const response = await api.post("/auth/register", userData)
      console.log("Registration successful:", response.data)

      // Handle different response formats
      if (response.data) {
        if (response.data.success !== undefined) {
          return response.data
        }
        if (response.data.token && response.data.user) {
          return {
            success: true,
            token: response.data.token,
            user: response.data.user,
          }
        }
      }

      return response.data
    } catch (error: any) {
      console.error("Registration error:", error)

      if (error.response?.status === 409) {
        throw new Error("An account with this email already exists.")
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || "Invalid registration data.")
      } else if (error.response?.status >= 500) {
        throw new Error("Server error. Please try again later.")
      }

      throw error
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile")
      return response.data
    } catch (error: any) {
      console.error("Get profile error:", error)
      throw error
    }
  },

  updateProfile: async (userData: any) => {
    try {
      const response = await api.put("/auth/profile", userData)
      return response.data
    } catch (error: any) {
      console.error("Update profile error:", error)
      throw error
    }
  },
}

// Board API
export const boardAPI = {
  getBoards: async () => {
    try {
      const response = await api.get("/boards")
      return response.data
    } catch (error: any) {
      console.error("Get boards error:", error)
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
      console.error("Create board error:", error)
      throw error
    }
  },

  getBoard: async (boardId: string) => {
    try {
      const response = await api.get(`/boards/${boardId}`)
      return response.data
    } catch (error: any) {
      console.error("Get board error:", error)
      throw error
    }
  },

  updateBoard: async (boardId: string, updates: any) => {
    try {
      const response = await api.put(`/boards/${boardId}`, updates)
      return response.data
    } catch (error: any) {
      console.error("Update board error:", error)
      throw error
    }
  },

  deleteBoard: async (boardId: string) => {
    try {
      const response = await api.delete(`/boards/${boardId}`)
      return response.data
    } catch (error: any) {
      console.error("Delete board error:", error)
      throw error
    }
  },

  addMember: async (boardId: string, memberData: { email: string; role: string }) => {
    try {
      const response = await api.post(`/boards/${boardId}/members`, memberData)
      return response.data
    } catch (error: any) {
      console.error("Add member error:", error)
      throw error
    }
  },

  removeMember: async (boardId: string, userId: string) => {
    try {
      const response = await api.delete(`/boards/${boardId}/members/${userId}`)
      return response.data
    } catch (error: any) {
      console.error("Remove member error:", error)
      throw error
    }
  },
}

// Column API
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
      console.error("Create column error:", error)
      throw error
    }
  },

  updateColumn: async (columnId: string, updates: any) => {
    try {
      const response = await api.put(`/columns/${columnId}`, updates)
      return response.data
    } catch (error: any) {
      console.error("Update column error:", error)
      throw error
    }
  },

  deleteColumn: async (columnId: string) => {
    try {
      const response = await api.delete(`/columns/${columnId}`)
      return response.data
    } catch (error: any) {
      console.error("Delete column error:", error)
      throw error
    }
  },

  reorderColumns: async (boardId: string, columnIds: string[]) => {
    try {
      const response = await api.put(`/columns/reorder`, { boardId, columnIds })
      return response.data
    } catch (error: any) {
      console.error("Reorder columns error:", error)
      throw error
    }
  },
}

// Task API
export const taskAPI = {
  createTask: async (taskData: {
    title: string
    description?: string
    columnId: string
    boardId: string
    priority?: "high" | "medium" | "low"
    status?: "todo" | "in-progress" | "completed"
    dueDate?: string
    assignee?: string
  }) => {
    try {
      const response = await api.post("/tasks", taskData)
      return response.data
    } catch (error: any) {
      console.error("Create task error:", error)
      throw error
    }
  },

  updateTask: async (taskId: string, updates: any) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates)
      return response.data
    } catch (error: any) {
      console.error("Update task error:", error)
      throw error
    }
  },

  moveTask: async (taskId: string, moveData: { columnId: string; position: number }) => {
    try {
      const response = await api.put(`/tasks/${taskId}/move`, moveData)
      return response.data
    } catch (error: any) {
      console.error("Move task error:", error)
      throw error
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`)
      return response.data
    } catch (error: any) {
      console.error("Delete task error:", error)
      throw error
    }
  },

  addComment: async (taskId: string, content: string) => {
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, { content })
      return response.data
    } catch (error: any) {
      console.error("Add comment error:", error)
      throw error
    }
  },

  deleteComment: async (taskId: string, commentId: string) => {
    try {
      const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`)
      return response.data
    } catch (error: any) {
      console.error("Delete comment error:", error)
      throw error
    }
  },
}

// Test API connection
export const testConnection = async () => {
  try {
    console.log("Testing API connection...")
    const response = await api.get("/health")
    console.log("API connection successful:", response.data)
    return true
  } catch (error) {
    console.error("API connection failed:", error)
    return false
  }
}

export default api
