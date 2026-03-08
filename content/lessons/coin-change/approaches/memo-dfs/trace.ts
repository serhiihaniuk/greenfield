import { z } from "zod"

import type { ParsedInput } from "@/domains/lessons/types"
import { defineTraceEvent, type TraceEvent } from "@/domains/tracing/types"

const INF = "INF" as const
type FiniteOrInf = number | typeof INF
type CallStatus = "current" | "waiting" | "solved" | "memo" | "dead" | "base"

const coinChangeInputSchema = z.object({
  coins: z.array(z.number().int().positive()).min(1),
  amount: z.number().int().nonnegative(),
})

export type CoinChangeInput = z.infer<typeof coinChangeInputSchema>

type MemoEntrySnapshot = {
  key: number
  value: FiniteOrInf | null
}

type CallSnapshot = {
  callId: string
  parentCallId?: string
  remaining: number
  viaCoin?: number
  currentCoin?: number
  childRemaining?: number
  childValue?: FiniteOrInf
  candidate?: FiniteOrInf
  best?: FiniteOrInf
  returnValue?: FiniteOrInf
  status: CallStatus
}

type CoinChangeSnapshot = {
  coins: number[]
  amount: number
  memo: MemoEntrySnapshot[]
  calls: CallSnapshot[]
  stack: string[]
  activeCallId?: string
  answer?: FiniteOrInf
  normalizedAnswer?: number
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

function normalizeValue(value: number): FiniteOrInf {
  return Number.isFinite(value) ? value : INF
}

function snapshot(
  input: CoinChangeInput,
  values: Omit<CoinChangeSnapshot, "coins" | "amount">
): CoinChangeSnapshot {
  return stripUndefined({
    coins: input.coins,
    amount: input.amount,
    ...values,
  })
}

export function parseCoinChangeInput(raw: string): CoinChangeInput {
  let parsed: ParsedInput

  try {
    parsed = JSON.parse(raw) as ParsedInput
  } catch (error) {
    throw new Error(
      `Coin change input must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    )
  }

  return coinChangeInputSchema.parse(parsed)
}

export function traceMemoDfsCoinChange(input: CoinChangeInput): TraceEvent[] {
  const events: TraceEvent[] = []
  const memo = new Map<number, number>()
  const calls: CallSnapshot[] = []
  const stack: string[] = []
  let callCounter = 0
  let eventCounter = 0
  let answer: number | undefined

  const capture = (activeCallId?: string) =>
    snapshot(input, {
      memo: [...memo.entries()]
        .sort((left, right) => left[0] - right[0])
        .map(([key, value]) => ({
          key,
          value: normalizeValue(value),
        })),
      calls: calls.map((call) => ({ ...call })),
      stack: [...stack],
      activeCallId,
      answer: answer !== undefined ? normalizeValue(answer) : undefined,
      normalizedAnswer:
        answer === undefined
          ? undefined
          : Number.isFinite(answer)
            ? answer
            : -1,
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

  const getCall = (callId: string | undefined) => {
    if (!callId) {
      return undefined
    }

    return calls.find((entry) => entry.callId === callId)
  }

  const setCallStatus = (callId: string | undefined, status: CallStatus) => {
    const call = getCall(callId)
    if (call) {
      call.status = status
    }
  }

  const dfs = (
    remaining: number,
    parentCallId: string | undefined,
    triggerCodeLine: string,
    viaCoin?: number
  ): number => {
    setCallStatus(parentCallId, "waiting")

    callCounter += 1
    const callId = `call-${callCounter}`
    calls.push({
      callId,
      parentCallId,
      remaining,
      viaCoin,
      status: "current",
    })
    stack.push(callId)

    push({
      type: "call",
      codeLine: triggerCodeLine,
      scopeId: callId,
      payload: {
        callId,
        parentCallId: parentCallId ?? null,
        remaining,
        viaCoin: viaCoin ?? null,
      },
      snapshot: capture(callId),
    })

    const currentCall = getCall(callId)
    if (!currentCall) {
      throw new Error(`Missing call snapshot for ${callId}.`)
    }

    if (remaining === 0) {
      currentCall.returnValue = 0
      currentCall.status = "base"

      push({
        type: "base-case",
        codeLine: "L3",
        scopeId: callId,
        payload: {
          callId,
          remaining,
          returnValue: 0,
        },
        snapshot: capture(callId),
      })

      stack.pop()
      setCallStatus(parentCallId, "current")

      push({
        type: "return",
        codeLine: "L3",
        scopeId: callId,
        payload: {
          callId,
          parentCallId: parentCallId ?? null,
          remaining,
          returnValue: 0,
        },
        snapshot: capture(parentCallId),
      })

      return 0
    }

    if (remaining < 0) {
      currentCall.returnValue = INF
      currentCall.status = "dead"

      push({
        type: "base-case",
        codeLine: "L4",
        scopeId: callId,
        payload: {
          callId,
          remaining,
          returnValue: INF,
        },
        snapshot: capture(callId),
      })

      stack.pop()
      setCallStatus(parentCallId, "current")

      push({
        type: "return",
        codeLine: "L4",
        scopeId: callId,
        payload: {
          callId,
          parentCallId: parentCallId ?? null,
          remaining,
          returnValue: INF,
        },
        snapshot: capture(parentCallId),
      })

      return Number.POSITIVE_INFINITY
    }

    if (memo.has(remaining)) {
      const memoValue = memo.get(remaining)
      if (memoValue === undefined) {
        throw new Error(`Missing memo value for remaining=${remaining}.`)
      }

      currentCall.returnValue = normalizeValue(memoValue)
      currentCall.status = "memo"

      push({
        type: "memo-hit",
        codeLine: "L5",
        scopeId: callId,
        payload: {
          callId,
          remaining,
          memoValue: normalizeValue(memoValue),
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
          remaining,
          returnValue: normalizeValue(memoValue),
        },
        snapshot: capture(parentCallId),
      })

      return memoValue
    }

    let best = Number.POSITIVE_INFINITY
    currentCall.best = INF
    push({
      type: "mutate",
      codeLine: "L6",
      scopeId: callId,
      payload: {
        callId,
        remaining,
        best: INF,
      },
      snapshot: capture(callId),
    })

    for (const coin of input.coins) {
      currentCall.currentCoin = coin
      currentCall.childRemaining = remaining - coin
      delete currentCall.childValue
      delete currentCall.candidate

      push({
        type: "compare",
        codeLine: "L7",
        scopeId: callId,
        payload: {
          callId,
          remaining,
          coin,
          childRemaining: remaining - coin,
        },
        snapshot: capture(callId),
      })

      const child = dfs(remaining - coin, callId, "L8", coin)
      const normalizedChild = normalizeValue(child)
      currentCall.currentCoin = coin
      currentCall.childRemaining = remaining - coin
      currentCall.childValue = normalizedChild
      currentCall.status = "current"

      push({
        type: "mutate",
        codeLine: "L8",
        scopeId: callId,
        payload: {
          callId,
          remaining,
          coin,
          childRemaining: remaining - coin,
          childValue: normalizedChild,
        },
        snapshot: capture(callId),
      })

      const usable = Number.isFinite(child)
      push({
        type: "compare",
        codeLine: "L9",
        scopeId: callId,
        payload: {
          callId,
          remaining,
          coin,
          childValue: normalizedChild,
          usable,
        },
        snapshot: capture(callId),
      })

      if (!usable) {
        continue
      }

      const candidate = child + 1
      currentCall.candidate = normalizeValue(candidate)
      push({
        type: "mutate",
        codeLine: "L10",
        scopeId: callId,
        payload: {
          callId,
          remaining,
          coin,
          candidate,
        },
        snapshot: capture(callId),
      })

      best = Math.min(best, candidate)
      currentCall.best = normalizeValue(best)
      push({
        type: "mutate",
        codeLine: "L11",
        scopeId: callId,
        payload: {
          callId,
          remaining,
          coin,
          best: normalizeValue(best),
        },
        snapshot: capture(callId),
      })
    }

    memo.set(remaining, best)
    currentCall.best = normalizeValue(best)
    currentCall.returnValue = normalizeValue(best)
    currentCall.status = "solved"

    push({
      type: "mutate",
      codeLine: "L13",
      scopeId: callId,
      payload: {
        callId,
        remaining,
        memoValue: normalizeValue(best),
      },
      snapshot: capture(callId),
    })

    push({
      type: "result",
      codeLine: "L14",
      scopeId: callId,
      payload: {
        callId,
        remaining,
        returnValue: normalizeValue(best),
      },
      snapshot: capture(callId),
    })

    stack.pop()
    setCallStatus(parentCallId, "current")

    push({
      type: "return",
      codeLine: "L14",
      scopeId: callId,
      payload: {
        callId,
        parentCallId: parentCallId ?? null,
        remaining,
        returnValue: normalizeValue(best),
      },
      snapshot: capture(parentCallId),
    })

    return best
  }

  push({
    type: "mutate",
    codeLine: "L1",
    scopeId: "main",
    payload: { variable: "memo", next: [] },
    snapshot: capture(),
  })

  answer = dfs(input.amount, undefined, "L15")

  push({
    type: "mutate",
    codeLine: "L15",
    scopeId: "main",
    payload: {
      answer: normalizeValue(answer),
    },
    snapshot: capture(),
  })

  push({
    type: "result",
    codeLine: "L16",
    scopeId: "main",
    payload: {
      answer: normalizeValue(answer),
      normalizedAnswer: Number.isFinite(answer) ? answer : -1,
    },
    snapshot: capture(),
  })

  push({
    type: "complete",
    codeLine: "L16",
    scopeId: "main",
    payload: {
      answer: normalizeValue(answer),
      normalizedAnswer: Number.isFinite(answer) ? answer : -1,
    },
    snapshot: capture(),
  })

  return events
}
