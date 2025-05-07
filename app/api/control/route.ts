/**
 * Control API Route for OPC-UA Tag Writing
 *
 * This route handles requests to write values to OPC-UA tags.
 */

import { NextResponse } from "next/server"
import { getOPCClient } from "@/lib/opcClient"
import type { TagName } from "@/lib/tags"

/**
 * POST handler for tag control
 *
 * @param request - The incoming request
 * @returns NextResponse - The JSON response
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { tag, value, url } = body

    // Validate request parameters
    if (!tag || value === undefined) {
      return NextResponse.json({ error: "Missing tag or value in request" }, { status: 400 })
    }

    // Get OPC client instance
    const opcClient = getOPCClient()

    // Connect to OPC-UA server if URL is provided
    if (url && (!opcClient.isConnected() || opcClient.getConnectionUrl() !== url)) {
      console.log(`Connecting to OPC-UA server at ${url} for control operation`)
      const isConnected = await opcClient.connect(url)

      if (!isConnected) {
        return NextResponse.json({ error: `Failed to connect to OPC-UA server at ${url}` }, { status: 500 })
      }
    }

    // Ensure client is connected
    if (!opcClient.isConnected()) {
      return NextResponse.json({ error: "Not connected to OPC-UA server" }, { status: 500 })
    }

    // Write value to tag
    console.log(`Writing value ${value} to tag ${tag}`)
    const success = await opcClient.writeTag(tag as TagName, value)

    if (success) {
      return NextResponse.json({ success: true, tag, value })
    } else {
      return NextResponse.json({ error: `Failed to write value to tag ${tag}` }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in control API:", error)

    // For development, simulate success if OPC connection fails
    if (process.env.NODE_ENV === "development") {
      const { tag, value } = await request.json()
      console.log(`Development mode: Simulating successful write of ${value} to ${tag}`)
      return NextResponse.json({ success: true, tag, value, mock: true })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
