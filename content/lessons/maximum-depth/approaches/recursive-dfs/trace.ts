import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"

const maximumDepthInputSchema = z.object({
  values: z.array(z.number().int().nullable()).min(1),
})

export type MaximumDepthInput = z.infer<typeof maximumDepthInputSchema>

type TraversalSide = "root" | "left" | "right"

type TreeNodeSnapshot = {
  id: string
  value: number
  index: number
  depth: number
  parentId?: string
  leftId?: string
  rightId?: string
}

type CallSnapshotStatus = "current" | "waiting" | "solved" | "base"

type CallSnapshot = {
  callId: string
  parentCallId?: string
  nodeId: string | null
  nodeValue: number | null
  side: TraversalSide
  leftDepth?: number
  rightDepth?: number
  returnValue?: number
  status: CallSnapshotStatus
}

type MaximumDepthSnapshot = {
  rootId: string
  nodes: TreeNodeSnapshot[]
  calls: CallSnapshot[]
  stack: string[]
  activeCallId?: string
  activeNodeId?: string
  answer?: number
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

function buildTreeModel(input: MaximumDepthInput): TreeModel {
  const rootValue = input.values[0]
  if (rootValue === null) {
    throw new Error("Maximum depth input requires a non-null root node.")
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
    throw new Error("Maximum depth input could not construct a root node.")
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

export function parseMaximumDepthInput(raw: string): MaximumDepthInput {
  let parsed: ParsedInput

  try {
    parsed = JSON.parse(raw) as ParsedInput
  } catch (error) {
    throw new Error(
      `Maximum depth input must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    )
  }

  return maximumDepthInputSchema.parse(parsed)
}

export function traceRecursiveMaximumDepth(
  input: MaximumDepthInput
): TraceEvent[] {
  const tree = buildTreeModel(input)
  const calls: CallSnapshot[] = []
  const stack: string[] = []
  const events: TraceEvent[] = []
  let answer: number | undefined
  let callCounter = 0
  let eventCounter = 0

  const getCall = (callId: string) => {
    const call = calls.find((entry) => entry.callId === callId)
    if (!call) {
      throw new Error(`Missing call snapshot for ${callId}.`)
    }

    return call
  }

  const capture = (activeCallId?: string): MaximumDepthSnapshot => {
    const activeCall = activeCallId
      ? calls.find((entry) => entry.callId === activeCallId)
      : undefined

    return stripUndefined({
      rootId: tree.rootId,
      nodes: tree.nodes.map((node) => ({ ...node })),
      calls: calls.map((call) => ({ ...call })),
      stack: [...stack],
      activeCallId,
      activeNodeId: activeCall?.nodeId ?? undefined,
      answer,
    })
  }

  const push = (event: Omit<TraceEvent, "id">) => {
    eventCounter += 1
    events.push(
      defineTraceEvent({
        id: `event-${eventCounter}`,
        ...event,
      })
    )
  }

  const setCallStatus = (
    callId: string | undefined,
    status: CallSnapshotStatus
  ) => {
    if (!callId) {
      return
    }

    getCall(callId).status = status
  }

  const dfs = (
    nodeId: string | null,
    parentCallId: string | undefined,
    codeLine: string,
    side: TraversalSide
  ): number => {
    setCallStatus(parentCallId, "waiting")

    callCounter += 1
    const callId = `call-${callCounter}`
    const node = nodeId ? tree.nodeById.get(nodeId) : undefined
    calls.push({
      callId,
      parentCallId,
      nodeId,
      nodeValue: node?.value ?? null,
      side,
      status: "current",
    })
    stack.push(callId)

    push({
      type: "call",
      codeLine,
      scopeId: callId,
      payload: {
        callId,
        parentCallId: parentCallId ?? null,
        nodeId,
        nodeValue: node?.value ?? null,
        side,
      },
      snapshot: capture(callId),
    })

    if (nodeId === null) {
      const currentCall = getCall(callId)
      currentCall.returnValue = 0
      currentCall.status = "base"

      push({
        type: "base-case",
        codeLine: "L5",
        scopeId: callId,
        payload: {
          callId,
          parentCallId: parentCallId ?? null,
          side,
          returnValue: 0,
        },
        snapshot: capture(callId),
      })

      stack.pop()
      setCallStatus(parentCallId, "current")

      push({
        type: "return",
        codeLine: "L5",
        scopeId: callId,
        payload: {
          callId,
          parentCallId: parentCallId ?? null,
          side,
          returnValue: 0,
        },
        snapshot: capture(parentCallId),
      })

      return 0
    }

    if (!node) {
      throw new Error(`Missing tree node for id "${nodeId}".`)
    }

    push({
      type: "compare",
      codeLine: "L5",
      scopeId: callId,
      payload: {
        callId,
        nodeId,
        nodeValue: node.value,
        isNull: false,
      },
      snapshot: capture(callId),
    })

    const leftDepth = dfs(node.leftId ?? null, callId, "L6", "left")
    const currentCall = getCall(callId)
    currentCall.leftDepth = leftDepth
    currentCall.status = "current"

    push({
      type: "mutate",
      codeLine: "L6",
      scopeId: callId,
      payload: {
        callId,
        nodeId,
        leftDepth,
      },
      snapshot: capture(callId),
    })

    const rightDepth = dfs(node.rightId ?? null, callId, "L7", "right")
    currentCall.rightDepth = rightDepth
    currentCall.status = "current"

    push({
      type: "mutate",
      codeLine: "L7",
      scopeId: callId,
      payload: {
        callId,
        nodeId,
        rightDepth,
      },
      snapshot: capture(callId),
    })

    const returnValue = 1 + Math.max(leftDepth, rightDepth)
    currentCall.returnValue = returnValue

    push({
      type: "result",
      codeLine: "L8",
      scopeId: callId,
      payload: {
        callId,
        nodeId,
        leftDepth,
        rightDepth,
        returnValue,
      },
      snapshot: capture(callId),
    })

    currentCall.status = "solved"
    stack.pop()
    setCallStatus(parentCallId, "current")

    push({
      type: "return",
      codeLine: "L8",
      scopeId: callId,
      payload: {
        callId,
        parentCallId: parentCallId ?? null,
        nodeId,
        returnValue,
      },
      snapshot: capture(parentCallId),
    })

    return returnValue
  }

  answer = dfs(tree.rootId, undefined, "L2", "root")

  push({
    type: "result",
    codeLine: "L2",
    scopeId: "main",
    payload: {
      answer,
    },
    snapshot: capture(),
  })

  push({
    type: "complete",
    codeLine: "L2",
    scopeId: "main",
    payload: {
      answer,
    },
    snapshot: capture(),
  })

  return events
}
