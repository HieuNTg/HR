/**
 * Zustand store for dynamic JD → candidates mapping.
 * Manages AI-generated candidate sourcing with progress tracking.
 */

import { create } from "zustand"
import type { MockSourcingCandidate } from "@/lib/mock-data/mock-candidates-sourcing"

export interface JdEntry {
  id: string
  title: string
  department: string
  description: string
  candidates: MockSourcingCandidate[]
  /** Sourcing status: idle → sourcing → scoring → done */
  status: "idle" | "sourcing" | "scoring" | "done" | "error"
  /** Progress 0-100 for scoring animation */
  scoringProgress: number
  /** How many candidates scored so far (for progress display) */
  scoredCount: number
  createdAt: string
}

interface SourcingState {
  /** All dynamically created JDs with their candidates */
  jds: JdEntry[]

  /** Create a new JD and generate candidates via AI */
  createAndSource: (params: {
    title: string
    department?: string
    description?: string
  }) => Promise<string>

  /** Get a JD by id */
  getJd: (id: string) => JdEntry | undefined

  /** Get all candidates for interview routing */
  getAllCandidates: () => MockSourcingCandidate[]
}

let jdCounter = 0

export const useSourcingStore = create<SourcingState>((set, get) => ({
  jds: [],

  getJd(id: string) {
    return get().jds.find((j) => j.id === id)
  },

  getAllCandidates() {
    return get().jds.flatMap((j) => j.candidates)
  },

  async createAndSource({ title, department, description }) {
    const id = `jd-${++jdCounter}-${Date.now()}`

    // Step 1: Create JD entry with sourcing status
    const entry: JdEntry = {
      id,
      title,
      department: department ?? "",
      description: description ?? "",
      candidates: [],
      status: "sourcing",
      scoringProgress: 0,
      scoredCount: 0,
      createdAt: new Date().toISOString(),
    }

    set((s) => ({ jds: [entry, ...s.jds] }))

    try {
      // Step 2: Call API to generate candidates with Gemini
      const res = await fetch("/api/jds/generate-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, department, description, count: 10 }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        console.error("Generate candidates API error:", res.status, errBody)
        throw new Error(errBody?.detail || `API failed (${res.status})`)
      }
      const { candidates } = await res.json() as { candidates: MockSourcingCandidate[] }

      // Step 3: Scoring animation — reveal candidates one by one
      set((s) => ({
        jds: s.jds.map((j) =>
          j.id === id ? { ...j, status: "scoring" as const, candidates } : j,
        ),
      }))

      // Animate scoring progress
      const total = candidates.length
      for (let i = 0; i < total; i++) {
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 400))
        set((s) => ({
          jds: s.jds.map((j) =>
            j.id === id
              ? {
                  ...j,
                  scoredCount: i + 1,
                  scoringProgress: Math.round(((i + 1) / total) * 100),
                }
              : j,
          ),
        }))
      }

      // Step 4: Done
      set((s) => ({
        jds: s.jds.map((j) =>
          j.id === id ? { ...j, status: "done" as const } : j,
        ),
      }))

      return id
    } catch (error) {
      console.error("Sourcing failed:", error)
      set((s) => ({
        jds: s.jds.map((j) =>
          j.id === id ? { ...j, status: "error" as const } : j,
        ),
      }))
      return id
    }
  },
}))
