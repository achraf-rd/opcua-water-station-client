/**
 * AlertBanner Component
 *
 * Displays alert messages for critical conditions in the water treatment system.
 */

"use client"

import { AlertCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AlertBannerProps {
  aru: boolean | null
  bpPompe: boolean | null
  bpVanne: boolean | null
}

export default function AlertBanner({ aru, bpPompe, bpVanne }: AlertBannerProps) {
  // Check for emergency stop (ARU)
  if (aru === true) {
    return (
      <Alert variant="destructive" className="mb-4 border-2 border-red-700 bg-red-50">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-red-800 font-bold">EMERGENCY STOP ACTIVATED</AlertTitle>
        <AlertDescription className="text-red-700">
          The system is in emergency stop mode. Please check the equipment and reset when safe.
        </AlertDescription>
      </Alert>
    )
  }

  // Check for pump or valve issues
  if (bpPompe === false || bpVanne === false) {
    return (
      <Alert className="mb-4 border-2 border-yellow-500 bg-yellow-50">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-800 font-bold">WARNING</AlertTitle>
        <AlertDescription className="text-yellow-700">
          {bpPompe === false && bpVanne === false && "Pump and valve are inactive."}
          {bpPompe === false && bpVanne !== false && "Pump is inactive."}
          {bpPompe !== false && bpVanne === false && "Valve is inactive."}
        </AlertDescription>
      </Alert>
    )
  }

  // No alerts to show
  return null
}
