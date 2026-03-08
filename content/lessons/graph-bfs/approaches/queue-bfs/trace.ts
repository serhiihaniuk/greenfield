import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"

const graphNodeSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
})

const graphEdgeSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
})

const graphBfsInputSchema = z.object({
  nodes: z.array(graphNodeSchema).min(1),
  edges: z.array(graphEdgeSchema),
  startId: z.string().min(1),
  targetId: z.string().min(1),
})

export type GraphBfsInput = z.infer<typeof graphBfsInputSchema>

type GraphSnapshotNode = {
  id: string
  x: number
  y: number
}

type GraphSnapshotEdge = {
  id: string
  sourceId: string
  targetId: string
}

type GraphBfsSnapshot = {
  nodes: GraphSnapshotNode[]
  edges: GraphSnapshotEdge[]
  startId: string
  targetId: string
  queue: string[]
  visited: string[]
  order: string[]
  currentId?: string
  inspectingNeighborId?: string
  answer?: string | null
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefined(entry)) as T
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefined(entryValue)])
    ) as T
  }

  return value
}

function createEdgeId(sourceId: string, targetId: string) {
  return `${sourceId}-${targetId}`
}

export function parseGraphBfsInput(raw: string): GraphBfsInput {
  let parsed: ParsedInput

  try {
    parsed = JSON.parse(raw) as ParsedInput
  } catch (error) {
    throw new Error(
      `Graph BFS input must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    )
  }

  const input = graphBfsInputSchema.parse(parsed)
  const nodeIds = new Set(input.nodes.map((node) => node.id))

  if (!nodeIds.has(input.startId)) {
    throw new Error(`Start node "${input.startId}" is not defined in nodes.`)
  }

  if (!nodeIds.has(input.targetId)) {
    throw new Error(`Target node "${input.targetId}" is not defined in nodes.`)
  }

  for (const edge of input.edges) {
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) {
      throw new Error(
        `Edge "${edge.sourceId} -> ${edge.targetId}" references an unknown node.`
      )
    }
  }

  return input
}

export function traceQueueBfs(input: GraphBfsInput): TraceEvent[] {
  const adjacency = new Map<string, string[]>()
  for (const node of input.nodes) {
    adjacency.set(node.id, [])
  }

  const snapshotEdges = input.edges.map((edge) => ({
    id: createEdgeId(edge.sourceId, edge.targetId),
    sourceId: edge.sourceId,
    targetId: edge.targetId,
  }))

  for (const edge of input.edges) {
    adjacency.get(edge.sourceId)?.push(edge.targetId)
    adjacency.get(edge.targetId)?.push(edge.sourceId)
  }

  const queue = [input.startId]
  const visited = new Set<string>()
  const order: string[] = []
  const events: TraceEvent[] = []
  let answer: string | null | undefined
  let eventCounter = 0

  const snapshot = (
    overrides: Partial<
      Omit<GraphBfsSnapshot, "nodes" | "edges" | "startId" | "targetId">
    > = {}
  ): GraphBfsSnapshot =>
    stripUndefined({
      nodes: input.nodes.map((node) => ({ ...node })),
      edges: snapshotEdges,
      startId: input.startId,
      targetId: input.targetId,
      queue: [...queue],
      visited: [...visited],
      order: [...order],
      currentId: overrides.currentId,
      inspectingNeighborId: overrides.inspectingNeighborId,
      answer: overrides.answer ?? answer,
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
    codeLine: "L1",
    scopeId: "main",
    payload: {
      queue: [...queue],
      enqueued: input.startId,
    },
    snapshot: snapshot(),
  })

  visited.add(input.startId)
  push({
    type: "mutate",
    codeLine: "L2",
    scopeId: "main",
    payload: {
      visited: [...visited],
      added: input.startId,
    },
    snapshot: snapshot(),
  })

  while (queue.length > 0) {
    push({
      type: "compare",
      codeLine: "L3",
      scopeId: "main",
      payload: {
        hasFrontier: true,
        frontId: queue[0],
        queueSize: queue.length,
      },
      snapshot: snapshot(),
    })

    const currentId = queue.shift()
    if (!currentId) {
      throw new Error("Queue unexpectedly emptied during dequeue.")
    }

    order.push(currentId)
    push({
      type: "mutate",
      codeLine: "L4",
      scopeId: "main",
      payload: {
        currentId,
        queue: [...queue],
        order: [...order],
      },
      snapshot: snapshot({ currentId }),
    })

    const found = currentId === input.targetId
    push({
      type: "compare",
      codeLine: "L5",
      scopeId: "main",
      payload: {
        currentId,
        targetId: input.targetId,
        found,
      },
      snapshot: snapshot({ currentId }),
    })

    if (found) {
      answer = currentId
      push({
        type: "result",
        codeLine: "L5",
        scopeId: "main",
        payload: {
          answer,
        },
        snapshot: snapshot({ currentId, answer }),
      })

      push({
        type: "complete",
        codeLine: "L5",
        scopeId: "main",
        payload: {
          answer,
        },
        snapshot: snapshot({ currentId, answer }),
      })

      return events
    }

    const neighbors = adjacency.get(currentId) ?? []
    for (const neighborId of neighbors) {
      const alreadyVisited = visited.has(neighborId)
      push({
        type: "compare",
        codeLine: "L7",
        scopeId: "main",
        payload: {
          currentId,
          neighborId,
          alreadyVisited,
        },
        snapshot: snapshot({ currentId, inspectingNeighborId: neighborId }),
      })

      if (alreadyVisited) {
        continue
      }

      visited.add(neighborId)
      push({
        type: "mutate",
        codeLine: "L8",
        scopeId: "main",
        payload: {
          currentId,
          neighborId,
          visited: [...visited],
        },
        snapshot: snapshot({ currentId, inspectingNeighborId: neighborId }),
      })

      queue.push(neighborId)
      push({
        type: "mutate",
        codeLine: "L9",
        scopeId: "main",
        payload: {
          currentId,
          neighborId,
          queue: [...queue],
        },
        snapshot: snapshot({ currentId, inspectingNeighborId: neighborId }),
      })
    }
  }

  answer = null
  push({
    type: "compare",
    codeLine: "L3",
    scopeId: "main",
    payload: {
      hasFrontier: false,
      queueSize: 0,
    },
    snapshot: snapshot({ answer }),
  })

  push({
    type: "result",
    codeLine: "L12",
    scopeId: "main",
    payload: {
      answer,
    },
    snapshot: snapshot({ answer }),
  })

  push({
    type: "complete",
    codeLine: "L12",
    scopeId: "main",
    payload: {
      answer,
    },
    snapshot: snapshot({ answer }),
  })

  return events
}
