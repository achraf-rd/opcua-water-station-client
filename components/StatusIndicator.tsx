/**
 * StatusIndicator Component
 *
 * A visual indicator for showing the status of various components
 * in the water treatment system.
 */

"use client"

import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  label: string
  value: boolean | null
  activeColor?: string
  inactiveColor?: string
  className?: string
}

export default function StatusIndicator({
  label,
  value,
  activeColor = "bg-green-500",
  inactiveColor = "bg-gray-500",
  className,
}: StatusIndicatorProps) {
  // Determine indicator color based on value
  const indicatorColor = value === true ? activeColor : value === false ? inactiveColor : "bg-gray-400"

  // Add shadow effect for active indicators
  const indicatorStyle =
    value === true
      ? {
          boxShadow: `0 0 5px ${
            activeColor.includes("green")
              ? "#10b981"
              : activeColor.includes("red")
                ? "#ef4444"
                : activeColor.includes("blue")
                  ? "#3b82f6"
                  : activeColor.includes("yellow")
                    ? "#f59e0b"
                    : "currentColor"
          }`,
        }
      : {}

  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-md border border-gray-600", className)}>
      <div className={`w-3 h-3 rounded-full ${indicatorColor}`} style={indicatorStyle}></div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}
