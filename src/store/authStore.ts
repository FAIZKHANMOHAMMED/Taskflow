import { create } from "zustand"
import { persist } from "zustand/middleware"
import { authAPI } from "../services/api"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string | null
  role?: string
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => void
  clearError: () => void
  setUser: (user: User) => void
  updateProfile: (userData: Partial<User>) => Promise<void>
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
          console.log("AuthStore: Attempting login for:", email)
          const response = await authAPI.login({ email, password })

          console.log("AuthStore: Login response:", response)

          if (response.success && response.token && response.user) {
            // Store token and user data
            localStorage.setItem("token", response.token)
            localStorage.setItem("user", JSON.stringify(response.user))

            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })

            console.log("AuthStore: Login successful")
          } else {
            throw new Error("Invalid response format")
          }
        } catch (error: any) {
          console.error("AuthStore: Login failed:", error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || "Login failed",
          })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })

        try {
          console.log("AuthStore: Attempting registration for:", userData.email)
          const response = await authAPI.register(userData)

          if (response.success && response.token && response.user) {
            // Store token and user data
            localStorage.setItem("token", response.token)
            localStorage.setItem("user", JSON.stringify(response.user))

            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })

            console.log("AuthStore: Registration successful")
          } else {
            throw new Error("Invalid response format")
          }
        } catch (error: any) {
          console.error("AuthStore: Registration failed:", error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || "Registration failed",
          })
          throw error
        }
      },

      logout: () => {
        console.log("AuthStore: Logging out")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      },

      clearError: () => {
        set({ error: null })
      },

      setUser: (user: User) => {
        localStorage.setItem("user", JSON.stringify(user))
        set({ user })
      },

      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authAPI.updateProfile(userData)
          const updatedUser = response.user || response

          localStorage.setItem("user", JSON.stringify(updatedUser))
          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          console.error("AuthStore: Update profile failed:", error)
          set({
            isLoading: false,
            error: error.message || "Failed to update profile",
          })
          throw error
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
