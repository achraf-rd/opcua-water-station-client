/**
 * Main Page Component
 *
 * The main interface for the water treatment station monitoring system.
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import WaterTankGauge from "@/components/WaterTankGauge"
import IndustrialControlPanel from "@/components/IndustrialControlPanel"
import AlertBanner from "@/components/AlertBanner"
import { useWaterStore } from "@/store/useWaterStore"
import { Server, AlertCircle, WifiOff } from "lucide-react"
import type { TagName } from "@/lib/tags"

export default function Home() {
  const waterStore = useWaterStore()
  const [opcUrl, setOpcUrl] = useState("opc.tcp://localhost:4334")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle connection to OPC-UA server
  const handleConnect = async () => {
    if (isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      // Test the connection first
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: opcUrl }),
      })

      const data = await response.json()

      if (data.success) {
        // If connection test is successful, establish WebSocket connection
        connectEventSource()
      } else {
        setError(data.error || "Failed to connect to OPC-UA server")
        setIsConnecting(false)
      }
    } catch (err) {
      console.error("Connection test error:", err)
      setError("Failed to test connection. Please try again.")
      setIsConnecting(false)
    }
  }

  // Connect to the WebSocket for real-time updates
  const connectEventSource = () => {
    let eventSource: EventSource | null = null
    let retryCount = 0
    const maxRetries = 5
    const retryDelay = 3000 // 3 seconds

    // Close existing connection if any
    if (eventSource) {
      eventSource.close()
    }

    // Create new connection with the OPC URL as a query parameter
    const encodedUrl = encodeURIComponent(opcUrl)
    eventSource = new EventSource(`/api/socket?url=${encodedUrl}`)

    eventSource.onopen = () => {
      console.log("EventSource connected")
      setIsConnecting(false)
      setIsConnected(true)
      waterStore.setConnected(true)
      setError(null)
      retryCount = 0
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Handle initial data
        if (data.initial) {
          waterStore.updateAllTags(data.initial)
        }
        // Handle individual tag updates
        else if (data.tag) {
          waterStore.setTagValue(data.tag as TagName, data.value)
        }
      } catch (err) {
        console.error("Error parsing event data:", err)
      }
    }

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err)
      eventSource?.close()

      if (retryCount < maxRetries) {
        setError(`Connection lost. Retrying (${retryCount + 1}/${maxRetries})...`)
        retryCount++
        setTimeout(connectEventSource, retryDelay)
      } else {
        setError("Failed to connect after multiple attempts. Please try again.")
        setIsConnecting(false)
        setIsConnected(false)
        waterStore.setConnected(false)
      }
    }

    // Clean up function
    return () => {
      if (eventSource) {
        console.log("Closing EventSource connection")
        eventSource.close()
      }
    }
  }

  // Function to handle control changes
  const handleControlChange = async (tag: TagName, value: boolean): Promise<boolean> => {
    try {
      const response = await fetch("/api/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag, value, url: opcUrl }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update ${tag}: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error(`Error updating ${tag}:`, error)
      setError(`Failed to update ${tag}. Please try again.`)
      return false
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-slate-700 to-slate-900 text-white py-4 rounded-lg shadow-md">
        Water Treatment Station Monitoring  
      </h1>

      {/* Connection panel - always visible */}
      <Card className="mb-6 border-2 border-gray-400 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white border-b-2 border-gray-400">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            OPC-UA Connection
          </CardTitle>
          <CardDescription className="text-red-300">
            this is just frontend example for the real app install the nextjs app and connect to your opc server
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={opcUrl}
              onChange={(e) => setOpcUrl(e.target.value)}
              placeholder="opc.tcp://hostname:port"
              className="font-mono text-sm border-2 border-gray-300 bg-white flex-grow"
              disabled={isConnecting || isConnected}
            />
            <Button
              onClick={handleConnect}
              disabled={isConnecting || isConnected || !opcUrl}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
            >
              {isConnecting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </>
              ) : isConnected ? (
                "Connected"
              ) : (
                "Connect"
              )}
            </Button>

            {isConnected && (
              <Button
                onClick={() => {
                  setIsConnected(false)
                  waterStore.setConnected(false)
                  // Reload the page to reset the connection
                  window.location.reload()
                }}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                Disconnect
              </Button>
            )}
          </div>

          {/* Connection status */}
          {isConnected ? (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Connected to {opcUrl}</span>
            </div>
          ) : (
            !isConnecting && (
              <div className="mt-3 p-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-gray-500" />
                <span>Not connected. Controls are disabled until connection is established.</span>
              </div>
            )
          )}

          {/* Error message */}
          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main content - always visible but disabled when not connected */}
      <>
        {/* Alert banner for critical conditions - only shown when connected */}
        {isConnected && <AlertBanner aru={waterStore.ARU} bpPompe={waterStore.BPpompe} bpVanne={waterStore.BPvanne} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Niveau gauge */}
          <Card
            className={`border-2 border-gray-400 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md lg:col-span-1 ${
              !isConnected ? "opacity-80" : ""
            }`}
          >
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white border-b-2 border-gray-400">
              <CardTitle>Water Level</CardTitle>
              <CardDescription className="text-gray-300">Current water level in the treatment tank</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-6">
              <WaterTankGauge value={isConnected ? waterStore.niveau : 0} min={0} max={100} isDisabled={!isConnected} />
            </CardContent>
          </Card>

          {/* Control panel */}
          <div className="lg:col-span-2">
            <IndustrialControlPanel
              tagValues={waterStore}
              onControlChange={handleControlChange}
              isDisabled={!isConnected}
            />
          </div>
        </div>
      </>
    </main>
  )
}
