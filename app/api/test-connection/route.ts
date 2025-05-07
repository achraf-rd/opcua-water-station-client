/**
 * Test Connection API Route
 *
 * This route tests the connection to an OPC-UA server without
 * establishing a full subscription.
 */

import { NextResponse } from "next/server"
import { getOPCClient } from "@/lib/opcClient"

/**
 * POST handler for testing OPC-UA connection
 *
 * @param request - The incoming request
 * @returns NextResponse - The JSON response
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { url } = body

    // Validate URL
    if (!url) {
      return NextResponse.json({ error: "Missing URL in request" }, { status: 400 })
    }

    console.log(`Testing connection to OPC-UA server at ${url}`)

    // Get OPC client instance
    const opcClient = getOPCClient()

    // Try to connect with a timeout
    const connectionPromise = opcClient.connect(url)
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), 10000) // 10 second timeout
    })

    // Race the connection against the timeout
    const connected = await Promise.race([connectionPromise, timeoutPromise])

    if (connected) {
      console.log(`Successfully connected to OPC-UA server at ${url}`)

      // Disconnect after successful test
      await opcClient.disconnect()

      return NextResponse.json({ success: true, message: "Connection successful" })
    } else {
      console.error(`Failed to connect to OPC-UA server at ${url}`)
      return NextResponse.json({ success: false, error: "Failed to connect to OPC-UA server" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error testing connection:", error)

    // For development, simulate success
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Simulating successful connection")
      return NextResponse.json({ success: true, message: "Development mode: Connection simulated", mock: true })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
