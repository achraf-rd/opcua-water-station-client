/**
 * WebSocket API Route for OPC-UA Data Streaming
 *
 * This route establishes a Server-Sent Events (SSE) connection to stream
 * real-time OPC-UA tag updates to the client.
 */

import type { NextRequest } from "next/server"
import { getOPCClient } from "@/lib/opcClient"

// Text encoder for SSE messages
const encoder = new TextEncoder()

// Store for active connections
const activeConnections = new Set<{
  controller: ReadableStreamDefaultController
  id: string
}>()

/**
 * GET handler for SSE connection
 *
 * @param request - The incoming request
 * @returns Response - The SSE stream response
 */
export async function GET(request: NextRequest) {
  // Get OPC URL from query parameter
  const url = request.nextUrl.searchParams.get("url") || "opc.tcp://localhost:4334"

  // Get OPC client instance
  const opcClient = getOPCClient()

  // Generate a unique ID for this connection
  const connectionId = crypto.randomUUID()

  // Try to connect to the OPC-UA server if not already connected
  if (!opcClient.isConnected() || opcClient.getConnectionUrl() !== url) {
    try {
      console.log(`Connecting to OPC-UA server at ${url}`)
      const connected = await opcClient.connect(url)

      if (connected) {
        console.log(`Successfully connected to OPC-UA server at ${url}`)

        // Read all tags to initialize values
        await opcClient.readAllTags()
      } else {
        console.error(`Failed to connect to OPC-UA server at ${url}`)
      }
    } catch (err) {
      console.error(`Error connecting to OPC-UA server at ${url}:`, err)
    }
  }

  // Create a stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log(`Starting SSE stream for client ${connectionId}`)

      // Send headers to keep connection alive
      controller.enqueue(encoder.encode(": ping\n\n"))

      // Add this client to the set of active connections
      activeConnections.add({ controller, id: connectionId })
      console.log(`Client connected: ${connectionId}, total: ${activeConnections.size}`)

      // Set up tag update callback for this connection
      const unsubscribe = opcClient.onTagUpdate((tagName, value) => {
        try {
          // Send tag update to this client
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tag: tagName, value })}\n\n`))
        } catch (err) {
          console.error(`Error sending update to client ${connectionId}:`, err)
        }
      })

      // Send initial data
      const initialData = opcClient.getAllTagValues()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ initial: initialData })}\n\n`))

      // Set up cleanup when connection closes
      request.signal.addEventListener("abort", () => {
        // Remove this client from active connections
        activeConnections.forEach((conn) => {
          if (conn.id === connectionId) {
            activeConnections.delete(conn)
            console.log(`Client disconnected: ${connectionId}, remaining: ${activeConnections.size}`)

            // Unsubscribe from tag updates
            unsubscribe()
          }
        })
      })
    },
    cancel() {
      // Remove this connection when cancelled
      activeConnections.forEach((conn) => {
        if (conn.id === connectionId) {
          activeConnections.delete(conn)
          console.log(`Client connection cancelled: ${connectionId}, remaining: ${activeConnections.size}`)
        }
      })
    },
  })

  // Return the stream as SSE with appropriate headers
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
