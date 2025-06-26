"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  ArrowLeft,
} from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useNavigate } from "react-router-dom"

export const Analytics: React.FC = () => {
  const navigate = useNavigate()
  const { tasks, boards } = useTaskStore()
  const [timeRange, setTimeRange] = useState("all")

  // Filter tasks based on time range
  const getFilteredTasks = () => {
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      default:
        return tasks
    }

    return tasks.filter((task) => new Date(task.dueDate) >= startDate)
  }

  const filteredTasks = getFilteredTasks()

  // Calculate metrics
  const totalTasks = filteredTasks.length
  const completedTasks = filteredTasks.filter((task) => task.status === "completed").length
  const inProgressTasks = filteredTasks.filter((task) => task.status === "in-progress").length
  const todoTasks = filteredTasks.filter((task) => task.status === "todo").length
  const overdueTasks = filteredTasks.filter(
    (task) => new Date(task.dueDate) < new Date() && task.status !== "completed",
  ).length

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Priority distribution
  const highPriorityTasks = filteredTasks.filter((task) => task.priority === "high").length
  const mediumPriorityTasks = filteredTasks.filter((task) => task.priority === "medium").length
  const lowPriorityTasks = filteredTasks.filter((task) => task.priority === "low").length

  // Team performance
  const teamMembers = [
    ...new Set([...filteredTasks.map((task) => task.assignee), ...filteredTasks.map((task) => task.creator)]),
  ].filter(Boolean)
  const teamPerformance = teamMembers
    .map((member) => {
      const memberTasks = filteredTasks.filter((task) => task.assignee === member)
      const memberCompleted = memberTasks.filter((task) => task.status === "completed").length
      const completionRate = memberTasks.length > 0 ? Math.round((memberCompleted / memberTasks.length) * 100) : 0

      return {
        name: member,
        totalTasks: memberTasks.length,
        completedTasks: memberCompleted,
        completionRate,
      }
    })
    .sort((a, b) => b.completionRate - a.completionRate)

  // Project performance
  const projectPerformance = boards
    .map((board) => {
      const boardTasks = filteredTasks.filter((task) => {
        // Find tasks that belong to this board's columns
        return tasks.some((t) => t.id === task.id) // This is a simplified check
      })
      const boardCompleted = boardTasks.filter((task) => task.status === "completed").length
      const completionRate = boardTasks.length > 0 ? Math.round((boardCompleted / boardTasks.length) * 100) : 0

      return {
        name: board.title,
        totalTasks: boardTasks.length,
        completedTasks: boardCompleted,
        completionRate,
      }
    })
    .filter((project) => project.totalTasks > 0)

  // Recent activity (tasks with deadlines in the last 7 days)
  const recentActivity = filteredTasks
    .filter((task) => {
      const taskDate = new Date(task.dueDate)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return taskDate >= weekAgo
    })
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 10)

  const exportData = () => {
    // Create CSV content for Excel compatibility
    const csvContent = []

    // Add header
    csvContent.push("TaskFlow Analytics Report")
    csvContent.push(`Generated: ${new Date().toLocaleString()}`)
    csvContent.push(`Time Range: ${timeRange}`)
    csvContent.push("")

    // Key Metrics
    csvContent.push("KEY METRICS")
    csvContent.push("Metric,Value")
    csvContent.push(`Total Tasks,${totalTasks}`)
    csvContent.push(`Completed Tasks,${completedTasks}`)
    csvContent.push(`In Progress Tasks,${inProgressTasks}`)
    csvContent.push(`Todo Tasks,${todoTasks}`)
    csvContent.push(`Overdue Tasks,${overdueTasks}`)
    csvContent.push(`Completion Rate,${completionRate}%`)
    csvContent.push("")

    // Priority Distribution
    csvContent.push("PRIORITY DISTRIBUTION")
    csvContent.push("Priority,Count,Percentage")
    csvContent.push(
      `High Priority,${highPriorityTasks},${totalTasks > 0 ? Math.round((highPriorityTasks / totalTasks) * 100) : 0}%`,
    )
    csvContent.push(
      `Medium Priority,${mediumPriorityTasks},${totalTasks > 0 ? Math.round((mediumPriorityTasks / totalTasks) * 100) : 0}%`,
    )
    csvContent.push(
      `Low Priority,${lowPriorityTasks},${totalTasks > 0 ? Math.round((lowPriorityTasks / totalTasks) * 100) : 0}%`,
    )
    csvContent.push("")

    // Status Distribution
    csvContent.push("STATUS DISTRIBUTION")
    csvContent.push("Status,Count,Percentage")
    csvContent.push(
      `Completed,${completedTasks},${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`,
    )
    csvContent.push(
      `In Progress,${inProgressTasks},${totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%`,
    )
    csvContent.push(`Todo,${todoTasks},${totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%`)
    csvContent.push("")

    // Team Performance
    if (teamPerformance.length > 0) {
      csvContent.push("TEAM PERFORMANCE")
      csvContent.push("Team Member,Total Tasks,Completed Tasks,Completion Rate")
      teamPerformance.forEach((member) => {
        csvContent.push(`${member.name},${member.totalTasks},${member.completedTasks},${member.completionRate}%`)
      })
      csvContent.push("")
    }

    // Recent Activity
    if (recentActivity.length > 0) {
      csvContent.push("RECENT ACTIVITY")
      csvContent.push("Task Title,Assignee,Status,Due Date")
      recentActivity.forEach((task) => {
        const statusText =
          task.status === "in-progress" ? "In Progress" : task.status === "todo" ? "To Do" : "Completed"
        csvContent.push(`"${task.title}",${task.assignee},${statusText},${new Date(task.dueDate).toLocaleDateString()}`)
      })
    }

    // Convert to CSV format
    const csvString = csvContent.join("\n")

    // Create and download file
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `TaskFlow-Analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-slate-400 hover:text-white self-start"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">Track your productivity and team performance</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportData} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Total Tasks</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{totalTasks}</p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">{completedTasks}</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">In Progress</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-400">{inProgressTasks}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Completion Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-400">{completionRate}%</p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Overdue</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-400">{overdueTasks}</p>
                </div>
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Priority Distribution */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">High Priority</span>
                  <Badge className="bg-red-500/20 text-red-400 text-xs sm:text-sm">{highPriorityTasks}</Badge>
                </div>
                <Progress
                  value={totalTasks > 0 ? (highPriorityTasks / totalTasks) * 100 : 0}
                  className="h-2 bg-slate-700"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Medium Priority</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400 text-xs sm:text-sm">{mediumPriorityTasks}</Badge>
                </div>
                <Progress
                  value={totalTasks > 0 ? (mediumPriorityTasks / totalTasks) * 100 : 0}
                  className="h-2 bg-slate-700"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Low Priority</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs sm:text-sm">{lowPriorityTasks}</Badge>
                </div>
                <Progress
                  value={totalTasks > 0 ? (lowPriorityTasks / totalTasks) * 100 : 0}
                  className="h-2 bg-slate-700"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Completed</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs sm:text-sm">{completedTasks}</Badge>
                </div>
                <Progress
                  value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}
                  className="h-2 bg-slate-700"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">In Progress</span>
                  <Badge className="bg-blue-500/20 text-blue-400 text-xs sm:text-sm">{inProgressTasks}</Badge>
                </div>
                <Progress
                  value={totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}
                  className="h-2 bg-slate-700"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">To Do</span>
                  <Badge className="bg-gray-500/20 text-gray-400 text-xs sm:text-sm">{todoTasks}</Badge>
                </div>
                <Progress value={totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0} className="h-2 bg-slate-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        {teamPerformance.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6 sm:mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {teamPerformance.slice(0, 10).map((member, index) => (
                  <div
                    key={member.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-700/30 rounded-lg gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm sm:text-base truncate">{member.name}</p>
                        <p className="text-slate-400 text-xs sm:text-sm">
                          {member.completedTasks}/{member.totalTasks} tasks completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 sm:w-24">
                        <Progress value={member.completionRate} className="h-2 bg-slate-600" />
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 min-w-[3rem] text-center text-xs sm:text-sm">
                        {member.completionRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-700/30 rounded-lg gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm sm:text-base truncate">{task.title}</p>
                      <p className="text-slate-400 text-xs sm:text-sm">Assigned to {task.assignee}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                      <Badge
                        className={`text-xs sm:text-sm ${
                          task.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : task.status === "in-progress"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {task.status === "in-progress" ? "In Progress" : task.status === "todo" ? "To Do" : "Completed"}
                      </Badge>
                      <span className="text-slate-400 text-xs sm:text-sm">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
