export interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

export interface Comment {
  author: User
  content: string
  createdAt: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  creator: User
  assignee?: User
  priority: "high" | "medium" | "low"
  status: "todo" | "in-progress" | "completed"
  dueDate?: string
  columnId: string
  boardId: string
  position: number
  tags?: string[]
  comments?: Comment[]
  createdAt: string
  updatedAt: string
}

export interface Column {
  _id: string
  id?: string  // Keep for backward compatibility
  title: string
  boardId: string
  position: number
  color?: string
  createdAt: string
  updatedAt: string
}

export interface Board {
  id: string
  _id?: string  // For MongoDB compatibility
  title: string
  description: string
  createdAt: string
  createdBy: string | {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  columns?: Column[]
  members?: Array<{
    user: User
    role: 'admin' | 'member' | 'owner'
    joinedAt?: string
  }>
  backgroundColor?: string
  updatedAt?: string
  backgroundColor?: string
}

export interface SearchFilters {
  priority?: "high" | "medium" | "low"
  status?: "todo" | "in-progress" | "completed"
  assignee?: string
  creator?: string
  overdue?: boolean
}
