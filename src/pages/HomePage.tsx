"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Plus,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Home,
  Kanban,
} from "lucide-react"
import { useAuthStore } from "../store/authStore"
import { useBoardStore } from "../store/boardStore"

const HomePage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { boards, tasks, fetchBoards, createBoard, deleteBoard, isLoading } = useBoardStore()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [newBoard, setNewBoard] = useState({
    title: "",
    description: "",
    backgroundColor: "#1e293b",
  })

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoard.title.trim()) return

    try {
      await createBoard(newBoard)
      setNewBoard({ title: "", description: "", backgroundColor: "#1e293b" })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Failed to create board:", error)
    }
  }

  const handleDeleteBoard = async (boardId: string, boardTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${boardTitle}"? This action cannot be undone.`)) {
      try {
        await deleteBoard(boardId)
      } catch (error) {
        console.error("Failed to delete board:", error)
      }
    }
  }

  const handleSignOut = () => {
    logout()
    navigate("/login")
  }

  // Calculate stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length
  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate) return false
    return new Date(task.dueDate) < new Date() && task.status !== "completed"
  }).length

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const getUserInitials = (user: any) => {
    if (!user) return "U"
    const firstName = user.firstName || ""
    const lastName = user.lastName || ""
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"
  }

  const MobileMenu = () => (
    <div className="flex flex-col h-full">
      {/* User Profile Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-2">
        <Link
          to="/"
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Home className="w-5 h-5 mr-3" />
          Dashboard
        </Link>
        <Link
          to="/analytics"
          className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <BarChart3 className="w-5 h-5 mr-3" />
          Analytics
        </Link>
        <Link
          to="/team"
          className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Users className="w-5 h-5 mr-3" />
          Team Settings
        </Link>
      </div>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-slate-700">
        <Button onClick={handleSignOut} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-slate-900 border-slate-700 text-white p-0">
                <MobileMenu />
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back, {user?.firstName || "User"}!</h1>
              <p className="text-slate-400 mt-1">Here's what's happening with your projects today.</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/analytics">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link to="/team">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                <Settings className="w-4 h-4 mr-2" />
                Team
              </Button>
            </Link>
            <Avatar className="h-8 w-8 cursor-pointer" onClick={handleSignOut}>
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalTasks}</div>
              <p className="text-xs text-slate-400">Across all boards</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{inProgressTasks}</div>
              <p className="text-xs text-slate-400">Currently active</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{completedTasks}</div>
              <p className="text-xs text-slate-400">{completionRate}% completion rate</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Overdue</CardTitle>
              <Calendar className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overdueTasks}</div>
              <p className="text-xs text-slate-400">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Boards Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Your Boards</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Board</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBoard} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-slate-300">
                    Board Title
                  </Label>
                  <Input
                    id="title"
                    value={newBoard.title}
                    onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                    placeholder="Enter board title"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-slate-300">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    value={newBoard.description}
                    onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                    placeholder="Enter board description"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-slate-600 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Create Board
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Boards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => {
            const boardTasks = tasks.filter((task) => task.boardId === board._id)
            const boardCompletedTasks = boardTasks.filter((task) => task.status === "completed")
            const boardProgress =
              boardTasks.length > 0 ? Math.round((boardCompletedTasks.length / boardTasks.length) * 100) : 0

            return (
              <Card
                key={board._id}
                className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/board/${board._id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white group-hover:text-blue-400 transition-colors">
                      {board.title}
                    </CardTitle>
                    <Kanban className="h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  {board.description && (
                    <CardDescription className="text-slate-400 line-clamp-2">{board.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-slate-300">
                        <span className="font-medium">{boardTasks.length}</span> tasks
                      </div>
                      <div className="text-sm text-slate-300">
                        <span className="font-medium">{board.members.length}</span> members
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                      {boardProgress}% complete
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${boardProgress}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-slate-400">
                      Updated {new Date(board.updatedAt).toLocaleDateString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteBoard(board._id, board.title)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {boards.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Kanban className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No boards yet</h3>
              <p className="text-slate-400 mb-6 max-w-md">
                Create your first board to start organizing your tasks and collaborating with your team.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Board
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage
