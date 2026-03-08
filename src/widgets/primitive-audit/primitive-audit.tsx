import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import {
  defineArrayPrimitiveFrameState,
  defineCallTreePrimitiveFrameState,
  defineCodeTracePrimitiveFrameState,
  defineHashMapPrimitiveFrameState,
  defineNarrationPrimitiveFrameState,
  defineStackPrimitiveFrameState,
  defineStatePrimitiveFrameState,
  defineTreePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import type { PrimitiveFrameState } from "@/entities/visualization/types"
import { PrimitiveRenderer } from "@/shared/visualization/primitive-renderer"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

type PrimitiveScenario = {
  id: string
  title: string
  description: string
  frames: PrimitiveFrameState[]
}

type CompositionFrame = {
  summary: string
  primary: PrimitiveFrameState[]
  secondary: PrimitiveFrameState[]
}

type CompositionScenario = {
  id: string
  title: string
  description: string
  frames: CompositionFrame[]
}

function buildArrayFrames() {
  return [
    defineArrayPrimitiveFrameState({
      id: "audit-array-0",
      kind: "array",
      title: "Search Interval",
      subtitle: "Start with the full interval and one active pointer.",
      data: {
        cells: [
          { id: "cell-0", index: 0, value: 1 },
          { id: "cell-1", index: 1, value: 3 },
          { id: "cell-2", index: 2, value: 5 },
          { id: "cell-3", index: 3, value: 7 },
          { id: "cell-4", index: 4, value: 9 },
          { id: "cell-5", index: 5, value: 11 },
        ],
      },
      pointers: [
        { id: "lo", targetId: "cell-0", label: "lo", tone: "primary", placement: "top", priority: 1 },
        { id: "hi", targetId: "cell-5", label: "hi", tone: "secondary", placement: "top", priority: 1 },
      ],
      highlights: [
        { targetId: "cell-0", tone: "active", emphasis: "normal" },
        { targetId: "cell-5", tone: "active", emphasis: "normal" },
      ],
      annotations: [
        { id: "interval", targetId: "cell-2", kind: "badge", text: "full range", tone: "muted" },
      ],
    }),
    defineArrayPrimitiveFrameState({
      id: "audit-array-1",
      kind: "array",
      title: "Search Interval",
      subtitle: "Focus narrows around the compared midpoint.",
      data: {
        cells: [
          { id: "cell-0", index: 0, value: 1 },
          { id: "cell-1", index: 1, value: 3 },
          { id: "cell-2", index: 2, value: 5 },
          { id: "cell-3", index: 3, value: 7 },
          { id: "cell-4", index: 4, value: 9 },
          { id: "cell-5", index: 5, value: 11 },
        ],
      },
      pointers: [
        { id: "lo", targetId: "cell-2", label: "lo", tone: "primary", placement: "top", priority: 1 },
        { id: "hi", targetId: "cell-4", label: "hi", tone: "secondary", placement: "top", priority: 2 },
        { id: "mid", targetId: "cell-3", label: "mid", tone: "compare", placement: "bottom", priority: 1 },
      ],
      highlights: [
        { targetId: "cell-2", tone: "candidate", emphasis: "soft" },
        { targetId: "cell-3", tone: "compare", emphasis: "strong" },
        { targetId: "cell-4", tone: "candidate", emphasis: "soft" },
      ],
      annotations: [
        { id: "candidate", targetId: "cell-3", kind: "badge", text: "compare", tone: "active" },
      ],
    }),
    defineArrayPrimitiveFrameState({
      id: "audit-array-2",
      kind: "array",
      title: "Search Interval",
      subtitle: "Converged pointers should still read clearly.",
      data: {
        cells: [
          { id: "cell-0", index: 0, value: 1 },
          { id: "cell-1", index: 1, value: 3 },
          { id: "cell-2", index: 2, value: 5 },
          { id: "cell-3", index: 3, value: 7 },
          { id: "cell-4", index: 4, value: 9 },
          { id: "cell-5", index: 5, value: 11 },
        ],
      },
      pointers: [
        { id: "hi", targetId: "cell-3", label: "hi", tone: "secondary", placement: "top", priority: 1 },
        { id: "lo", targetId: "cell-3", label: "lo", tone: "primary", placement: "top", priority: 2 },
        { id: "mid", targetId: "cell-3", label: "mid", tone: "compare", placement: "bottom", priority: 1 },
      ],
      highlights: [{ targetId: "cell-3", tone: "found", emphasis: "strong" }],
      annotations: [
        { id: "found", targetId: "cell-3", kind: "badge", text: "found", tone: "success" },
      ],
    }),
  ]
}

function buildStateFrames() {
  return [
    defineStatePrimitiveFrameState({
      id: "audit-state-0",
      kind: "state",
      title: "State",
      subtitle: "Initial variables should scan quickly.",
      data: { values: [{ label: "target", value: 7 }, { label: "lo", value: 0 }, { label: "hi", value: 5 }, { label: "mid", value: "—" }] },
    }),
    defineStatePrimitiveFrameState({
      id: "audit-state-1",
      kind: "state",
      title: "State",
      subtitle: "Live values should update without changing structure.",
      data: { values: [{ label: "target", value: 7 }, { label: "lo", value: 2 }, { label: "hi", value: 4 }, { label: "mid", value: 3 }, { label: "value", value: 7 }] },
    }),
    defineStatePrimitiveFrameState({
      id: "audit-state-2",
      kind: "state",
      title: "State",
      subtitle: "Terminal values should remain legible at a glance.",
      data: { values: [{ label: "target", value: 7 }, { label: "lo", value: 3 }, { label: "hi", value: 3 }, { label: "mid", value: 3 }, { label: "answer", value: 3 }] },
    }),
  ]
}

function buildStackFrames() {
  return [
    defineStackPrimitiveFrameState({
      id: "audit-stack-0",
      kind: "stack",
      title: "Call Stack",
      subtitle: "Waiting frames should not overpower the active frame.",
      data: {
        topLabel: "top",
        frames: [{ id: "s0", label: "dfs(4)", status: "active", annotation: "current" }],
      },
    }),
    defineStackPrimitiveFrameState({
      id: "audit-stack-1",
      kind: "stack",
      title: "Call Stack",
      subtitle: "Depth growth should keep ordering obvious.",
      data: {
        topLabel: "top",
        frames: [
          { id: "s1", label: "dfs(3)", status: "active", annotation: "current" },
          { id: "s0", label: "dfs(4)", status: "waiting", detail: "waiting for child" },
        ],
      },
    }),
    defineStackPrimitiveFrameState({
      id: "audit-stack-2",
      kind: "stack",
      title: "Call Stack",
      subtitle: "Resolved frames should remain readable without looking alive.",
      data: {
        topLabel: "top",
        frames: [
          { id: "s2", label: "dfs(2)", status: "active", annotation: "current" },
          { id: "s1", label: "dfs(3)", status: "waiting", detail: "joining result" },
          { id: "s0", label: "dfs(4)", status: "done", detail: "memo ready" },
        ],
      },
    }),
  ]
}

function buildHashMapFrames() {
  return [
    defineHashMapPrimitiveFrameState({
      id: "audit-map-0",
      kind: "hash-map",
      title: "Memo Table",
      subtitle: "Keys and values need stable alignment.",
      data: {
        entries: [
          { id: "m0", key: "0", value: 1, status: "done", annotation: "seed" },
          { id: "m1", key: "1", value: 1, status: "memo" },
          { id: "m2", key: "2", value: null, status: "pending", annotation: "next" },
        ],
      },
    }),
    defineHashMapPrimitiveFrameState({
      id: "audit-map-1",
      kind: "hash-map",
      title: "Memo Table",
      subtitle: "Reads and writes should be visually distinct.",
      data: {
        entries: [
          { id: "m0", key: "0", value: 1, status: "done", annotation: "seed" },
          { id: "m1", key: "1", value: 1, status: "read", annotation: "reused" },
          { id: "m2", key: "2", value: 2, status: "write", annotation: "store value" },
          { id: "m3", key: "3", value: null, status: "pending" },
        ],
      },
    }),
    defineHashMapPrimitiveFrameState({
      id: "audit-map-2",
      kind: "hash-map",
      title: "Memo Table",
      subtitle: "Settled tables should compact well as they grow.",
      data: {
        entries: [
          { id: "m0", key: "0", value: 1, status: "done" },
          { id: "m1", key: "1", value: 1, status: "memo" },
          { id: "m2", key: "2", value: 2, status: "memo" },
          { id: "m3", key: "3", value: 3, status: "done", annotation: "resolved" },
        ],
      },
    }),
  ]
}

function buildTreeFrames() {
  return [
    defineTreePrimitiveFrameState({
      id: "audit-tree-0",
      kind: "tree",
      title: "Search Tree",
      subtitle: "Traversal should feel centered in the viewport.",
      data: {
        rootId: "tr",
        nodes: [
          { id: "tr", label: "8", status: "active" },
          { id: "ta", parentId: "tr", label: "4", status: "default" },
          { id: "tb", parentId: "tr", label: "12", status: "dim" },
          { id: "tc", parentId: "ta", label: "2", status: "base" },
          { id: "td", parentId: "ta", label: "6", status: "default" },
        ],
      },
      edgeHighlights: [{ id: "tr-ta", sourceId: "tr", targetId: "ta", tone: "active", emphasis: "strong" }],
    }),
    defineTreePrimitiveFrameState({
      id: "audit-tree-1",
      kind: "tree",
      title: "Search Tree",
      subtitle: "Decision edges should remain legible during movement.",
      data: {
        rootId: "tr",
        nodes: [
          { id: "tr", label: "8", status: "done" },
          { id: "ta", parentId: "tr", label: "4", status: "active", annotation: "visit" },
          { id: "tb", parentId: "tr", label: "12", status: "dim" },
          { id: "tc", parentId: "ta", label: "2", status: "base" },
          { id: "td", parentId: "ta", label: "6", status: "found", annotation: "hit" },
        ],
      },
      edgeHighlights: [
        { id: "tr-ta", sourceId: "tr", targetId: "ta", tone: "done" },
        { id: "ta-td", sourceId: "ta", targetId: "td", tone: "found", emphasis: "strong" },
      ],
    }),
  ]
}

function buildCallTreeFrames() {
  return [
    defineCallTreePrimitiveFrameState({
      id: "audit-call-0",
      kind: "call-tree",
      title: "Execution Tree",
      subtitle: "Current execution should dominate the tree.",
      data: {
        rootId: "cr",
        nodes: [{ id: "cr", label: "fib", stateValue: "(4)", status: "current", badge: "active" }],
      },
    }),
    defineCallTreePrimitiveFrameState({
      id: "audit-call-1",
      kind: "call-tree",
      title: "Execution Tree",
      subtitle: "Forked calls should stay readable without overlap.",
      data: {
        rootId: "cr",
        nodes: [
          { id: "cr", label: "fib", stateValue: "(4)", status: "waiting" },
          { id: "cl", parentId: "cr", label: "fib", stateValue: "(3)", status: "current", badge: "active" },
          { id: "rr", parentId: "cr", label: "fib", stateValue: "(2)", status: "memo", returnValue: "1" },
        ],
      },
      edgeHighlights: [
        { id: "cr-cl", sourceId: "cr", targetId: "cl", tone: "active", emphasis: "strong" },
        { id: "cr-rr", sourceId: "cr", targetId: "rr", tone: "memo" },
      ],
    }),
    defineCallTreePrimitiveFrameState({
      id: "audit-call-2",
      kind: "call-tree",
      title: "Execution Tree",
      subtitle: "Solved descendants should remain connected to the active branch.",
      data: {
        rootId: "cr",
        nodes: [
          { id: "cr", label: "fib", stateValue: "(4)", status: "waiting" },
          { id: "cl", parentId: "cr", label: "fib", stateValue: "(3)", status: "current", badge: "join" },
          { id: "rr", parentId: "cr", label: "fib", stateValue: "(2)", status: "memo", returnValue: "1" },
          { id: "ca", parentId: "cl", label: "fib", stateValue: "(2)", status: "solved", returnValue: "1" },
          { id: "cb", parentId: "cl", label: "fib", stateValue: "(1)", status: "base", returnValue: "1" },
        ],
      },
      edgeHighlights: [
        { id: "cr-cl", sourceId: "cr", targetId: "cl", tone: "active" },
        { id: "cl-ca", sourceId: "cl", targetId: "ca", tone: "done" },
        { id: "cl-cb", sourceId: "cl", targetId: "cb", tone: "found" },
      ],
    }),
  ]
}

function buildCodeFrames() {
  const lines = [
    { id: "L1", lineNumber: 1, text: "function fib(n) {", tokens: [{ content: "function fib(n) {" }] },
    { id: "L2", lineNumber: 2, text: "  if (memo[n]) return memo[n]", tokens: [{ content: "  if (memo[n]) return memo[n]" }] },
    { id: "L3", lineNumber: 3, text: "  if (n <= 1) return 1", tokens: [{ content: "  if (n <= 1) return 1" }] },
    { id: "L4", lineNumber: 4, text: "  const value = fib(n - 1) + fib(n - 2)", tokens: [{ content: "  const value = fib(n - 1) + fib(n - 2)" }] },
    { id: "L5", lineNumber: 5, text: "  memo[n] = value", tokens: [{ content: "  memo[n] = value" }] },
    { id: "L6", lineNumber: 6, text: "  return value", tokens: [{ content: "  return value" }] },
    { id: "L7", lineNumber: 7, text: "}", tokens: [{ content: "}" }] },
  ]

  return [
    defineCodeTracePrimitiveFrameState({
      id: "audit-code-0",
      kind: "code-trace",
      title: "Code Trace",
      subtitle: "Waiting and active lines should read as different states.",
      data: { lines, activeLineId: "L2", waitingLineIds: ["L4"] },
    }),
    defineCodeTracePrimitiveFrameState({
      id: "audit-code-1",
      kind: "code-trace",
      title: "Code Trace",
      subtitle: "Execution should move without causing line wrap or layout jitter.",
      data: { lines, activeLineId: "L4", waitingLineIds: ["L2"], returnedLineIds: ["L3"] },
    }),
    defineCodeTracePrimitiveFrameState({
      id: "audit-code-2",
      kind: "code-trace",
      title: "Code Trace",
      subtitle: "Return state should stay visible while the active line advances.",
      data: { lines, activeLineId: "L6", returnedLineIds: ["L3", "L5"] },
    }),
  ]
}

function buildNarrationFrames() {
  return [
    defineNarrationPrimitiveFrameState({
      id: "audit-narration-0",
      kind: "narration",
      title: "Narration",
      subtitle: "Narration should explain only the active visible change.",
      data: {
        summary: "Start by checking whether the memo already contains this answer.",
        segments: [],
        codeLine: "L2",
        visualChange: "read",
      },
    }),
    defineNarrationPrimitiveFrameState({
      id: "audit-narration-1",
      kind: "narration",
      title: "Narration",
      subtitle: "Segment tones should add emphasis without turning into rainbow prose.",
      data: {
        summary: "The current call splits into two smaller calls.",
        segments: [
          { id: "n0", text: "The current call ", tone: "default" },
          { id: "n1", text: "splits", tone: "active" },
          { id: "n2", text: " into two smaller calls while the ", tone: "default" },
          { id: "n3", text: "memo", tone: "memo" },
          { id: "n4", text: " result stays available.", tone: "default" },
        ],
        codeLine: "L4",
        visualChange: "split",
      },
    }),
    defineNarrationPrimitiveFrameState({
      id: "audit-narration-2",
      kind: "narration",
      title: "Narration",
      subtitle: "Terminal narration should stay compact and explicit.",
      data: {
        summary: "Both child calls returned, so the parent can publish one merged answer.",
        segments: [],
        codeLine: "L6",
        visualChange: "return",
      },
    }),
  ]
}

const primitiveScenarios: PrimitiveScenario[] = [
  { id: "array", title: "Array", description: "Pointers, highlights, and annotations across interval changes.", frames: buildArrayFrames() },
  { id: "state", title: "State", description: "Key-value state should remain scannable as values change.", frames: buildStateFrames() },
  { id: "stack", title: "Stack", description: "Execution depth and status changes across recursive frames.", frames: buildStackFrames() },
  { id: "hash-map", title: "Hash Map", description: "Read/write/pending states in a compact memo table.", frames: buildHashMapFrames() },
  { id: "tree", title: "Tree", description: "Structural tree with active traversal edges.", frames: buildTreeFrames() },
  { id: "call-tree", title: "Call Tree", description: "Execution tree with branching and returned values.", frames: buildCallTreeFrames() },
  { id: "code-trace", title: "Code Trace", description: "Active, waiting, and returned code lines across steps.", frames: buildCodeFrames() },
  { id: "narration", title: "Narration", description: "Narration tone and metadata across frame changes.", frames: buildNarrationFrames() },
]

const compositionScenarios: CompositionScenario[] = [
  {
    id: "search-stage",
    title: "Composition Audit: Search Stage",
    description: "Primary array with docked state, stepped across a realistic search sequence.",
    frames: buildArrayFrames().map((primary, index) => ({
      summary: [
        "Full interval with endpoints visible.",
        "Midpoint comparison narrows the interval.",
        "Converged pointers resolve the target.",
      ][index]!,
      primary: [primary],
      secondary: [buildStateFrames()[index]!],
    })),
  },
  {
    id: "recursion-stage",
    title: "Composition Audit: Recursion Stage",
    description: "Call tree, stack, and memo table moving together across recursion frames.",
    frames: buildCallTreeFrames().map((primary, index) => ({
      summary: [
        "Single active root call.",
        "Branching introduces one active and one memoized child.",
        "Solved descendants and memo state join in one frame.",
      ][index]!,
      primary: [primary],
      secondary: [buildStackFrames()[Math.min(index, buildStackFrames().length - 1)]!, buildHashMapFrames()[Math.min(index, buildHashMapFrames().length - 1)]!],
    })),
  },
]

function Stepper({
  index,
  total,
  onPrevious,
  onNext,
}: {
  index: number
  total: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={onPrevious} disabled={index === 0}>
        <ChevronLeftIcon data-icon="inline-start" />
        Prev
      </Button>
      <Badge variant="outline">
        {index + 1} / {total}
      </Badge>
      <Button size="sm" variant="outline" onClick={onNext} disabled={index >= total - 1}>
        <ChevronRightIcon data-icon="inline-start" />
        Next
      </Button>
    </div>
  )
}

export function PrimitiveAudit() {
  const [primitiveFrameIndex, setPrimitiveFrameIndex] = useState<Record<string, number>>(
    Object.fromEntries(primitiveScenarios.map((scenario) => [scenario.id, 0]))
  )
  const [compositionFrameIndex, setCompositionFrameIndex] = useState<Record<string, number>>(
    Object.fromEntries(compositionScenarios.map((scenario) => [scenario.id, 0]))
  )

  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_20%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_18%),linear-gradient(180deg,rgba(9,14,23,0.96)_0%,rgba(9,14,23,1)_100%)]">
        <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-6 px-4 py-5 xl:px-6">
          <Card className="border border-border/60 bg-card/70 shadow-[0_18px_70px_rgba(2,8,23,0.42)] backdrop-blur">
            <CardHeader>
              <CardTitle>
                <h1>Primitive QA Harness</h1>
              </CardTitle>
              <CardDescription>
                Every current primitive is stepped through frames here, plus two mixed compositions.
              </CardDescription>
            </CardHeader>
          </Card>

          {compositionScenarios.map((scenario) => {
            const index = compositionFrameIndex[scenario.id] ?? 0
            const frame = scenario.frames[index]!

            return (
              <Card
                key={scenario.id}
                className="border border-cyan-500/12 bg-card/72 shadow-[0_20px_90px_rgba(2,8,23,0.45)] backdrop-blur"
              >
                <CardHeader>
                  <CardAction>
                    <Stepper
                      index={index}
                      total={scenario.frames.length}
                      onPrevious={() =>
                        setCompositionFrameIndex((current) => ({
                          ...current,
                          [scenario.id]: Math.max((current[scenario.id] ?? 0) - 1, 0),
                        }))
                      }
                      onNext={() =>
                        setCompositionFrameIndex((current) => ({
                          ...current,
                          [scenario.id]: Math.min(
                            (current[scenario.id] ?? 0) + 1,
                            scenario.frames.length - 1
                          ),
                        }))
                      }
                    />
                  </CardAction>
                  <CardTitle>
                    <h2>{scenario.title}</h2>
                  </CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="text-sm text-foreground/78">{frame.summary}</p>
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_22rem]">
                    <div className="rounded-[1.5rem] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88)_0%,rgba(10,15,25,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <div className="grid auto-rows-max gap-4">
                        {frame.primary.map((primitive) => (
                          <PrimitiveRenderer key={primitive.id} primitive={primitive} />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[1.35rem] border border-border/60 bg-muted/12 p-3">
                      <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Support Views
                      </div>
                      <div className="grid auto-rows-max gap-4">
                        {frame.secondary.map((primitive) => (
                          <PrimitiveRenderer key={primitive.id} primitive={primitive} />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <Card className="border border-border/60 bg-card/72 shadow-[0_18px_70px_rgba(2,8,23,0.36)] backdrop-blur">
            <CardHeader>
              <CardTitle>
                <h2>Single Primitive Scenarios</h2>
              </CardTitle>
              <CardDescription>
                Each renderer is stepped independently so visual and transition bugs stay isolated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {primitiveScenarios.map((scenario) => {
                  const index = primitiveFrameIndex[scenario.id] ?? 0
                  const primitive = scenario.frames[index]!

                  return (
                    <Card key={scenario.id} size="sm" className="border border-border/60 bg-background/42">
                      <CardHeader>
                        <CardAction>
                          <Stepper
                            index={index}
                            total={scenario.frames.length}
                            onPrevious={() =>
                              setPrimitiveFrameIndex((current) => ({
                                ...current,
                                [scenario.id]: Math.max((current[scenario.id] ?? 0) - 1, 0),
                              }))
                            }
                            onNext={() =>
                              setPrimitiveFrameIndex((current) => ({
                                ...current,
                                [scenario.id]: Math.min(
                                  (current[scenario.id] ?? 0) + 1,
                                  scenario.frames.length - 1
                                ),
                              }))
                            }
                          />
                        </CardAction>
                        <CardTitle>{scenario.title}</CardTitle>
                        <CardDescription>{scenario.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PrimitiveRenderer primitive={primitive} />
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
