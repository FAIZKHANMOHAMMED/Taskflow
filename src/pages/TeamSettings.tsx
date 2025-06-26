"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Users, Settings, UserPlus, Crown, Shield, Bell, Save, Trash2, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTaskStore } from "@/store/taskStore"
import { format } from "date-fns"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "admin" | "member" | "viewer"
  joinedAt: string
  lastActive: string
  tasksAssigned: number
  tasksCompleted: number
}

const TeamSettings = () => {
  const { tasks, columns } = useTaskStore()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member")

  // Mock team members (in a real app, this would come from your backend)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const uniqueMembers = new Set([...tasks.map((t) => t.assignee), ...tasks.map((t) => t.creator)])
    return Array.from(uniqueMembers).map((name, index) => {
      const memberTasks = tasks.filter((t) => t.assignee === name)
      const completedTasks = memberTasks.filter((task) => {
        const column = columns.find((col) => col.id === task.columnId)
        return column?.title.toLowerCase().includes("done") || column?.title.toLowerCase().includes("complete")
      })

      return {
        id: `member-${index}`,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@company.com`,
        role: index === 0 ? "admin" : "member",
        joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        tasksAssigned: memberTasks.length,
        tasksCompleted: completedTasks.length,
      }
    })
  })

  // Team settings state
  const [teamSettings, setTeamSettings] = useState({
    teamName: "TaskBoard Team",
    description: "Our productive team workspace",
    timezone: "UTC",
    workingHours: "9:00 AM - 5:00 PM",
    notifications: {
      emailNotifications: true,
      taskDeadlines: true,
      projectUpdates: true,
      weeklyReports: true,
    },
    permissions: {
      allowGuestAccess: false,
      requireApproval: true,
      allowFileSharing: true,
    },
  })

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteEmail.trim()) {
      // In a real app, you would send an invitation email
      console.log(`Inviting ${inviteEmail} as ${inviteRole}`)
      setInviteEmail("")
      setInviteRole("member")
      setIsInviteDialogOpen(false)
      // Show success message
    }
  }

  const handleRemoveMember = (memberId: string) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      setTeamMembers((prev) => prev.filter((member) => member.id !== memberId))
    }
  }

  const handleRoleChange = (memberId: string, newRole: "admin" | "member" | "viewer") => {
    setTeamMembers((prev) => prev.map((member) => (member.id === memberId ? { ...member, role: newRole } : member)))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/20 text-purple-400"
      case "member":
        return "bg-blue-500/20 text-blue-400"
      case "viewer":
        return "bg-gray-500/20 text-gray-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-3 h-3" />
      case "member":
        return <Users className="w-3 h-3" />
      case "viewer":
        return <Shield className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link to="/" className="flex items-center text-slate-400 hover:text-blue-400 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">Team Settings</h1>
                  <p className="text-xs text-slate-400">Manage your team and workspace</p>
                </div>
              </div>
            </div>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white mx-4">
                <DialogHeader>
                  <DialogTitle className="text-white">Invite Team Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInviteMember} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-slate-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      required
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-slate-300">
                      Role
                    </Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(value: "admin" | "member" | "viewer") => setInviteRole(value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="viewer">Viewer - Can view projects</SelectItem>
                        <SelectItem value="member">Member - Can edit and create</SelectItem>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                      className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
                    >
                      Send Invitation
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Tabs defaultValue="members" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-slate-800 border-slate-700 w-full sm:w-auto">
            <TabsTrigger value="members" className="text-slate-300 data-[state=active]:text-white text-xs sm:text-sm">
              Team Members
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-slate-300 data-[state=active]:text-white text-xs sm:text-sm">
              Workspace Settings
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="text-slate-300 data-[state=active]:text-white text-xs sm:text-sm"
            >
              Permissions
            </TabsTrigger>
          </TabsList>

          {/* Team Members Tab */}
          <TabsContent value="members" className="space-y-4 sm:space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg sm:text-xl">Team Members ({teamMembers.length})</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Manage your team members and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-slate-700/50 rounded-lg gap-3"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <h4 className="font-semibold text-white text-sm sm:text-base truncate">{member.name}</h4>
                            <Badge className={`text-xs ${getRoleColor(member.role)} w-fit`}>
                              {getRoleIcon(member.role)}
                              <span className="ml-1">{member.role}</span>
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-400 truncate">{member.email}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-slate-500 mt-1">
                            <span>Joined {format(new Date(member.joinedAt), "MMM dd, yyyy")}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Last active {format(new Date(member.lastActive), "MMM dd")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 w-full sm:w-auto">
                        <div className="text-left sm:text-right">
                          <p className="text-sm text-white">
                            {member.tasksCompleted}/{member.tasksAssigned}
                          </p>
                          <p className="text-xs text-slate-400">Tasks completed</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, "admin")}
                              className="hover:bg-slate-700 text-xs sm:text-sm"
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, "member")}
                              className="hover:bg-slate-700 text-xs sm:text-sm"
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, "viewer")}
                              className="hover:bg-slate-700 text-xs sm:text-sm"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-400 hover:bg-red-900/20 text-xs sm:text-sm"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workspace Settings Tab */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="teamName" className="text-slate-300 text-sm">
                      Team Name
                    </Label>
                    <Input
                      id="teamName"
                      value={teamSettings.teamName}
                      onChange={(e) => setTeamSettings((prev) => ({ ...prev, teamName: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-slate-300 text-sm">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={teamSettings.description}
                      onChange={(e) => setTeamSettings((prev) => ({ ...prev, description: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone" className="text-slate-300 text-sm">
                      Timezone
                    </Label>
                    <Select
                      value={teamSettings.timezone}
                      onValueChange={(value) => setTeamSettings((prev) => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time</SelectItem>
                        <SelectItem value="PST">Pacific Time</SelectItem>
                        <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="workingHours" className="text-slate-300 text-sm">
                      Working Hours
                    </Label>
                    <Input
                      id="workingHours"
                      value={teamSettings.workingHours}
                      onChange={(e) => setTeamSettings((prev) => ({ ...prev, workingHours: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300 text-sm">Email Notifications</Label>
                      <p className="text-xs text-slate-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={teamSettings.notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setTeamSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, emailNotifications: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300 text-sm">Task Deadlines</Label>
                      <p className="text-xs text-slate-400">Notify about upcoming deadlines</p>
                    </div>
                    <Switch
                      checked={teamSettings.notifications.taskDeadlines}
                      onCheckedChange={(checked) =>
                        setTeamSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, taskDeadlines: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300 text-sm">Project Updates</Label>
                      <p className="text-xs text-slate-400">Notify about project changes</p>
                    </div>
                    <Switch
                      checked={teamSettings.notifications.projectUpdates}
                      onCheckedChange={(checked) =>
                        setTeamSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, projectUpdates: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300 text-sm">Weekly Reports</Label>
                      <p className="text-xs text-slate-400">Receive weekly progress reports</p>
                    </div>
                    <Switch
                      checked={teamSettings.notifications.weeklyReports}
                      onCheckedChange={(checked) =>
                        setTeamSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, weeklyReports: checked },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4 sm:space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Access Permissions
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Control who can access and modify your workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300 text-sm">Allow Guest Access</Label>
                    <p className="text-xs text-slate-400">Allow non-team members to view public projects</p>
                  </div>
                  <Switch
                    checked={teamSettings.permissions.allowGuestAccess}
                    onCheckedChange={(checked) =>
                      setTeamSettings((prev) => ({
                        ...prev,
                        permissions: { ...prev.permissions, allowGuestAccess: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300 text-sm">Require Approval</Label>
                    <p className="text-xs text-slate-400">New members need admin approval to join</p>
                  </div>
                  <Switch
                    checked={teamSettings.permissions.requireApproval}
                    onCheckedChange={(checked) =>
                      setTeamSettings((prev) => ({
                        ...prev,
                        permissions: { ...prev.permissions, requireApproval: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300 text-sm">Allow File Sharing</Label>
                    <p className="text-xs text-slate-400">Members can upload and share files</p>
                  </div>
                  <Switch
                    checked={teamSettings.permissions.allowFileSharing}
                    onCheckedChange={(checked) =>
                      setTeamSettings((prev) => ({
                        ...prev,
                        permissions: { ...prev.permissions, allowFileSharing: checked },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg sm:text-xl">Role Permissions</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  What each role can do in your workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3 sm:p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Crown className="w-4 h-4 text-purple-400" />
                      <h4 className="font-semibold text-white text-sm sm:text-base">Admin</h4>
                    </div>
                    <ul className="text-xs sm:text-sm text-slate-300 space-y-1">
                      <li>• Full workspace access</li>
                      <li>• Manage team members</li>
                      <li>• Delete projects</li>
                      <li>• Change settings</li>
                    </ul>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-4 h-4 text-blue-400" />
                      <h4 className="font-semibold text-white text-sm sm:text-base">Member</h4>
                    </div>
                    <ul className="text-xs sm:text-sm text-slate-300 space-y-1">
                      <li>• Create projects</li>
                      <li>• Edit tasks</li>
                      <li>• Comment on tasks</li>
                      <li>• Upload files</li>
                    </ul>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <h4 className="font-semibold text-white text-sm sm:text-base">Viewer</h4>
                    </div>
                    <ul className="text-xs sm:text-sm text-slate-300 space-y-1">
                      <li>• View projects</li>
                      <li>• View tasks</li>
                      <li>• Export data</li>
                      <li>• Read comments</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default TeamSettings
