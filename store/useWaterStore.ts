/**
 * Water Treatment Station Store
 *
 * This Zustand store manages the state of the water treatment station,
 * including tag values and connection status.
 */

import { create } from "zustand"
import type { TagName } from "@/lib/tags"

interface WaterStoreState {
  // Connection status
  connected: boolean

  // Tag values with their types
  ARU: boolean | null
  AUT: boolean | null
  BPpompe: boolean | null
  BPvanne: boolean | null
  REA: boolean | null
  arret: boolean | null
  marche: boolean | null
  niveau: number | null
  pompe: boolean | null
  vanne: boolean | null

  // Store actions
  setConnected: (connected: boolean) => void
  setTagValue: (tag: TagName, value: any) => void
  updateAllTags: (values: Record<TagName, any>) => void
  reset: () => void
}

// Initial state with null values
const initialState = {
  connected: false,
  ARU: null,
  AUT: null,
  BPpompe: null,
  BPvanne: null,
  REA: null,
  arret: null,
  marche: null,
  niveau: null,
  pompe: null,
  vanne: null,
}

export const useWaterStore = create<WaterStoreState>((set) => ({
  ...initialState,

  // Set connection status
  setConnected: (connected: boolean) => set({ connected }),

  // Update a single tag value
  setTagValue: (tag: TagName, value: any) =>
    set(
      (state) =>
        ({
          [tag]: value,
        }) as unknown as Partial<WaterStoreState>,
    ),

  // Update all tag values at once
  updateAllTags: (values: Record<TagName, any>) =>
    set(
      (state) =>
        ({
          ...Object.fromEntries(Object.entries(values).map(([tag, value]) => [tag, value])),
        }) as unknown as Partial<WaterStoreState>,
    ),

  // Reset store to initial state
  reset: () => set(initialState),
}))
