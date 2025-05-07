/**
 * IndustrialControlPanel Component
 *
 * A control panel with industrial-themed buttons and status indicators
 * for controlling the water treatment station.
 */

"use client"

import { Play, Power, Gauge, Droplet, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import IndustrialButton from "./IndustrialButton"
import StatusIndicator from "./StatusIndicator"
import type { TagName } from "@/lib/tags"

interface IndustrialControlPanelProps {
  tagValues: Record<TagName, any>
  onControlChange: (tag: TagName, value: boolean) => Promise<boolean>
  isDisabled?: boolean
}

export default function IndustrialControlPanel({
  tagValues,
  onControlChange,
  isDisabled = false,
}: IndustrialControlPanelProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isDisabled ? "opacity-70" : ""}`}>
      {/* Operation Controls */}
      <Card className="border-2 border-gray-400 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white border-b-2 border-gray-400">
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Operation Controls
          </CardTitle>
          <CardDescription className="text-gray-300">Start, stop, and mode selection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <IndustrialButton
              label="START"
              icon={<Play className="h-4 w-4" />}
              active={tagValues.marche === true}
              onClick={() => onControlChange("marche", true)}
              className="bg-gradient-to-b from-green-600 to-green-700 border-green-800 text-white"
              disabled={isDisabled}
            />
            <IndustrialButton
              label="STOP"
              icon={<Power className="h-4 w-4" />}
              active={tagValues.arret === true}
              onClick={() => onControlChange("arret", true)}
              destructive
              disabled={isDisabled}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2 p-3 bg-gray-800 rounded-md">
            <Switch
              id="auto-mode"
              checked={tagValues.AUT === true}
              onCheckedChange={(checked) => onControlChange("AUT", checked)}
              className="data-[state=checked]:bg-yellow-500"
              disabled={isDisabled}
            />
            <Label htmlFor="auto-mode" className="text-white font-medium">
              {tagValues.AUT === true ? "AUTOMATIC MODE" : "MANUAL MODE"}
            </Label>
          </div>

          <IndustrialButton
            label="EMERGENCY STOP"
            icon={<AlertTriangle className="h-4 w-4" />}
            active={tagValues.ARU === true}
            onClick={() => onControlChange("ARU", true)}
            destructive
            size="lg"
            className="w-full bg-gradient-to-b from-red-600 to-red-700 border-red-800 text-white"
            disabled={isDisabled}
          />
        </CardContent>
      </Card>

      {/* Equipment Controls */}
      <Card className="border-2 border-gray-400 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white border-b-2 border-gray-400">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Equipment Controls
          </CardTitle>
          <CardDescription className="text-gray-300">Pump and valve controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <IndustrialButton
              label="PUMP"
              icon={<Droplet className="h-4 w-4" />}
              active={tagValues.pompe === true}
              onClick={() => onControlChange("pompe", !tagValues.pompe)}
              disabled={isDisabled || tagValues.AUT === true}
              className="bg-gradient-to-b from-blue-600 to-blue-700 border-blue-800 text-white"
            />
            <IndustrialButton
              label="VALVE"
              icon={<Droplet className="h-4 w-4" />}
              active={tagValues.vanne === true}
              onClick={() => onControlChange("vanne", !tagValues.vanne)}
              disabled={isDisabled || tagValues.AUT === true}
              className="bg-gradient-to-b from-blue-600 to-blue-700 border-blue-800 text-white"
            />
          </div>

          <div className="p-4 bg-gray-800 rounded-md">
            <div className="text-sm font-medium mb-3 text-white">STATUS INDICATORS</div>
            <div className="grid grid-cols-2 gap-3">
              <StatusIndicator
                label="PUMP BUTTON"
                value={isDisabled ? null : tagValues.BPpompe}
                activeColor="bg-green-500"
                className="bg-gray-700 text-white"
              />
              <StatusIndicator
                label="VALVE BUTTON"
                value={isDisabled ? null : tagValues.BPvanne}
                activeColor="bg-green-500"
                className="bg-gray-700 text-white"
              />
              <StatusIndicator
                label="EMERGENCY"
                value={isDisabled ? null : tagValues.ARU}
                activeColor="bg-red-500"
                className="bg-gray-700 text-white"
              />
              <StatusIndicator
                label="RESET"
                value={isDisabled ? null : tagValues.REA}
                activeColor="bg-blue-500"
                className="bg-gray-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
