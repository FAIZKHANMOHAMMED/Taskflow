"use client"

import React, { useState, useMemo } from "react"
import { ArrowLeft, Download, TrendingUp, Users, Clock, AlertTriangle, CheckCircle, Calendar, Target, Award } from 'lucide-react'
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useBoardStore } from "@/store/boardStore"
import * as XLSX from "xlsx"

const Analytics = () => {
  const { boards, tasks, columns, isLoading } = useBoardStore()
  const [timeRange, setTimeRange] = useState("all")

  // Filter tasks based on time range
  const filteredTasks = useMemo(() => {
    if (timeRange === "all") return tasks
    
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (timeRange) {
      case "7d":
        cutoffDate.setDate(now.getDate() - 7)
        break
      case "30d":
        cutoffDate.setDate(now.getDate() - 30)
        break
      case "3m":
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      default:
        return tasks
    }
    
    return tasks.filter(task => new Date(task.createdAt) >= cutoffDate)
  }, [tasks, timeRange])

  // Calculate analytics data
  const analytics = useMemo(() => {
    const totalTasks = filteredTasks.length
    const completedTasks = filteredTasks.filter(task => task.status === "completed").length
    const inProgressTasks = filteredTasks.filter(task => task.status === "in-progress").length
    const todoTasks = filteredTasks.filter(task => task.status === "todo").length
    
    const now = new Date()
    const overdueTasks = filteredTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== "completed"
    ).length
    
    const tasksThisWeek = filteredTasks.filter(task => {
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)
      return new Date(task.createdAt) >= weekAgo
    }).length
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // Priority distribution
    const highPriority = filteredTasks.filter(task => task.priority === "high").length
    const mediumPriority = filteredTasks.filter(task => task.priority === "medium").length
    const lowPriority = filteredTasks.filter(task => task.priority === "low").length
    
    // Status distribution for charts
    const statusData = [
      { name: "Completed", value: completedTasks, color: "#10b981" },
      { name: "In Progress", value: inProgressTasks, color: "#f59e0b" },
      { name: "To Do", value: todoTasks, color: "#6b7280" }
    ].filter(item => item.value > 0)
    
    const priorityData = [
      { name: "High", value: highPriority, color: "#ef4444" },
      { name: "Medium", value: mediumPriority, color: "#f59e0b" },
      { name: "Low", value: lowPriority, color: "#10b981" }
    ].filter(item => item.value > 0)
    
    // Team performance
    const teamPerformance = new Map()
    filteredTasks.forEach(task => {
      const assigneeId = task.assignee?._id || "unassigned"
      const assigneeName = task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : "Unassigned"
      
      if (!teamPerformance.has(assigneeId)) {
        teamPerformance.set(assigneeId, {
          name: assigneeName,
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          highPriorityTasks: 0
        })
      }
      
      const member = teamPerformance.get(assigneeId)
      member.totalTasks++
      if (task.status === "completed") member.completedTasks++
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== "completed") member.overdueTasks++
      if (task.priority === "high") member.highPriorityTasks++
    })
    
    const teamStats = Array.from(teamPerformance.values()).map(member => ({
      ...member,
      completionRate: member.totalTasks > 0 ? Math.round((member.completedTasks / member.totalTasks) * 100) : 0,
      performance: member.totalTasks > 0 ? 
        member.completedTasks / member.totalTasks >= 0.8 ? "Excellent" :
        member.completedTasks / member.totalTasks >= 0.6 ? "Good" :
        member.completedTasks / member.totalTasks >= 0.4 ? "Average" : "Needs Help" : "No Data"
    }))
    
    // Board performance
    const boardPerformance = boards.map(board => {
      const boardTasks = filteredTasks.filter(task => task.boardId === board._id)
      const boardCompleted = boardTasks.filter(task => task.status === "completed").length
      const boardOverdue = boardTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < now && task.status !== "completed"
      ).length
      
      return {
        id: board._id,
        title: board.title,
        totalTasks: boardTasks.length,
        completedTasks: boardCompleted,
        overdueTasks: boardOverdue,
        completionRate: boardTasks.length > 0 ? Math.round((boardCompleted / boardTasks.length) * 100) : 0,
        status: boardTasks.length === 0 ? "Empty" :
                boardCompleted === boardTasks.length ? "Complete" :
                boardOverdue > 0 ? "At Risk" : "On Track"
      }
    })
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      tasksThisWeek,
      completionRate,
      statusData,
      priorityData,
      teamStats,
      boardPerformance
    }
  }, [filteredTasks, boards])

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    
    // Executive Summary
    const summaryData = [
      ["Taskflow Analytics Report", ""],
      ["Generated on:", new Date().toLocaleDateString()],
      ["Time Range:", timeRange === "all" ? "All Time" : timeRange === "7d" ? "Last 7 Days" : timeRange === "30d" ? "Last 30 Days" : "Last 3 Months"],
      [""],
      ["KEY METRICS", ""],
      ["Total Tasks", analytics.totalTasks],
      ["Completed Tasks", analytics.completedTasks],
      ["In Progress Tasks", analytics.inProgressTasks],
      ["To Do Tasks", analytics.todoTasks],
      ["Overdue Tasks", analytics.overdueTasks],
      ["Completion Rate", `${analytics.completionRate}%`],
      ["Tasks This Week", analytics.tasksThisWeek],
      [""],
      ["PRIORITY BREAKDOWN", ""],
      ...analytics.priorityData.map(item => [item.name + " Priority", item.value])
    ]
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWs, "Executive Summary")
    
    // Team Performance
    const teamData = [
      ["Team Member", "Total Tasks", "Completed", "Completion Rate", "Overdue Tasks", "High Priority", "Performance Rating"],
      ...analytics.teamStats.map(member => [
        member.name,
        member.totalTasks,
        member.completedTasks,
        `${member.completionRate}%`,
        member.overdueTasks,
        member.highPriorityTasks,
        member.performance
      ])
    ]
    
    const teamWs = XLSX.utils.aoa_to_sheet(teamData)
    XLSX.utils.book_append_sheet(wb, teamWs, "Team Performance")
    
    // Project Performance
    const projectData = [
      ["Project", "Total Tasks", "Completed", "Completion Rate", "Overdue Tasks", "Status"],
      ...analytics.boardPerformance.map(board => [
        board.title,
        board.totalTasks,
        board.completedTasks,
        `${board.completionRate}%`,
        board.overdueTasks,
        board.status
      ])
    ]
    
    const projectWs = XLSX.utils.aoa_to_sheet(projectData)
    XLSX.utils.book_append_sheet(wb, projectWs, "Project Performance")
    
    // Detailed Task List
    const taskData = [
      ["Task Title", "Status", "Priority", "Assignee", "Creator", "Board", "Due Date", "Created", "Days Since Created", "Days Until Due"],
      ...filteredTasks.map(task => {
        const now = new Date()
        const createdDate = new Date(task.createdAt)
        const dueDate = task.dueDate ? new Date(task.dueDate) : null
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysUntilDue = dueDate ? Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : "No due date"
        
        return [
          task.title,
          task.status,
          task.priority,
          task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : "Unassigned",
          `${task.creator.firstName} ${task.creator.lastName}`,
          boards.find(b => b._id === task.boardId)?.title || "Unknown",
          task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date",
          createdDate.toLocaleDateString(),
          daysSinceCreated,
          daysUntilDue
        ]
      })
    ]
    
    const taskWs = XLSX.utils.aoa_to_sheet(taskData)
    XLSX.utils.book_append_sheet(wb, taskWs, "Detailed Tasks")
    
    // Recommendations
    const recommendations = [
      ["RECOMMENDATIONS & INSIGHTS", ""],
      [""],
      ["Performance Analysis:", ""],
      [`Overall completion rate: ${analytics.completionRate}%`, ""],
      [analytics.completionRate >= 80 ? "✅ Excellent team performance!" : 
       analytics.completionRate >= 60 ? "⚠️ Good performance, room for improvement" : 
       "🚨 Performance needs attention", ""],
      [""],
      ["Priority Management:", ""],
      [`High priority tasks: ${analytics.priorityData.find(p => p.name === "High")?.value || 0}`, ""],
      [analytics.overdueTasks > 0 ? `🚨 ${analytics.overdueTasks} overdue tasks need immediate attention` : "✅ No overdue tasks", ""],
      [""],
      ["Team Insights:", ""],
      ...analytics.teamStats
        .filter(member => member.name !== "Unassigned")
        .map(member => [
          `${member.name}: ${member.performance} (${member.completionRate}% completion rate)`,
          member.overdueTasks > 0 ? `${member.overdueTasks} overdue tasks` : "No overdue tasks"
        ]),
      [""],
      ["Action Items:", ""],
      [analytics.overdueTasks > 0 ? "1. Address overdue tasks immediately" : "1. Maintain current performance", ""],
      ["2. Review high-priority task distribution", ""],
      ["3. Consider workload balancing for team members", ""],
      [analytics.completionRate < 60 ? "4. Implement performance improvement plan" : "4. Continue current workflow", ""]
    ]
    
    const recommendationsWs = XLSX.utils.aoa_to_sheet(recommendations)
    XLSX.utils.book_append_sheet(wb, recommendationsWs, "Recommendations")
    
    // Save the file
    const fileName = `Taskflow_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-pulse text-slate-400">Loading analytics...</div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center text-slate-400 hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-4xl">
                📊
              </div>
              <h3 className="text-xl font-medium text-slate-100 mb-2">No Data Available</h3>
              <p className="text-slate-400 mb-4">Create some boards and tasks to see analytics</p>
              <Link to="/">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center text-slate-400 hover:text-blue-400 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-100 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={exportToExcel}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Tasks</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{analytics.totalTasks}</div>
              <p className="text-xs text-slate-400">
                {analytics.tasksThisWeek} created this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{analytics.completedTasks}</div>
              <p className="text-xs text-slate-400">
                {analytics.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{analytics.inProgressTasks}</div>
              <p className="text-xs text-slate-400">
                Active tasks
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{analytics.overdueTasks}</div>
              <p className="text-xs text-slate-400">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">Overview</TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-slate-700">Team</TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-slate-700">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">Task Status Distribution</CardTitle>
                  <CardDescription className="text-slate-400">
                    Overview of task completion status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">Priority Distribution</CardTitle>
                  <CardDescription className="text-slate-400">
                    Task priority breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.priorityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }} 
                        />
                        <Bar dataKey="value" fill="#8884d8">
                          {analytics.priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Completion Rate Progress */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Overall Progress</CardTitle>
                <CardDescription className="text-slate-400">
                  Team completion rate and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Completion Rate</span>
                    <span className="text-slate-100 font-medium">{analytics.completionRate}%</span>
                  </div>
                  <Progress value={analytics.completionRate} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{analytics.completedTasks}</div>
                    <div className="text-sm text-slate-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{analytics.inProgressTasks}</div>
                    <div className="text-sm text-slate-400">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-400">{analytics.todoTasks}</div>
                    <div className="text-sm text-slate-400">To Do</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{analytics.overdueTasks}</div>
                    <div className="text-sm text-slate-400">Overdue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Team Performance
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Individual team member performance and task completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.teamStats.filter(member => member.name !== "Unassigned").map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-100">{member.name}</h4>
                          <Badge 
                            variant={
                              member.performance === "Excellent" ? "default" :
                              member.performance === "Good" ? "secondary" :
                              member.performance === "Average" ? "outline" : "destructive"
                            }
                            className={
                              member.performance === "Excellent" ? "bg-green-600 hover:bg-green-700" :
                              member.performance === "Good" ? "bg-blue-600 hover:bg-blue-700" :
                              member.performance === "Average" ? "bg-yellow-600 hover:bg-yellow-700" : ""
                            }
                          >
                            {member.performance}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Total Tasks: </span>
                            <span className="text-slate-100 font-medium">{member.totalTasks}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Completed: </span>
                            <span className="text-green-400 font-medium">{member.completedTasks}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Overdue: </span>
                            <span className="text-red-400 font-medium">{member.overdueTasks}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">High Priority: </span>
                            <span className="text-orange-400 font-medium">{member.highPriorityTasks}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Completion Rate</span>
                            <span className="text-slate-100">{member.completionRate}%</span>
                          </div>
                          <Progress value={member.completionRate} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {analytics.teamStats.find(member => member.name === "Unassigned") && (
                    <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-yellow-600">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-100">Unassigned Tasks</h4>
                          <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                            Needs Assignment
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="text-slate-400">Tasks: </span>
                          <span className="text-yellow-400 font-medium">
                            {analytics.teamStats.find(member => member.name === "Unassigned")?.totalTasks || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Project Performance
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Board-level performance and completion tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.boardPerformance.map((board, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-100">{board.title}</h4>
                          <Badge 
                            variant={
                              board.status === "Complete" ? "default" :
                              board.status === "On Track" ? "secondary" :
                              board.status === "At Risk" ? "destructive" : "outline"
                            }
                            className={
                              board.status === "Complete" ? "bg-green-600 hover:bg-green-700" :
                              board.status === "On Track" ? "bg-blue-600 hover:bg-blue-700" :
                              board.status === "At Risk" ? "bg-red-600 hover:bg-red-700" : ""
                            }
                          >
                            {board.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-slate-400">Total Tasks: </span>
                            <span className="text-slate-100 font-medium">{board.totalTasks}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Completed: </span>
                            <span className="text-green-400 font-medium">{board.completedTasks}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Overdue: </span>
                            <span className="text-red-400 font-medium">{board.overdueTasks}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Progress: </span>
                            <span className="text-slate-100 font-medium">{board.completionRate}%</span>
                          </div>
                        </div>
                        {board.totalTasks > 0 && (
                          <Progress value={board.completionRate} className="h-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Analytics
