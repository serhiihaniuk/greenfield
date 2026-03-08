import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"

const houseRobberInputSchema = z.object({
  nums: z.array(z.number().int().nonnegative()).min(1),
})

export type HouseRobberInput = z.infer<typeof houseRobberInputSchema>

type HouseRobberSnapshot = {
  nums: number[]
  index?: number
  currentValue?: number
  prevTwo?: number
  prevOne?: number
  take?: number
  skip?: number
  best?: number
  decision?: "take" | "skip"
  answer?: number
}

function snapshot(
  input: HouseRobberInput,
  values: Omit<HouseRobberSnapshot, "nums">
): HouseRobberSnapshot {
  return {
    nums: input.nums,
    ...values,
  }
}

export function parseHouseRobberInput(raw: string): HouseRobberInput {
  let parsed: ParsedInput

  try {
    parsed = JSON.parse(raw) as ParsedInput
  } catch (error) {
    throw new Error(
      `House robber input must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    )
  }

  return houseRobberInputSchema.parse(parsed)
}

export function traceRollingDpHouseRobber(
  input: HouseRobberInput
): TraceEvent[] {
  const events: TraceEvent[] = []
  let step = 0
  let prevTwo = 0
  let prevOne = 0
  let index = 0

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
    payload: { variable: "prevTwo", next: prevTwo },
    snapshot: snapshot(input, { prevTwo }),
  })

  push({
    type: "mutate",
    codeLine: "L2",
    scopeId: "main",
    payload: { variable: "prevOne", next: prevOne },
    snapshot: snapshot(input, { prevTwo, prevOne }),
  })

  while (index < input.nums.length) {
    const currentValue = input.nums[index]

    push({
      type: "compare",
      codeLine: "L3",
      scopeId: "main",
      payload: { expression: "index < nums.length", result: true, index },
      snapshot: snapshot(input, { index, currentValue, prevTwo, prevOne }),
    })

    push({
      type: "pointer-update",
      codeLine: "L4",
      scopeId: "main",
      payload: { index, currentValue },
      snapshot: snapshot(input, { index, currentValue, prevTwo, prevOne }),
    })

    const take = prevTwo + currentValue
    push({
      type: "mutate",
      codeLine: "L4",
      scopeId: "main",
      payload: { variable: "take", next: take, prevTwo, currentValue },
      snapshot: snapshot(input, { index, currentValue, prevTwo, prevOne, take }),
    })

    const skip = prevOne
    push({
      type: "mutate",
      codeLine: "L5",
      scopeId: "main",
      payload: { variable: "skip", next: skip },
      snapshot: snapshot(input, { index, currentValue, prevTwo, prevOne, take, skip }),
    })

    const best = Math.max(take, skip)
    const decision: "take" | "skip" = take >= skip ? "take" : "skip"
    push({
      type: "compare",
      codeLine: "L6",
      scopeId: "main",
      payload: { take, skip, best, decision },
      snapshot: snapshot(input, {
        index,
        currentValue,
        prevTwo,
        prevOne,
        take,
        skip,
        best,
        decision,
      }),
    })

    const previousPrevOne = prevOne
    prevTwo = prevOne
    push({
      type: "mutate",
      codeLine: "L7",
      scopeId: "main",
      payload: { variable: "prevTwo", next: prevTwo, from: previousPrevOne },
      snapshot: snapshot(input, {
        index,
        currentValue,
        prevTwo,
        prevOne: previousPrevOne,
        take,
        skip,
        best,
        decision,
      }),
    })

    prevOne = best
    push({
      type: "mutate",
      codeLine: "L8",
      scopeId: "main",
      payload: { variable: "prevOne", next: prevOne, changed: prevOne !== previousPrevOne },
      snapshot: snapshot(input, {
        index,
        currentValue,
        prevTwo,
        prevOne,
        take,
        skip,
        best,
        decision,
      }),
    })

    index += 1
  }

  push({
    type: "compare",
    codeLine: "L3",
    scopeId: "main",
    payload: { expression: "index < nums.length", result: false, index },
    snapshot: snapshot(input, { prevTwo, prevOne }),
  })

  push({
    type: "result",
    codeLine: "L10",
    scopeId: "main",
    payload: { answer: prevOne },
    snapshot: snapshot(input, { prevTwo, prevOne, answer: prevOne }),
  })

  push({
    type: "complete",
    codeLine: "L10",
    scopeId: "main",
    payload: { answer: prevOne },
    snapshot: snapshot(input, { prevTwo, prevOne, answer: prevOne }),
  })

  return events
}