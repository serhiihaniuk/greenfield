import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"

const heapTopKInputSchema = z
  .object({
    nums: z.array(z.number().finite()).min(1),
    k: z.number().int().positive(),
  })
  .superRefine((value, ctx) => {
    if (value.k > value.nums.length) {
      ctx.addIssue({
        code: "custom",
        message: "`k` must be less than or equal to nums.length.",
        path: ["k"],
      })
    }
  })

export type HeapTopKInput = z.infer<typeof heapTopKInputSchema>

type HeapTopKSnapshot = {
  nums: number[]
  k: number
  heap: number[]
  currentIndex?: number
  currentValue?: number
  result?: number[]
}

function snapshot(
  input: HeapTopKInput,
  values: Omit<HeapTopKSnapshot, "nums" | "k">
): HeapTopKSnapshot {
  return {
    nums: input.nums,
    k: input.k,
    ...values,
  }
}

export function parseHeapTopKInput(raw: string): HeapTopKInput {
  let parsed: ParsedInput

  try {
    parsed = JSON.parse(raw) as ParsedInput
  } catch (error) {
    throw new Error(
      `Heap top-k input must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    )
  }

  return heapTopKInputSchema.parse(parsed)
}

export function traceMinHeapTopK(input: HeapTopKInput): TraceEvent[] {
  const events: TraceEvent[] = []
  const heap: number[] = []
  let eventCounter = 0

  const capture = (values: {
    currentIndex?: number
    currentValue?: number
    result?: number[]
  }) =>
    snapshot(input, {
      heap: [...heap],
      ...values,
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

  const siftUp = (currentIndex: number, currentValue: number) => {
    let childIndex = heap.length - 1

    while (childIndex > 0) {
      const parentIndex = Math.floor((childIndex - 1) / 2)
      const childValue = heap[childIndex]
      const parentValue = heap[parentIndex]
      const shouldSwap = childValue < parentValue

      push({
        type: "compare",
        codeLine: "L5",
        scopeId: "main",
        payload: {
          childIndex,
          childValue,
          parentIndex,
          parentValue,
          shouldSwap,
        },
        snapshot: capture({ currentIndex, currentValue }),
      })

      if (!shouldSwap) {
        return
      }

      ;[heap[parentIndex], heap[childIndex]] = [heap[childIndex], heap[parentIndex]]
      push({
        type: "mutate",
        codeLine: "L5",
        scopeId: "main",
        payload: {
          parentIndex,
          childIndex,
          nextParentValue: heap[parentIndex],
          nextChildValue: heap[childIndex],
        },
        snapshot: capture({ currentIndex, currentValue }),
      })

      childIndex = parentIndex
    }
  }

  const siftDown = (currentIndex: number, currentValue: number) => {
    let parentIndex = 0

    while (true) {
      const leftChildIndex = parentIndex * 2 + 1
      const rightChildIndex = parentIndex * 2 + 2

      if (leftChildIndex >= heap.length) {
        return
      }

      const leftChildValue = heap[leftChildIndex]
      const rightChildValue =
        rightChildIndex < heap.length ? heap[rightChildIndex] : null
      const chosenChildIndex =
        rightChildValue !== null && rightChildValue < leftChildValue
          ? rightChildIndex
          : leftChildIndex
      const chosenChildValue = heap[chosenChildIndex]
      const parentValue = heap[parentIndex]
      const shouldSwap = chosenChildValue < parentValue

      push({
        type: "compare",
        codeLine: "L8",
        scopeId: "main",
        payload: {
          parentIndex,
          parentValue,
          leftChildIndex,
          leftChildValue,
          rightChildIndex: rightChildValue === null ? null : rightChildIndex,
          rightChildValue,
          chosenChildIndex,
          chosenChildValue,
          shouldSwap,
        },
        snapshot: capture({ currentIndex, currentValue }),
      })

      if (!shouldSwap) {
        return
      }

      ;[heap[parentIndex], heap[chosenChildIndex]] = [
        heap[chosenChildIndex],
        heap[parentIndex],
      ]
      push({
        type: "mutate",
        codeLine: "L8",
        scopeId: "main",
        payload: {
          parentIndex,
          childIndex: chosenChildIndex,
          nextParentValue: heap[parentIndex],
          nextChildValue: heap[chosenChildIndex],
        },
        snapshot: capture({ currentIndex, currentValue }),
      })

      parentIndex = chosenChildIndex
    }
  }

  push({
    type: "mutate",
    codeLine: "L1",
    scopeId: "main",
    payload: {
      variable: "heap",
      next: [],
    },
    snapshot: capture({}),
  })

  for (let currentIndex = 0; currentIndex < input.nums.length; currentIndex += 1) {
    const currentValue = input.nums[currentIndex]

    push({
      type: "pointer-update",
      codeLine: "L2",
      scopeId: "main",
      payload: {
        currentIndex,
        currentValue,
      },
      snapshot: capture({ currentIndex, currentValue }),
    })

    const hasRoom = heap.length < input.k
    push({
      type: "compare",
      codeLine: "L3",
      scopeId: "main",
      payload: {
        heapSize: heap.length,
        k: input.k,
        hasRoom,
      },
      snapshot: capture({ currentIndex, currentValue }),
    })

    if (hasRoom) {
      heap.push(currentValue)
      push({
        type: "mutate",
        codeLine: "L4",
        scopeId: "main",
        payload: {
          pushedIndex: heap.length - 1,
          pushedValue: currentValue,
          heapSize: heap.length,
        },
        snapshot: capture({ currentIndex, currentValue }),
      })

      siftUp(currentIndex, currentValue)
      continue
    }

    const rootValue = heap[0]
    const shouldReplace = currentValue > rootValue
    push({
      type: "compare",
      codeLine: "L6",
      scopeId: "main",
      payload: {
        currentValue,
        rootValue,
        shouldReplace,
      },
      snapshot: capture({ currentIndex, currentValue }),
    })

    if (!shouldReplace) {
      continue
    }

    const replacedValue = heap[0]
    heap[0] = currentValue
    push({
      type: "mutate",
      codeLine: "L7",
      scopeId: "main",
      payload: {
        replacedValue,
        nextValue: currentValue,
        rootIndex: 0,
      },
      snapshot: capture({ currentIndex, currentValue }),
    })

    siftDown(currentIndex, currentValue)
  }

  const result = [...heap].sort((left, right) => right - left)
  push({
    type: "result",
    codeLine: "L11",
    scopeId: "main",
    payload: {
      result,
    },
    snapshot: capture({ result }),
  })

  push({
    type: "complete",
    codeLine: "L11",
    scopeId: "main",
    payload: {
      result,
    },
    snapshot: capture({ result }),
  })

  return events
}
