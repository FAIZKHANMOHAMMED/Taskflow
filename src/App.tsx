import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { ProtectedRoute } from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import HomePage from "./pages/HomePage"
import BoardDetail from "./pages/BoardDetail"
import Analytics from "./pages/Analytics"
import TeamSettings from "./pages/TeamSettings"
import NotFound from "./pages/NotFound"
import "./App.css"

function App() {
  return (
    <div className="w-full h-full">
      <Router>
        <div className="App w-full h-full">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/board/:boardId"
              element={
                <ProtectedRoute>
                  <BoardDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <TeamSettings />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>

          <Toaster />
        </div>
      </Router>
    </div>
  )
}

export default App
