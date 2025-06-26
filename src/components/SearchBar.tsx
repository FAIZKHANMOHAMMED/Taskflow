"use client"

import type React from "react"
import { useState } from "react"
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export interface SearchFilters {
  priority?: "high" | "medium" | "low"
  status?: "todo" | "in-progress" | "completed"
  assignee?: string
  creator?: string
  overdue?: boolean
}

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
}

const getUserDisplayName = (user: User) => {
  if (!user) return 'Unassigned';
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
};

const getUserById = (users: User[], id: string) => {
  return users.find(user => user._id === id);
};

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  availableAssignees: User[]
  availableCreators: User[]
  resultsCount?: number
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  availableAssignees,
  availableCreators,
  resultsCount,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const clearSearch = () => {
    onSearchChange("")
    onFiltersChange({})
  }

  const removeFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const activeFiltersCount = Object.keys(filters).length
  const hasActiveSearch = searchQuery.length > 0 || activeFiltersCount > 0

  const priorityColors = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  }

  const statusColors = {
    todo: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "in-progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search tasks, columns, assignees..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 text-sm sm:text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white h-6 w-6 sm:h-8 sm:w-8 p-0"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center space-x-2">
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className={`border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 w-full sm:w-auto ${
                  activeFiltersCount > 0 ? "border-blue-500 text-blue-400" : ""
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                    isFiltersOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="absolute top-full left-0 right-0 z-50 mt-2">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl backdrop-blur-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Priority Filter */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">Priority</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
                        >
                          {filters.priority ? (
                            <span className="capitalize">{filters.priority}</span>
                          ) : (
                            "Any Priority"
                          )}
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                        <DropdownMenuItem
                          onClick={() => removeFilter("priority")}
                          className="hover:bg-slate-700 focus:bg-slate-700"
                        >
                          Any Priority
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        {(["high", "medium", "low"] as const).map((priority) => (
                          <DropdownMenuItem
                            key={priority}
                            onClick={() => onFiltersChange({ ...filters, priority })}
                            className="hover:bg-slate-700 focus:bg-slate-700 capitalize"
                          >
                            {priority}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">Status</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
                        >
                          {filters.status ? (
                            <span className="capitalize">{filters.status.replace("-", " ")}</span>
                          ) : (
                            "Any Status"
                          )}
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                        <DropdownMenuItem
                          onClick={() => removeFilter("status")}
                          className="hover:bg-slate-700 focus:bg-slate-700"
                        >
                          Any Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        {(["todo", "in-progress", "completed"] as const).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => onFiltersChange({ ...filters, status })}
                            className="hover:bg-slate-700 focus:bg-slate-700 capitalize"
                          >
                            {status.replace("-", " ")}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Assignee Filter */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">Assignee</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
                        >
                          {filters.assignee ? (
                            <span>{getUserDisplayName(getUserById(availableAssignees, filters.assignee))}</span>
                          ) : (
                            "Any Assignee"
                          )}
                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white w-48">
                        <DropdownMenuItem
                          onClick={() => removeFilter("assignee")}
                          className="hover:bg-slate-700 focus:bg-slate-700"
                        >
                          Any Assignee
                        </DropdownMenuItem>
                        {availableAssignees.length > 0 && (
                          <>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            {availableAssignees.map((assignee) => (
                              <DropdownMenuItem
                                key={assignee._id}
                                onClick={() => onFiltersChange({ ...filters, assignee: assignee._id })}
                                className="hover:bg-slate-700 focus:bg-slate-700"
                              >
                                {getUserDisplayName(assignee)}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Creator Filter */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">Creator</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
                        >
                          {filters.creator ? (
                            <span>{getUserDisplayName(getUserById(availableCreators, filters.creator))}</span>
                          ) : (
                            "Any Creator"
                          )}
                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white w-48">
                        <DropdownMenuItem
                          onClick={() => removeFilter("creator")}
                          className="hover:bg-slate-700 focus:bg-slate-700"
                        >
                          Any Creator
                        </DropdownMenuItem>
                        {availableCreators.length > 0 && (
                          <>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            {availableCreators.map((creator) => (
                              <DropdownMenuItem
                                key={creator._id}
                                onClick={() => onFiltersChange({ ...filters, creator: creator._id })}
                                className="hover:bg-slate-700 focus:bg-slate-700"
                              >
                                {getUserDisplayName(creator)}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Overdue Toggle */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <Button
                    variant={filters.overdue ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      onFiltersChange(
                        filters.overdue ? { ...filters, overdue: undefined } : { ...filters, overdue: true },
                      )
                    }
                    className={`text-sm ${
                      filters.overdue
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    Show Overdue Only
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {hasActiveSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Clear all</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(hasActiveSearch || resultsCount !== undefined) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className={`text-xs px-2 py-1 ${
                    key === "priority" && typeof value === "string"
                      ? priorityColors[value as keyof typeof priorityColors]
                      : key === "status" && typeof value === "string"
                        ? statusColors[value as keyof typeof statusColors]
                        : key === "overdue"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-slate-600 text-slate-300 border-slate-500/30"
                  } border cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => removeFilter(key as keyof SearchFilters)}
                >
                  {key === "overdue" ? "Overdue" : `${key}: ${value}`}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )
            })}
          </div>
          {resultsCount !== undefined && (
            <div className="text-xs text-slate-400">
              {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
