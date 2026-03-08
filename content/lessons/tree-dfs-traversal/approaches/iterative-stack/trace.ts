import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"
import {
  buildBinaryTreeArrayModel,
  type BinaryTreeArrayModel,
  type BinaryTreeArrayNode,
} from "@/shared/lib/binary-tree-array"

const treeDfsTraversalInputSchema = z.object({
  values: z.array(z.number().int().nullable()).min(1),
})

export type TreeDfsTraversalInput = z.infer<typeof treeDfsTraversalInputSchema>

type TreeNodeSnapshot = BinaryTreeArrayNode

type TreeDfsTraversalSnapshot = {
  rootId: string
  nodes: TreeNodeSnapshot[]
  stack: string[]
  order: number[]
  visitNodeIds: string[]
  currentNodeId?: string
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

export function parseTreeDfsTraversalInput(raw: string): TreeDfsTraversalInput {
  let parsed: ParsedInput

  try {
    parsed = JSON.parse(raw) as ParsedInput
  } catch (error) {
    throw new Error(
      `Tree DFS traversal input must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    )
  }

  return treeDfsTraversalInputSchema.parse(parsed)
}

export function traceIterativeStackTreeDfs(
  input: TreeDfsTraversalInput
): TraceEvent[] {
  const tree: BinaryTreeArrayModel = buildBinaryTreeArrayModel(
    input.values,
    "Tree DFS traversal input"
  )
  const stack = [tree.rootId]
  const order: number[] = []
  const visitNodeIds: string[] = []
  const events: TraceEvent[] = []
  let eventCounter = 0
  let currentNodeId: string | undefined

  const getNode = (nodeId: string) => {
    const node = tree.nodeById.get(nodeId)
    if (!node) {
      throw new Error(`Missing tree node for id "${nodeId}".`)
    }

    return node
  }

  const capture = (): TreeDfsTraversalSnapshot =>
    stripUndefined({
      rootId: tree.rootId,
      nodes: tree.nodes.map((node) => ({ ...node })),
      stack: [...stack],
      order: [...order],
      visitNodeIds: [...visitNodeIds],
      currentNodeId,
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
      stack: [...stack],
      pushedNodeId: tree.rootId,
    },
    snapshot: capture(),
  })

  push({
    type: "mutate",
    codeLine: "L2",
    scopeId: "main",
    payload: {
      order: [...order],
    },
    snapshot: capture(),
  })

  while (stack.length > 0) {
    const nextNodeId = stack.at(-1)
    if (!nextNodeId) {
      throw new Error("DFS stack unexpectedly lost its top node.")
    }

    push({
      type: "compare",
      codeLine: "L3",
      scopeId: "main",
      payload: {
        hasWork: true,
        nextNodeId,
        stackSize: stack.length,
      },
      snapshot: capture(),
    })

    currentNodeId = stack.pop()
    if (!currentNodeId) {
      throw new Error("DFS stack pop unexpectedly returned nothing.")
    }

    const currentNode = getNode(currentNodeId)
    push({
      type: "mutate",
      codeLine: "L4",
      scopeId: "main",
      payload: {
        currentNodeId,
        currentValue: currentNode.value,
        stack: [...stack],
      },
      snapshot: capture(),
    })

    order.push(currentNode.value)
    visitNodeIds.push(currentNode.id)
    push({
      type: "result",
      codeLine: "L5",
      scopeId: "main",
      payload: {
        currentNodeId,
        currentValue: currentNode.value,
        order: [...order],
      },
      snapshot: capture(),
    })

    if (currentNode.rightId) {
      const rightNode = getNode(currentNode.rightId)
      stack.push(currentNode.rightId)
      push({
        type: "mutate",
        codeLine: "L6",
        scopeId: "main",
        payload: {
          currentNodeId,
          pushedNodeId: currentNode.rightId,
          pushedValue: rightNode.value,
          side: "right",
          stack: [...stack],
        },
        snapshot: capture(),
      })
    }

    if (currentNode.leftId) {
      const leftNode = getNode(currentNode.leftId)
      stack.push(currentNode.leftId)
      push({
        type: "mutate",
        codeLine: "L7",
        scopeId: "main",
        payload: {
          currentNodeId,
          pushedNodeId: currentNode.leftId,
          pushedValue: leftNode.value,
          side: "left",
          stack: [...stack],
        },
        snapshot: capture(),
      })
    }
  }

  currentNodeId = undefined
  push({
    type: "result",
    codeLine: "L9",
    scopeId: "main",
    payload: {
      order: [...order],
    },
    snapshot: capture(),
  })

  push({
    type: "complete",
    codeLine: "L9",
    scopeId: "main",
    payload: {
      order: [...order],
    },
    snapshot: capture(),
  })

  return events
}
