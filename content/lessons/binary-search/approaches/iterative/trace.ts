import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"

const binarySearchInputSchema = z.object({
  nums: z.array(z.number().finite()).min(1),
  target: z.number().finite(),
})

export type BinarySearchInput = z.infer<typeof binarySearchInputSchema>

export function parseBinarySearchInput(raw: string): BinarySearchInput {
  let parsed: ParsedInput

  try {
    parsed = JSON.parse(raw) as ParsedInput
  } catch (error) {
    throw new Error(
      `Binary search input must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    )
  }

  return binarySearchInputSchema.parse(parsed)
}

function snapshot(
  input: BinarySearchInput,
  values: Partial<{
    lo: number
    hi: number
    mid: number
    value: number
    answer: number
  }>
) {
  return {
    nums: input.nums,
    target: input.target,
    ...values,
  }
}

export function traceIterativeBinarySearch(
  input: BinarySearchInput
): TraceEvent[] {
  const events: TraceEvent[] = []
  let step = 0
  let lo = 0
  let hi: number | undefined
  let answer: number | undefined

  const push = (event: Omit<TraceEvent, "id">) => {
    step += 1
    events.push(
      defineTraceEvent({
        id: `event-${step}`,
        ...event,
      })
    )
  }

  push({
    type: "mutate",
    codeLine: "L1",
    scopeId: "main",
    payload: { variable: "lo", next: lo },
    snapshot: snapshot(input, { lo }),
  })

  hi = input.nums.length - 1
  push({
    type: "mutate",
    codeLine: "L2",
    scopeId: "main",
    payload: { variable: "hi", next: hi },
    snapshot: snapshot(input, { lo, hi }),
  })

  while (lo <= hi) {
    push({
      type: "compare",
      codeLine: "L3",
      scopeId: "main",
      payload: { expression: "lo <= hi", result: true, lo, hi },
      snapshot: snapshot(input, { lo, hi }),
    })

    const mid = Math.floor((lo + hi) / 2)
    push({
      type: "pointer-update",
      codeLine: "L4",
      scopeId: "main",
      payload: { variable: "mid", next: mid, lo, hi },
      snapshot: snapshot(input, { lo, hi, mid }),
    })

    const value = input.nums[mid]
    push({
      type: "compare",
      codeLine: "L6",
      scopeId: "main",
      payload: { expression: "value === target", value, target: input.target },
      snapshot: snapshot(input, { lo, hi, mid, value }),
    })

    if (value === input.target) {
      answer = mid
      push({
        type: "result",
        codeLine: "L7",
        scopeId: "main",
        payload: { answer },
        snapshot: snapshot(input, { lo, hi, mid, value, answer }),
      })

      push({
        type: "complete",
        codeLine: "L7",
        scopeId: "main",
        payload: { answer, found: true },
        snapshot: snapshot(input, { lo, hi, mid, value, answer }),
      })

      return events
    }

    push({
      type: "compare",
      codeLine: "L9",
      scopeId: "main",
      payload: { expression: "value < target", value, target: input.target },
      snapshot: snapshot(input, { lo, hi, mid, value }),
    })

    if (value < input.target) {
      lo = mid + 1
      push({
        type: "pointer-update",
        codeLine: "L10",
        scopeId: "main",
        payload: { variable: "lo", next: lo },
        snapshot: snapshot(input, { lo, hi, mid, value }),
      })
      continue
    }

    hi = mid - 1
    push({
      type: "pointer-update",
      codeLine: "L12",
      scopeId: "main",
      payload: { variable: "hi", next: hi },
      snapshot: snapshot(input, { lo, hi, mid, value }),
    })
  }

  push({
    type: "compare",
    codeLine: "L3",
    scopeId: "main",
    payload: { expression: "lo <= hi", result: false, lo, hi },
    snapshot: snapshot(input, { lo, hi }),
  })

  answer = -1
  push({
    type: "result",
    codeLine: "L15",
    scopeId: "main",
    payload: { answer },
    snapshot: snapshot(input, { lo, hi, answer }),
  })

  push({
    type: "complete",
    codeLine: "L15",
    scopeId: "main",
    payload: { answer, found: false },
    snapshot: snapshot(input, { lo, hi, answer }),
  })

  return events
}
