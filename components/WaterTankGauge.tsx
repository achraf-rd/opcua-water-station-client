/**
 * WaterTankGauge Component
 *
 * A realistic water tank gauge with animated water level.
 */

"use client"

import { useEffect, useRef, useState } from "react"

interface WaterTankGaugeProps {
  value: number | null
  min?: number
  max?: number
  label?: string
  units?: string
  isDisabled?: boolean
}

export default function WaterTankGauge({
  value,
  min = 0,
  max = 100,
  label = "Water Level",
  units = "%",
  isDisabled = false,
}: WaterTankGaugeProps) {
  const tankRef = useRef<HTMLDivElement>(null)
  const [animatedValue, setAnimatedValue] = useState(value || 0)

  // Calculate percentage for display
  const percentage = value !== null ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0

  // Display value or placeholder
  const displayValue = value !== null ? value : "--"

  // Animate the water level
  useEffect(() => {
    if (value === null) return

    // Animate the value change
    const startValue = animatedValue
    const endValue = value
    const duration = 1000 // ms
    const startTime = performance.now()

    const animateValue = (currentTime: number) => {
      const elapsedTime = currentTime - startTime

      if (elapsedTime < duration) {
        const progress = elapsedTime / duration
        const newValue = startValue + (endValue - startValue) * progress
        setAnimatedValue(newValue)
        requestAnimationFrame(animateValue)
      } else {
        setAnimatedValue(endValue)
      }
    }

    requestAnimationFrame(animateValue)
  }, [value])

  // Determine water color based on level
  const getWaterColor = () => {
    if (percentage > 90) return "from-red-500 to-red-600"
    if (percentage > 75) return "from-yellow-400 to-yellow-500"
    return "from-blue-400 to-blue-500"
  }

  return (
    <div className="flex flex-col items-center">
      <div className="text-lg font-bold mb-2 text-gray-700">{label}</div>

      <div className="relative w-48 h-64 mb-4">
        {/* Tank container */}
        <div
          ref={tankRef}
          className="absolute inset-0 border-4 border-gray-400 rounded-lg bg-gray-100 overflow-hidden"
          style={{
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.2), 0 0 15px rgba(0,0,0,0.1)",
            background: "linear-gradient(to right, #e5e7eb, #f3f4f6, #e5e7eb)",
          }}
        >
          {/* Water */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-b ${
              isDisabled ? "from-gray-300 to-gray-400" : getWaterColor()
            } transition-all duration-300`}
            style={{
              height: `${isDisabled ? 0 : percentage}%`,
              boxShadow: "inset 0 0 30px rgba(0,0,0,0.2)",
              transform: "translateZ(0)",
              overflow: "hidden",
            }}
          >
            {/* Water animation - only when not disabled */}
            {!isDisabled && (
              <div className="absolute inset-0 opacity-30">
                <div
                  className="absolute inset-0 animate-wave1"
                  style={{
                    background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.5))",
                    height: "20%",
                    transformOrigin: "center bottom",
                  }}
                />
                <div
                  className="absolute inset-0 animate-wave2"
                  style={{
                    background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.3))",
                    height: "25%",
                    transformOrigin: "center bottom",
                    animationDelay: "-2.5s",
                  }}
                />
              </div>
            )}
          </div>

          {/* Level markers */}
          <div className="absolute inset-y-0 left-0 w-6 flex flex-col justify-between py-2 px-1">
            {[0, 25, 50, 75, 100].map((level) => (
              <div key={level} className="flex items-center">
                <div className="w-2 h-1 bg-gray-600" />
                <span className="text-xs text-gray-600 ml-1">{level}</span>
              </div>
            ))}
          </div>

          {/* Pipes */}
          <div className="absolute -left-4 bottom-6 w-4 h-8 bg-gradient-to-b from-gray-400 to-gray-500 rounded-l-lg" />
          <div className="absolute -right-4 top-6 w-4 h-8 bg-gradient-to-b from-gray-400 to-gray-500 rounded-r-lg" />
        </div>

        {/* Digital display */}
        <div className="absolute -bottom-10 left-0 right-0 text-center">
          <div
            className={`inline-block bg-black text-${isDisabled ? "gray-500" : "green-500"} font-mono text-2xl text-white px-4 py-1 rounded-md border-2 border-gray-700`}
          >
            {isDisabled ? "---" : typeof displayValue === "number" ? displayValue.toFixed(1) : displayValue}
            {!isDisabled && units}
          </div>
        </div>
      </div>
    </div>
  )
}
