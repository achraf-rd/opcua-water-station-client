/**
 * OPC-UA Client for Water Treatment Station Monitoring
 *
 * This module provides a wrapper around the node-opcua library to connect to an OPC-UA server,
 * read and write tags, and monitor tag changes.
 */

import {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  ClientSubscription,
  TimestampsToReturn,
  ClientMonitoredItem,
  type DataValue,
  type MonitoringParametersOptions,
  type ReadValueIdOptions,
  type ClientSession,
  DataType,
} from "node-opcua"
import { tags, type TagName } from "./tags"

// OPC UA connection parameters
const connectionStrategy = {
  initialDelay: 1000,
  maxRetry: 10,
}

const options = {
  applicationName: "Water Treatment Station Client",
  connectionStrategy,
  securityMode: MessageSecurityMode.None,
  securityPolicy: SecurityPolicy.None,
  endpointMustExist: false,
}

/**
 * OPCUAClientWrapper class
 *
 * Provides a simplified interface to interact with an OPC-UA server,
 * handling connection, session management, subscriptions, and tag operations.
 */
class OPCUAClientWrapper {
  private client: OPCUAClient
  private session: ClientSession | null = null
  private subscription: ClientSubscription | null = null
  private monitoredItems: Map<string, ClientMonitoredItem> = new Map()
  private connected = false
  private tagValues: Record<TagName, any> = {} as Record<TagName, any>
  private onUpdateCallbacks: ((tagName: TagName, value: any) => void)[] = []
  private currentUrl = ""

  /**
   * Constructor
   * Initializes the OPC-UA client and tag values
   */
  constructor() {
    this.client = OPCUAClient.create(options)

    // Initialize tag values to null
    Object.keys(tags).forEach((tagName) => {
      this.tagValues[tagName as TagName] = null
    })
  }

