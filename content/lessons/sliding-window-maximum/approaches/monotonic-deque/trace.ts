import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"

const slidingWindowMaximumInputSchema = z
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

export type SlidingWindowMaximumInput = z.infer<
  typeof slidingWindowMaximumInputSchema
>

type SlidingWindowMaximumSnapshot = {
  nums: number[]
  k: number
  deque: number[]
  result: number[]
  index?: number
  currentValue?: number
  windowStart?: number
}

function snapshot(
  input: SlidingWindowMaximumInput,
  values: Omit<SlidingWindowMaximumSnapshot, "nums" | "k">
): SlidingWindowMaximumSnapshot {
  return {
    nums: input.nums,
    k: input.k,
    ...values,
  }
}

export function parseSlidingWindowMaximumInput(
  raw: string
): SlidingWindowMaximumInput {
  let parsed: ParsedInput

  try {
    parsed = JSON.parse(raw) as ParsedInput
  } catch (error) {
    throw new Error(
      `Sliding window maximum input must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    )
  }

  return slidingWindowMaximumInputSchema.parse(parsed)
}

export function traceMonotonicDequeSlidingWindowMaximum(
  input: SlidingWindowMaximumInput
): TraceEvent[] {
  const events: TraceEvent[] = []
  let eventCounter = 0
  let index = 0
  const deque: number[] = []
  const result: number[] = []

  const capture = (values: {
    index?: number
    currentValue?: number
    windowStart?: number
  }) =>
    snapshot(input, {
      deque: [...deque],
      result: [...result],
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

  push({
    type: "mutate",
    codeLine: "L1",
    scopeId: "main",
    payload: { variable: "deque", next: [] },
    snapshot: capture({}),
  })

  push({
    type: "mutate",
    codeLine: "L2",
    scopeId: "main",
    payload: { variable: "result", next: [] },
    snapshot: capture({}),
  })

  while (index < input.nums.length) {
    const currentValue = input.nums[index]
    const windowStart = Math.max(0, index - input.k + 1)

    push({
      type: "compare",
      codeLine: "L3",
      scopeId: "main",
      payload: { expression: "index < nums.length", result: true, index },
      snapshot: capture({ index, currentValue, windowStart }),
    })

    push({
      type: "pointer-update",
      codeLine: "L4",
      scopeId: "main",
      payload: { index, currentValue },
      snapshot: capture({ index, currentValue, windowStart }),
    })

    while (true) {
      const frontIndex = deque[0]
      const isStale =
        frontIndex !== undefined ? frontIndex <= index - input.k : false

      push({
        type: "compare",
        codeLine: "L5",
        scopeId: "main",
        payload: {
          hasFront: frontIndex !== undefined,
          frontIndex: frontIndex ?? null,
          frontValue: frontIndex !== undefined ? input.nums[frontIndex] : null,
          result: isStale,
          windowFloor: index - input.k,
        },
        snapshot: capture({ index, currentValue, windowStart }),
      })

      if (!isStale || frontIndex === undefined) {
        break
      }

      const poppedIndex = deque.shift()
      push({
        type: "mutate",
        codeLine: "L6",
        scopeId: "main",
        payload: {
          operation: "shift",
          poppedIndex: poppedIndex ?? null,
          poppedValue:
            poppedIndex !== undefined ? input.nums[poppedIndex] : null,
        },
        snapshot: capture({ index, currentValue, windowStart }),
      })
    }

    while (deque.length > 0) {
      const backIndex = deque.at(-1)
      const backValue =
        backIndex !== undefined ? input.nums[backIndex] : undefined
      const isDominated =
        backValue !== undefined ? backValue <= currentValue : false

      push({
        type: "compare",
        codeLine: "L8",
        scopeId: "main",
        payload: {
          hasBack: true,
          backIndex: backIndex ?? null,
          backValue: backValue ?? null,
          currentValue,
          result: isDominated,
        },
        snapshot: capture({ index, currentValue, windowStart }),
      })

      if (!isDominated || backIndex === undefined) {
        break
      }

      const poppedIndex = deque.pop()
      push({
        type: "mutate",
        codeLine: "L9",
        scopeId: "main",
        payload: {
          operation: "pop",
          poppedIndex: poppedIndex ?? null,
          poppedValue:
            poppedIndex !== undefined ? input.nums[poppedIndex] : null,
        },
        snapshot: capture({ index, currentValue, windowStart }),
      })
    }

    deque.push(index)
    push({
      type: "mutate",
      codeLine: "L11",
      scopeId: "main",
      payload: { operation: "push", pushedIndex: index, currentValue },
      snapshot: capture({ index, currentValue, windowStart }),
    })

    const windowReady = index >= input.k - 1
    push({
      type: "compare",
      codeLine: "L12",
      scopeId: "main",
      payload: { expression: "index >= k - 1", result: windowReady, index },
      snapshot: capture({ index, currentValue, windowStart }),
    })

    if (windowReady) {
      const maxIndex = deque[0]
      if (maxIndex === undefined) {
        throw new Error("Sliding window maximum lost its deque front.")
      }

      const maxValue = input.nums[maxIndex]
      result.push(maxValue)
      push({
        type: "result",
        codeLine: "L13",
        scopeId: "main",
        payload: {
          maxIndex,
          maxValue,
          resultLength: result.length,
        },
        snapshot: capture({ index, currentValue, windowStart }),
      })
    }

    index += 1
  }

  push({
    type: "compare",
    codeLine: "L3",
    scopeId: "main",
    payload: { expression: "index < nums.length", result: false, index },
    snapshot: capture({}),
  })

  push({
    type: "result",
    codeLine: "L16",
    scopeId: "main",
    payload: { result: [...result] },
    snapshot: capture({}),
  })

  push({
    type: "complete",
    codeLine: "L16",
    scopeId: "main",
    payload: { result: [...result] },
    snapshot: capture({}),
  })

  return events
}
