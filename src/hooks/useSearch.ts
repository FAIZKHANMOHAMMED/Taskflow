"use client"

import { useMemo } from "react"
import type { Task } from "@/store/taskStore"
import type { Column } from "../types"

export interface SearchFilters {
  priority?: "high" | "medium" | "low"
  status?: "todo" | "in-progress" | "completed"
  assignee?: string
  creator?: string
  overdue?: boolean
}

export const useSearch = (tasks: Task[], columns: Column[], searchQuery: string, filters: SearchFilters) => {
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    // Filter tasks
    const filteredTasks = tasks.filter((task) => {
      // Text search
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.assignee.toLowerCase().includes(query) ||
        task.creator.toLowerCase().includes(query) ||
        (task.status === "in-progress" ? "in progress" : task.status).toLowerCase().includes(query)

      // Priority filter
      const matchesPriority = !filters.priority || task.priority === filters.priority

      // Status filter
      const matchesStatus = !filters.status || task.status === filters.status

      // Assignee filter
      const matchesAssignee = !filters.assignee || task.assignee === filters.assignee

      // Creator filter
      const matchesCreator = !filters.creator || task.creator === filters.creator

      // Overdue filter
      const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed"
      const matchesOverdue = !filters.overdue || isOverdue

      return matchesSearch && matchesPriority && matchesStatus && matchesAssignee && matchesCreator && matchesOverdue
    })

    // Filter columns
    let filteredColumns = columns.filter((column) => {
      const matchesSearch = !query || column.title.toLowerCase().includes(query)
      return matchesSearch
    })

    // If we have search/filters, only show columns that either match the search or contain matching tasks
    if (query || Object.keys(filters).length > 0) {
      const taskColumnIds = new Set(filteredTasks.map((task) => task.columnId))
      filteredColumns = filteredColumns.filter(
        (column) => column.title.toLowerCase().includes(query) || taskColumnIds.has(column.id),
      )
    }

    return {
      tasks: filteredTasks,
      columns: filteredColumns,
      totalResults: filteredTasks.length + filteredColumns.length,
    }
  }, [tasks, columns, searchQuery, filters])

  const availableAssignees = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.assignee))).sort()
  }, [tasks])

  const availableCreators = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.creator))).sort()
  }, [tasks])

  return {
    ...filteredData,
    availableAssignees,
    availableCreators,
  }
}