  /**
   * Connect to the OPC-UA server
   *
   * @param endpointUrl - The URL of the OPC-UA server
   * @returns Promise<boolean> - True if connection is successful, false otherwise
   */
  async connect(endpointUrl = "opc.tcp://localhost:4334"): Promise<boolean> {
    // If already connected to the same URL, return true
    if (this.connected && this.currentUrl === endpointUrl) {
      return true
    }

    // If connected to a different URL, disconnect first
    if (this.connected && this.currentUrl !== endpointUrl) {
      await this.disconnect()
    }

    try {
      console.log(`Attempting to connect to OPC-UA server at ${endpointUrl}`)

      // Add timeout to connection attempt
      const connectionPromise = this.client.connect(endpointUrl)
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 10000) // 10 second timeout
      })

      await Promise.race([connectionPromise, timeoutPromise])
      this.session = await this.client.createSession()
      this.connected = true
      this.currentUrl = endpointUrl
      console.log(`Connected to OPC-UA server at ${endpointUrl}`)

      // Create subscription after connection
      await this.createSubscription()

      return true
    } catch (err) {
      console.error(`Failed to connect to OPC-UA server at ${endpointUrl}:`, err)

      // For development/testing, create mock data if connection fails
      if (process.env.NODE_ENV === "development") {
        console.log("Using mock data for development")
        this.connected = true
        this.currentUrl = endpointUrl
        this.mockTagValues()
        return true
      }

      return false
    }
  }

  /**
   * Disconnect from the OPC-UA server
   *
   * @returns Promise<void>
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return

    try {
      console.log("Disconnecting from OPC-UA server")

      // Terminate subscription if it exists
      if (this.subscription) {
        await this.subscription.terminate()
        this.subscription = null
      }

      // Close session if it exists
      if (this.session) {
        await this.session.close()
        this.session = null
      }

      // Disconnect client
      await this.client.disconnect()
      this.connected = false
      console.log("Disconnected from OPC-UA server")
    } catch (err) {
      console.error("Error during disconnection:", err)
    }
  }

  /**
   * Create a subscription to monitor tag changes
   *
   * @returns Promise<void>
   */
  private async createSubscription(): Promise<void> {
    if (!this.session || !this.connected) return

    try {
      console.log("Creating subscription for tag monitoring")

      this.subscription = ClientSubscription.create(this.session, {
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10,
      })

      this.subscription.on("started", () => {
        console.log("Subscription started, ID:", this.subscription?.subscriptionId)
      })

      this.subscription.on("terminated", () => {
        console.log("Subscription terminated")
      })

      // Monitor all readable tags
      for (const [tagName, tagInfo] of Object.entries(tags)) {
        if (tagInfo.access.includes("Read")) {
          await this.monitorTag(tagName as TagName)
        }
      }
    } catch (err) {
      console.error("Error creating subscription:", err)
    }
  }

  /**
   * Monitor a specific tag for changes
   *
   * @param tagName - The name of the tag to monitor
   * @returns Promise<void>
   */
  private async monitorTag(tagName: TagName): Promise<void> {
    if (!this.subscription || !this.session) return

    const tag = tags[tagName]

    try {
      console.log(`Setting up monitoring for tag: ${tagName}`)

      const itemToMonitor: ReadValueIdOptions = {
        nodeId: tag.nodeId,
        attributeId: AttributeIds.Value,
      }

      const parameters: MonitoringParametersOptions = {
        samplingInterval: 1000,
        discardOldest: true,
        queueSize: 10,
      }

      const monitoredItem = ClientMonitoredItem.create(
        this.subscription,
        itemToMonitor,
        parameters,
        TimestampsToReturn.Both,
      )

      monitoredItem.on("changed", (dataValue: DataValue) => {
        this.tagValues[tagName] = dataValue.value.value

        // Notify all callbacks
        this.onUpdateCallbacks.forEach((callback) => {
          callback(tagName, dataValue.value.value)
        })

        console.log(`${tagName} value changed to ${dataValue.value.value}`)
      })

      this.monitoredItems.set(tagName, monitoredItem)
    } catch (err) {
      console.error(`Error monitoring tag ${tagName}:`, err)
    }
  }

  /**
   * Write a value to a tag
   *
   * @param tagName - The name of the tag to write to
   * @param value - The value to write
   * @returns Promise<boolean> - True if write is successful, false otherwise
   */
  async writeTag(tagName: TagName, value: any): Promise<boolean> {
    if (!this.session || !this.connected) {
      console.error("Not connected to OPC-UA server")
      return false
    }

    const tag = tags[tagName]

    if (!tag.access.includes("Write")) {
      console.error(`Tag ${tagName} is not writable`)
      return false
    }

    try {
      console.log(`Writing value ${value} to tag ${tagName}`)

      // Determine the data type based on the tag type
      let dataType: DataType

      switch (tag.type) {
        case "Boolean":
          dataType = DataType.Boolean
          break
        case "Int16":
          dataType = DataType.Int16
          break
        default:
          dataType = DataType.Variant
      }

      const nodeToWrite = {
        nodeId: tag.nodeId,
        attributeId: AttributeIds.Value,
        value: {
          value: {
            dataType,
            value,
          },
        },
      }

      const statusCode = await this.session.write(nodeToWrite)
      console.log(`Write status for ${tagName}:`, statusCode.toString())

      // Update local value after successful write
      if (statusCode.isGood()) {
        this.tagValues[tagName] = value
        return true
      }

      return false
    } catch (err) {
      console.error(`Error writing to tag ${tagName}:`, err)
      return false
    }
  }

  /**
   * Read a value from a tag
   *
   * @param tagName - The name of the tag to read
   * @returns Promise<any> - The value of the tag
   */
  async readTag(tagName: TagName): Promise<any> {
    if (!this.session || !this.connected) {
      console.error("Not connected to OPC-UA server")
      return null
    }

    const tag = tags[tagName]

    if (!tag.access.includes("Read")) {
      console.error(`Tag ${tagName} is not readable`)
      return null
    }

    try {
      console.log(`Reading value from tag ${tagName}`)

      const dataValue = await this.session.read({
        nodeId: tag.nodeId,
        attributeId: AttributeIds.Value,
      })

      if (dataValue.statusCode.isGood()) {
        this.tagValues[tagName] = dataValue.value.value
        return dataValue.value.value
      }

      return null
    } catch (err) {
      console.error(`Error reading tag ${tagName}:`, err)
      return null
    }
  }

  /**
   * Read all readable tags
   *
   * @returns Promise<Record<TagName, any>> - The values of all tags
   */
  async readAllTags(): Promise<Record<TagName, any>> {
    if (!this.session || !this.connected) {
      console.error("Not connected to OPC-UA server")
      return this.tagValues
    }

    console.log("Reading all tags")

    const readPromises = Object.keys(tags)
      .filter((tagName) => tags[tagName as TagName].access.includes("Read"))
      .map(async (tagName) => {
        const value = await this.readTag(tagName as TagName)
        return { tagName, value }
      })

    const results = await Promise.all(readPromises)

    results.forEach(({ tagName, value }) => {
      this.tagValues[tagName as TagName] = value
    })

    return this.tagValues
  }

  /**
   * Get all tag values
   *
   * @returns Record<TagName, any> - The current values of all tags
   */
  getAllTagValues(): Record<TagName, any> {
    return this.tagValues
  }

  /**
   * Register a callback for tag updates
   *
   * @param callback - The callback function to call when a tag value changes
   * @returns () => void - A function to unregister the callback
   */
  onTagUpdate(callback: (tagName: TagName, value: any) => void): () => void {
    this.onUpdateCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      this.onUpdateCallbacks = this.onUpdateCallbacks.filter((cb) => cb !== callback)
    }
  }

  /**
   * Create mock data for development/testing
   *
   * This method is used when the OPC-UA server is not available
   * and we want to simulate tag values for development purposes.
   */
  private mockTagValues(): void {
    console.log("Initializing mock tag values for development")

    // Set initial mock values
    this.tagValues = {
      ARU: false,
      AUT: false,
      BPpompe: true,
      BPvanne: true,
      REA: false,
      arret: false,
      marche: true,
      niveau: 65,
      pompe: true,
      vanne: true,
    } as Record<TagName, any>

    // Simulate changes to niveau every 5 seconds
    setInterval(() => {
      const newNiveau = Math.floor(Math.random() * 100)
      this.tagValues.niveau = newNiveau

      // Notify callbacks
      this.onUpdateCallbacks.forEach((callback) => {
        callback("niveau", newNiveau)
      })
    }, 5000)

    // Simulate occasional changes to other tags
    setInterval(() => {
      const tags: TagName[] = ["BPpompe", "BPvanne", "pompe", "vanne"]
      const randomTag = tags[Math.floor(Math.random() * tags.length)]
      const newValue = !this.tagValues[randomTag]

      this.tagValues[randomTag] = newValue

      // Notify callbacks
      this.onUpdateCallbacks.forEach((callback) => {
        callback(randomTag, newValue)
      })
    }, 15000)
  }

  /**
   * Get the current connection status
   *
   * @returns boolean - True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Get the current connection URL
   *
   * @returns string - The current connection URL
   */
  getConnectionUrl(): string {
    return this.currentUrl
  }
}

// Singleton instance
let opcClient: OPCUAClientWrapper | null = null

/**
 * Get the OPC-UA client instance
 *
 * @returns OPCUAClientWrapper - The OPC-UA client instance
 */
export function getOPCClient(): OPCUAClientWrapper {
  if (!opcClient) {
    opcClient = new OPCUAClientWrapper()
  }
  return opcClient
}
