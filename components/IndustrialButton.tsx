/**
 * IndustrialButton Component
 *
 * A button with an industrial design, including metallic gradients,
 * LED indicators, and press animations.
 */

"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface IndustrialButtonProps {
  label: string
  active?: boolean
  disabled?: boolean
  destructive?: boolean
  onClick: () => void
  icon?: React.ReactNode
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function IndustrialButton({
  label,
  active = false,
  disabled = false,
  destructive = false,
  onClick,
  icon,
  size = "md",
  className,
}: IndustrialButtonProps) {
  const [pressed, setPressed] = useState(false)

  const handleMouseDown = () => {
    if (!disabled) setPressed(true)
  }

  const handleMouseUp = () => {
    if (!disabled) setPressed(false)
  }

  const handleClick = () => {
    if (!disabled) onClick()
  }

  // Size classes
  const sizeClasses = {
    sm: "h-8 text-xs px-2",
    md: "h-12 text-sm px-3",
    lg: "h-16 text-base px-4",
  }

  // Base style
  const baseStyle = "relative font-medium rounded-md transition-all duration-150 select-none"

  // Button style based on state
  const buttonStyle = cn(
    baseStyle,
    sizeClasses[size],
    "border-2 shadow-md",
    active
      ? "border-yellow-600 bg-gradient-to-b from-yellow-400 to-yellow-500 text-gray-900"
      : destructive
        ? "border-red-800 bg-gradient-to-b from-red-600 to-red-700 text-white"
        : "border-gray-600 bg-gradient-to-b from-gray-300 to-gray-400 text-gray-900",
    pressed && !disabled && "translate-y-0.5 shadow-sm",
    disabled && "opacity-50 cursor-not-allowed",
    className,
  )

  // LED indicator style
  const ledStyle = cn(
    "absolute top-2 right-2 w-2 h-2 rounded-full",
    active ? "bg-green-500 shadow-[0_0_5px_#10b981]" : "bg-gray-500",
  )

  return (
    <button
      className={buttonStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled}
    >
      <div className="flex items-center justify-center gap-2">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>
      {size !== "sm" && <div className={ledStyle} />}

      {/* Metallic effect overlay */}
      <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-20" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white to-transparent opacity-30" />
      </div>
    </button>
  )
}
