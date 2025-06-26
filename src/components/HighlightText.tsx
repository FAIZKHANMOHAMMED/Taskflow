"use client"

import type React from "react"

interface HighlightTextProps {
  text: string
  searchQuery: string
  className?: string
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, searchQuery, className = "" }) => {
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>
  }

  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-400 text-slate-900 px-1 rounded">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  )
}
