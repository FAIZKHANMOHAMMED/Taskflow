"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, TrendingUp, Users, CheckCircle, Clock, Calendar, Download, BarChart3 } from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useBoardStore } from "../store/boardStore"
import { useAuthStore } from "../store/authStore"

const Analytics = () => {
  const { boards, tasks, fetchBoards } = useBoardStore()
  const { user } = useAuthStore()
  const [selectedPeriod, setSelectedPeriod] = useState("7d")

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  // Calculate analytics data
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length
  const todoTasks = tasks.filter((task) => task.status === "todo").length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Generate daily activity data for the last 7 days
  const generateDailyData = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayTasks = tasks.filter((task) => {
        const taskDate = new Date(task.createdAt)
        return taskDate.toDateString() === date.toDateString()
      })

      days.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        created: dayTasks.length,
        completed: dayTasks.filter((task) => task.status === "completed").length,
        inProgress: dayTasks.filter((task) => task.status === "in-progress").length,
      })
    }
    return days
  }

  const dailyData = generateDailyData()

  // Task status distribution
  const statusData = [
    { name: "Completed", value: completedTasks, color: "#10b981" },
    { name: "In Progress", value: inProgressTasks, color: "#3b82f6" },
    { name: "To Do", value: todoTasks, color: "#6b7280" },
  ]

  // Priority distribution
  const priorityData = [
    { name: "High", value: tasks.filter((t) => t.priority === "high").length, color: "#ef4444" },
    { name: "Medium", value: tasks.filter((t) => t.priority === "medium").length, color: "#f59e0b" },
    { name: "Low", value: tasks.filter((t) => t.priority === "low").length, color: "#10b981" },
  ]

  // Team performance data
  const getTeamPerformance = () => {
    const memberStats = new Map()

    tasks.forEach((task) => {
      const creatorId = task.creator._id
      const creatorName = `${task.creator.firstName} ${task.creator.lastName}`

      if (!memberStats.has(creatorId)) {
        memberStats.set(creatorId, {
          name: creatorName,
          email: task.creator.email,
          created: 0,
          completed: 0,
          inProgress: 0,
        })
      }

      const stats = memberStats.get(creatorId)
      stats.created++

      if (task.status === "completed") stats.completed++
      if (task.status === "in-progress") stats.inProgress++
    })

    return Array.from(memberStats.values()).map((member) => ({
      ...member,
      completionRate: member.created > 0 ? Math.round((member.completed / member.created) * 100) : 0,
    }))
  }

  const teamPerformance = getTeamPerformance()

  const exportData = () => {
    const csvData = [
      ["Task Title", "Status", "Priority", "Created Date", "Creator", "Board"],
      ...tasks.map((task) => [
        task.title,
        task.status,
        task.priority,
        new Date(task.createdAt).toLocaleDateString(),
        `${task.creator.firstName} ${task.creator.lastName}`,
        boards.find((b) => b._id === task.boardId)?.title || "Unknown",
      ]),
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `taskflow-analytics-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center text-slate-400 hover:text-blue-400 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics</h1>
              <p className="text-slate-400 mt-1">Insights into your team's productivity and progress</p>
            </div>
          </div>

          <Button
            onClick={exportData}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Tasks</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalTasks}</div>
              <div className="flex items-center text-xs text-slate-400 mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                +12% from last week
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{completionRate}%</div>
              <div className="flex items-center text-xs text-slate-400 mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                +5% from last week
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Active Boards</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{boards.length}</div>
              <div className="flex items-center text-xs text-slate-400 mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                +2 new this month
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Team Members</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{teamPerformance.length}</div>
              <div className="flex items-center text-xs text-slate-400 mt-1">
                <Clock className="w-3 h-3 mr-1 text-blue-500" />
                All active
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-slate-700">
              Team Performance
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-slate-700">
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Activity Chart */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Daily Activity</CardTitle>
                  <CardDescription className="text-slate-400">
                    Task creation and completion over the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="created"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                        name="Created"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Task Status Distribution */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Task Status Distribution</CardTitle>
                  <CardDescription className="text-slate-400">Current breakdown of task statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Priority Distribution */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Priority Distribution</CardTitle>
                <CardDescription className="text-slate-400">Task breakdown by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Team Performance</CardTitle>
                <CardDescription className="text-slate-400">
                  Individual team member statistics and productivity metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamPerformance.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                            {getUserInitials(member.name.split(" ")[0], member.name.split(" ")[1] || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-sm text-slate-400">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{member.created}</p>
                          <p className="text-xs text-slate-400">Created</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-400">{member.completed}</p>
                          <p className="text-xs text-slate-400">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-400">{member.inProgress}</p>
                          <p className="text-xs text-slate-400">In Progress</p>
                        </div>
                        <Badge
                          variant={member.completionRate >= 70 ? "default" : "secondary"}
                          className={
                            member.completionRate >= 70
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {member.completionRate}% completion
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {teamPerformance.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No team performance data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Productivity Trends</CardTitle>
                <CardDescription className="text-slate-400">Weekly task completion and creation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      name="Tasks Created"
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      name="Tasks Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Analytics
