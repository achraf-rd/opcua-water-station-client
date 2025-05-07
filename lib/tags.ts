/**
 * OPC-UA Tag Definitions
 *
 * This file defines the tags used in the water treatment station,
 * including their node IDs, data types, and access permissions.
 */

// Define the tag names as a type for type safety
export type TagName =
  | "ARU" // Emergency stop
  | "AUT" // Automatic mode
  | "BPpompe" // Pump button
  | "BPvanne" // Valve button
  | "REA" // Reset
  | "arret" // Stop
  | "marche" // Start
  | "niveau" // Water level
  | "pompe" // Pump
  | "vanne" // Valve

// Define the tag information
interface TagInfo {
  nodeId: string
  type: "Boolean" | "Int16" | "Float" | "String"
  access: ("Read" | "Write")[]
  description: string
}

// Define all tags with their properties
export const tags: Record<TagName, TagInfo> = {
  ARU: {
    nodeId: "ns=4;s=ARU",
    type: "Boolean",
    access: ["Read", "Write"],
    description: "Emergency stop button",
  },
  AUT: {
    nodeId: "ns=4;s=AUT",
    type: "Boolean",
    access: ["Read", "Write"],
    description: "Automatic mode",
  },
  BPpompe: {
    nodeId: "ns=4;s=BPpompe",
    type: "Boolean",
    access: ["Read"],
    description: "Pump button status",
  },
  BPvanne: {
    nodeId: "ns=4;s=BPvanne",
    type: "Boolean",
    access: ["Read"],
    description: "Valve button status",
  },
  REA: {
    nodeId: "ns=4;s=REA",
    type: "Boolean",
    access: ["Read", "Write"],
    description: "Reset button",
  },
  arret: {
    nodeId: "ns=4;s=arret",
    type: "Boolean",
    access: ["Read", "Write"],
    description: "Stop button",
  },
  marche: {
    nodeId: "ns=4;s=marche",
    type: "Boolean",
    access: ["Read", "Write"],
    description: "Start button",
  },
  niveau: {
    nodeId: "ns=4;s=niveau",
    type: "Int16",
    access: ["Read"],
    description: "Water level",
  },
  pompe: {
    nodeId: "ns=4;s=pompe",
    type: "Boolean",
    access: ["Read", "Write"],
    description: "Pump control",
  },
  vanne: {
    nodeId: "ns=4;s=vanne",
    type: "Boolean",
    access: ["Read", "Write"],
    description: "Valve control",
  },
}
