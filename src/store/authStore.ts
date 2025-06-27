import { create } from "zustand"
import { persist } from "zustand/middleware"
import { authAPI } from "../services/api"

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar?: string
  preferences?: {
    theme: string
    notifications: {
      email: boolean
      push: boolean
    }
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  signup: (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => void
  clearError: () => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          console.log("Attempting login for:", email)
          const response = await authAPI.login({ email, password })
          console.log("Login response:", response)

          const { token, user } = response

          if (!token || !user) {
            throw new Error("Invalid response from server")
          }

          // Store token in localStorage
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(user))

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          console.log("Login successful")
        } catch (error: any) {
          console.error("Login error:", error)

          let errorMessage = "Login failed. Please try again."

          if (error.response?.data?.message) {
            errorMessage = error.response.data.message
          } else if (error.response?.data?.errors) {
            errorMessage = error.response.data.errors[0]?.msg || errorMessage
          } else if (error.message) {
            errorMessage = error.message
          } else if (error.code === "NETWORK_ERROR" || error.code === "ERR_NETWORK") {
            errorMessage = "Unable to connect to server. Please check your internet connection."
          }

          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
          })

          throw error
        }
      },

      signup: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          console.log("Attempting signup for:", userData.email)
          const response = await authAPI.signup(userData)
          console.log("Signup response:", response)

          const { token, user } = response

          if (!token || !user) {
            throw new Error("Invalid response from server")
          }

          // Store token in localStorage
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(user))

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          console.log("Signup successful")
        } catch (error: any) {
          console.error("Signup error:", error)

          let errorMessage = "Signup failed. Please try again."

          if (error.response?.data?.message) {
            errorMessage = error.response.data.message
          } else if (error.response?.data?.errors) {
            errorMessage = error.response.data.errors[0]?.msg || errorMessage
          } else if (error.message) {
            errorMessage = error.message
          } else if (error.code === "NETWORK_ERROR" || error.code === "ERR_NETWORK") {
            errorMessage = "Unable to connect to server. Please check your internet connection."
          }

          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
          })

          throw error
        }
      },

      logout: () => {
        console.log("Logging out user")

        // Clear localStorage
        localStorage.removeItem("token")
        localStorage.removeItem("user")

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      clearError: () => {
        set({ error: null })
      },

      initializeAuth: () => {
        try {
          const token = localStorage.getItem("token")
          const userStr = localStorage.getItem("user")

          if (token && userStr) {
            const user = JSON.parse(userStr)
            console.log("Initializing auth with stored data:", { user: user.email, hasToken: !!token })

            set({
              user,
              token,
              isAuthenticated: true,
            })
          } else {
            console.log("No stored auth data found")
          }
        } catch (error) {
          console.error("Error initializing auth:", error)
          // Invalid stored data, clear it
          localStorage.removeItem("token")
          localStorage.removeItem("user")

          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
