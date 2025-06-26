"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Calendar, User, Trash2, Clock, CheckCircle2, AlertCircle, TrendingUp, BarChart3, Target, Users, Zap, ArrowRight, Search, Grid3X3, List, Settings, Menu, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBoardStore } from "@/store/boardStore"
import { useAuthStore } from "@/store/authStore"
import { format, isToday, isThisWeek, isPast } from "date-fns"

const BoardView = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { 
    boards, 
    tasks, 
    columns, 
    isLoading, 
    error, 
    fetchBoards, 
    createBoard, 
    deleteBoard,
    clearError
  } = useBoardStore()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [newBoard, setNewBoard] = useState({
    title: "",
    description: "",
  })

  // Fetch boards when component mounts
  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newBoard.title.trim()) {
      try {
        await createBoard({
          title: newBoard.title.trim(),
          description: newBoard.description.trim(),
        })
        setNewBoard({ title: "", description: "" })
        setIsCreateDialogOpen(false)
      } catch (error) {
        console.error('Failed to create board:', error)
      }
    }
  }

  const handleDeleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm("Are you sure you want to delete this board? This will also delete all columns and tasks.")) {
      try {
        await deleteBoard(boardId)
      } catch (error) {
        console.error('Failed to delete board:', error)
      }
    }
  }

  // Calculate productivity metrics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === 'completed').length
  const overdueTasks = tasks.filter(
    (task) =>
      task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed'
  ).length
  const todayTasks = tasks.filter((task) => task.dueDate && isToday(new Date(task.dueDate))).length
  const thisWeekTasks = tasks.filter((task) => task.dueDate && isThisWeek(new Date(task.dueDate))).length

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const activeProjects = boards.length
  const teamMembers = new Set([
    ...tasks.map((t) => t.assignee?._id).filter(Boolean), 
    ...tasks.map((t) => t.creator?._id)
  ]).size

  // Recent activity
  const recentBoards = boards
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  // Upcoming deadlines
  const upcomingDeadlines = tasks
    .filter((task) => task.dueDate && !isPast(new Date(task.dueDate)))
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  // Filter boards based on search
  const filteredBoards = boards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const productivityStats = [
    {
      title: "Task Completion",
      value: `${completionRate}%`,
      description: `${completedTasks} of ${totalTasks} tasks completed`,
      icon: CheckCircle2,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      progress: completionRate,
    },
    {
      title: "Active Projects",
      value: activeProjects.toString(),
      description: `${recentBoards.length} created recently`,
      icon: Target,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      progress: Math.min((activeProjects / 10) * 100, 100),
    },
    {
      title: "Team Members",
      value: teamMembers.toString(),
      description: "Collaborating across projects",
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      progress: Math.min((teamMembers / 20) * 100, 100),
    },
    {
      title: "Overdue Tasks",
      value: overdueTasks.toString(),
      description: overdueTasks > 0 ? "Need immediate attention" : "All caught up!",
      icon: AlertCircle,
      color: overdueTasks > 0 ? "text-red-400" : "text-green-400",
      bgColor: overdueTasks > 0 ? "bg-red-500/10" : "bg-green-500/10",
      progress: totalTasks > 0 ? Math.min((overdueTasks / totalTasks) * 100, 100) : 0,
    },
  ]

  const quickStats = [
    { label: "Due Today", value: todayTasks, color: "text-orange-400" },
    { label: "This Week", value: thisWeekTasks, color: "text-blue-400" },
    { label: "Total Tasks", value: totalTasks, color: "text-slate-400" },
  ]

  const MobileMenu = () => (
    <div className="space-y-2 p-4">
      <Button
        onClick={() => setIsCreateDialogOpen(true)}
        variant="outline"
        className="w-full justify-start border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Project
      </Button>
      <Button
        onClick={() => navigate("/analytics")}
        variant="outline"
        className="w-full justify-start border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        View Analytics
      </Button>
      <Button
        onClick={() => navigate("/team-settings")}
        variant="outline"
        className="w-full justify-start border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
      >
        <Users className="w-4 h-4 mr-2" />
        Team Settings
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold text-white">TaskBoard Pro</h1>
                  <p className="text-xs text-slate-400">Productivity Dashboard</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-sm font-bold text-white">TaskBoard</h1>
                </div>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md mx-4 bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Create New Project
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateBoard} className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-slate-300">
                        Project Name
                      </Label>
                      <Input
                        id="title"
                        value={newBoard.title}
                        onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                        placeholder="Enter project name"
                        required
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-slate-300">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={newBoard.description}
                        onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                        placeholder="Project description (optional)"
                        rows={3}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Create Project
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate-900 border-slate-700 text-white w-64">
                  <MobileMenu />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-white">Loading...</div>
          </div>
        )}
        {/* Productivity Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {productivityStats.map((stat, index) => (
            <Card
              key={stat.title}
              className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-slate-400">{stat.title}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={stat.progress} className="h-2" />
                  <p className="text-xs text-slate-400">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats Bar */}
        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                {quickStats.map((stat, index) => (
                  <div key={stat.label} className="flex items-center space-x-2">
                    <div className={`text-base sm:text-lg font-semibold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-400">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Last updated: {format(new Date(), "HH:mm")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Projects Section */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Projects</h2>
                <p className="text-slate-400">Manage your active projects</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className="border-slate-700 text-slate-400 hover:text-white w-full sm:w-auto"
                >
                  {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  <span className="ml-2 sm:hidden">{viewMode === "grid" ? "List View" : "Grid View"}</span>
                </Button>
              </div>
            </div>

            {filteredBoards.length === 0 ? (
              <Card className="bg-slate-800/30 border-slate-700 border-dashed">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                    {searchQuery ? "No projects found" : "No projects yet"}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Create your first project to start organizing your work"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Project
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6" : "space-y-4"}>
                {filteredBoards.map((board) => {
                  const boardTasks = tasks.filter((task) => task.boardId === board._id)
                  const boardProgress =
                    boardTasks.length > 0
                      ? Math.round(
                          (boardTasks.filter((task) => task.status === 'completed').length /
                            boardTasks.length) *
                            100,
                        )
                      : 0

                  return (
                    <Link key={board._id} to={`/board/${board._id}`} className="group">
                      <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 group-hover:scale-[1.02]">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg text-white group-hover:text-blue-400 transition-colors truncate">
                                {board.title}
                              </CardTitle>
                              {board.description && (
                                <CardDescription className="text-slate-400 line-clamp-2 text-sm">
                                  {board.description}
                                </CardDescription>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteBoard(board._id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-900/20 flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm space-y-2 sm:space-y-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                              <div className="flex items-center space-x-1 text-slate-400">
                                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="truncate">{board.createdBy.firstName} {board.createdBy.lastName}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-slate-400">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{format(new Date(board.createdAt), "MMM dd")}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                              {boardTasks.length} tasks
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Progress</span>
                              <span className="text-white font-medium">{boardProgress}%</span>
                            </div>
                            <Progress value={boardProgress} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                            <span className="text-xs text-slate-500">Click to open project</span>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Upcoming Deadlines */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-white flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-400" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No upcoming deadlines</p>
                ) : (
                  upcomingDeadlines.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{task.title}</p>
                        <p className="text-xs text-slate-400 truncate">{task.assignee}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs text-slate-300">{format(new Date(task.dueDate), "MMM dd")}</p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            isToday(new Date(task.dueDate))
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-slate-600 text-slate-300"
                          }`}
                        >
                          {isToday(new Date(task.dueDate))
                            ? "Today"
                            : isThisWeek(new Date(task.dueDate))
                              ? "This week"
                              : "Upcoming"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-white flex items-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentBoards.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
                ) : (
                  recentBoards.map((board) => (
                    <Link key={board.id} to={`/board/${board.id}`} className="block">
                      <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{board.title}</p>
                          <p className="text-xs text-slate-400">
                            Created {format(new Date(board.createdAt), "MMM dd")}
                          </p>
                        </div>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-white flex items-center">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="outline"
                  className="w-full justify-start border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
                <Button
                  onClick={() => navigate("/analytics")}
                  variant="outline"
                  className="w-full justify-start border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button
                  onClick={() => navigate("/team-settings")}
                  variant="outline"
                  className="w-full justify-start border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Team Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoardView
