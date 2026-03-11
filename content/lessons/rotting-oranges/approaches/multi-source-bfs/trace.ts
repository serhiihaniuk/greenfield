import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"
import type { SerializableRecord } from "@/shared/lib/serializable"

const orangeCellSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
])

const rottingOrangesInputSchema = z.object({
  grid: z.array(z.array(orangeCellSchema).min(1)).min(1),
})

export type RottingOrangesInput = z.infer<typeof rottingOrangesInputSchema>

type QueueEntry = {
  cellId: string
  row: number
  col: number
  minute: number
}

type RottingSnapshot = {
  grid: number[][]
  queue: QueueEntry[]
  fresh: number
  minutes: number
  answer: number
  currentCellId?: string
  neighborCellId?: string
  initialSourceIds: string[]
}

type NeighborCheck = {
  row: number
  col: number
  cellId?: string
  inBounds: boolean
  isFresh: boolean
  value?: number
  reason: "out-of-bounds" | "empty" | "already-rotten" | "fresh"
}

const directions = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefined(entry)) as T
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)])
    ) as T
  }

  return value
}

function cellId(row: number, col: number) {
  return `r${row}-c${col}`
}

export function parseRottingOrangesInput(raw: string): RottingOrangesInput {
  let parsed: ParsedInput

  try {
    parsed = JSON.parse(raw) as ParsedInput
  } catch (error) {
    throw new Error(
      `Rotting Oranges input must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    )
  }

  const input = rottingOrangesInputSchema.parse(parsed)
  const width = input.grid[0]?.length ?? 0

  if (width === 0) {
    throw new Error("Grid rows may not be empty.")
  }

  for (const [rowIndex, row] of input.grid.entries()) {
    if (row.length !== width) {
      throw new Error(
        `Grid row ${rowIndex} has width ${row.length}, but the first row has width ${width}.`
      )
    }
  }

  return input
}

export function traceMultiSourceBfs(input: RottingOrangesInput): TraceEvent[] {
  const grid = input.grid.map((row) => [...row])
  const queue: QueueEntry[] = []
  const initialSourceIds: string[] = []
  const events: TraceEvent[] = []
  let fresh = 0
  let minutes = 0
  let answer = 0
  let eventCounter = 0

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row]!.length; col += 1) {
      const value = grid[row]![col]
      const id = cellId(row, col)

      if (value === 2) {
        queue.push({ cellId: id, row, col, minute: 0 })
        initialSourceIds.push(id)
      } else if (value === 1) {
        fresh += 1
      }
    }
  }

  const snapshot = (overrides: Partial<RottingSnapshot> = {}): RottingSnapshot =>
    stripUndefined({
      grid: grid.map((row) => [...row]),
      queue: queue.map((entry) => ({ ...entry })),
      fresh,
      minutes,
      answer,
      initialSourceIds: [...initialSourceIds],
      currentCellId: overrides.currentCellId,
      neighborCellId: overrides.neighborCellId,
    })

  const push = (event: Omit<TraceEvent, "id">) => {
    eventCounter += 1
    events.push(
      defineTraceEvent({
        id: `event-${eventCounter}`,
        ...event,
      })
    )
  }

  push({
    type: "mutate",
    codeLine: "L3",
    scopeId: "main",
    payload: {
      queue: queue.map((entry) => entry.cellId),
      fresh,
      initialSources: [...initialSourceIds],
    },
    snapshot: snapshot(),
  })

  push({
    type: "mutate",
    codeLine: "L4",
    scopeId: "main",
    payload: {
      minutes,
    },
    snapshot: snapshot(),
  })

  while (queue.length > 0) {
    push({
      type: "compare",
      codeLine: "L5",
      scopeId: "main",
      payload: {
        hasFrontier: true,
        queueSize: queue.length,
        frontCellId: queue[0]?.cellId,
      },
      snapshot: snapshot(),
    })

    const current = queue.shift()
    if (!current) {
      throw new Error("Frontier unexpectedly emptied during dequeue.")
    }

    push({
      type: "mutate",
      codeLine: "L6",
      scopeId: "main",
      payload: {
        currentCellId: current.cellId,
        minute: current.minute,
        queue: queue.map((entry) => entry.cellId),
      },
      snapshot: snapshot({ currentCellId: current.cellId }),
    })

    for (const [rowOffset, colOffset] of directions) {
      const nextRow = current.row + rowOffset
      const nextCol = current.col + colOffset
      const inBounds =
        nextRow >= 0 &&
        nextRow < grid.length &&
        nextCol >= 0 &&
        nextCol < grid[0]!.length

      const nextValue = inBounds ? grid[nextRow]![nextCol] : undefined
      const nextCellId = inBounds ? cellId(nextRow, nextCol) : undefined
      const isFresh = nextValue === 1
      const reason: NeighborCheck["reason"] = !inBounds
        ? "out-of-bounds"
        : nextValue === 0
          ? "empty"
          : nextValue === 2
            ? "already-rotten"
            : "fresh"

      push({
        type: "compare",
        codeLine: "L8",
        scopeId: "main",
        payload: stripUndefined({
          currentCellId: current.cellId,
          neighbor: {
            row: nextRow,
            col: nextCol,
            cellId: nextCellId,
            inBounds,
            isFresh,
            value: nextValue,
            reason,
          } satisfies NeighborCheck,
        }) as SerializableRecord,
        snapshot: snapshot({
          currentCellId: current.cellId,
          neighborCellId: nextCellId,
        }),
      })

      if (!isFresh || !nextCellId) {
        continue
      }

      grid[nextRow]![nextCol] = 2
      fresh -= 1
      const nextMinute = current.minute + 1
      minutes = Math.max(minutes, nextMinute)
      answer = minutes
      queue.push({
        cellId: nextCellId,
        row: nextRow,
        col: nextCol,
        minute: nextMinute,
      })

      push({
        type: "mutate",
        codeLine: "L10",
        scopeId: "main",
        payload: {
          currentCellId: current.cellId,
          neighborCellId: nextCellId,
          nextMinute,
          fresh,
          minutes,
          answer,
          queue: queue.map((entry) => ({
            cellId: entry.cellId,
            minute: entry.minute,
          })),
        },
        snapshot: snapshot({
          currentCellId: current.cellId,
          neighborCellId: nextCellId,
        }),
      })
    }
  }

  push({
    type: "compare",
    codeLine: "L5",
    scopeId: "main",
    payload: {
      hasFrontier: false,
      queueSize: 0,
    },
    snapshot: snapshot(),
  })

  push({
    type: "result",
    codeLine: "L13",
    scopeId: "main",
    payload: {
      fresh,
      answer: fresh === 0 ? answer : -1,
    },
    snapshot: snapshot(),
  })

  push({
    type: "complete",
    codeLine: "L13",
    scopeId: "main",
    payload: {
      fresh,
      answer: fresh === 0 ? answer : -1,
    },
    snapshot: snapshot(),
  })

  return events
}
