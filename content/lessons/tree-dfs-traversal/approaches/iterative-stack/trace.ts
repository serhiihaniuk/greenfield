import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"

const treeDfsTraversalInputSchema = z.object({
  values: z.array(z.number().int().nullable()).min(1),
})

export type TreeDfsTraversalInput = z.infer<typeof treeDfsTraversalInputSchema>

type TreeNodeSnapshot = {
  id: string
  value: number
  index: number
  depth: number
  parentId?: string
  leftId?: string
  rightId?: string
}

type TreeDfsTraversalSnapshot = {
  rootId: string
  nodes: TreeNodeSnapshot[]
  stack: string[]
  order: number[]
  visitNodeIds: string[]
  currentNodeId?: string
}

type TreeModel = {
  rootId: string
  nodes: TreeNodeSnapshot[]
  nodeById: Map<string, TreeNodeSnapshot>
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

function buildTreeModel(input: TreeDfsTraversalInput): TreeModel {
  const rootValue = input.values[0]
  if (rootValue === null) {
    throw new Error("Tree DFS traversal input requires a non-null root node.")
  }

  const nodes = new Map<number, TreeNodeSnapshot>()

  input.values.forEach((value, index) => {
    if (value === null) {
      return
    }

    nodes.set(index, {
      id: `node-${index}`,
      value,
      index,
      depth: 0,
    })
  })

  const root = nodes.get(0)
  if (!root) {
    throw new Error("Tree DFS traversal input could not construct a root node.")
  }

  const queue: Array<{ index: number; depth: number }> = [
    { index: 0, depth: 0 },
  ]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    const node = nodes.get(current.index)
    if (!node) {
      continue
    }

    node.depth = current.depth
    const leftIndex = current.index * 2 + 1
    const rightIndex = current.index * 2 + 2
    const leftNode = nodes.get(leftIndex)
    const rightNode = nodes.get(rightIndex)

    if (leftNode) {
      leftNode.parentId = node.id
      leftNode.depth = current.depth + 1
      node.leftId = leftNode.id
      queue.push({ index: leftIndex, depth: current.depth + 1 })
    } else if (
      input.values[leftIndex] !== undefined &&
      input.values[leftIndex] !== null
    ) {
      throw new Error(
        `Node at index ${leftIndex} is disconnected from a null parent.`
      )
    }

    if (rightNode) {
      rightNode.parentId = node.id
      rightNode.depth = current.depth + 1
      node.rightId = rightNode.id
      queue.push({ index: rightIndex, depth: current.depth + 1 })
    } else if (
      input.values[rightIndex] !== undefined &&
      input.values[rightIndex] !== null
    ) {
      throw new Error(
        `Node at index ${rightIndex} is disconnected from a null parent.`
      )
    }
  }

  const orderedNodes = [...nodes.values()].sort(
    (left, right) => left.index - right.index
  )

  return {
    rootId: root.id,
    nodes: orderedNodes,
    nodeById: new Map(orderedNodes.map((node) => [node.id, node])),
  }
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
  const tree = buildTreeModel(input)
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
