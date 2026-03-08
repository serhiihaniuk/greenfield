import { render, screen, within } from "@testing-library/react"

import {
  defineCallTreePrimitiveFrameState,
  defineCodeTracePrimitiveFrameState,
  defineGraphPrimitiveFrameState,
  defineHashMapPrimitiveFrameState,
  defineNarrationPrimitiveFrameState,
  defineArrayPrimitiveFrameState,
  defineQueuePrimitiveFrameState,
  defineStackPrimitiveFrameState,
  defineStatePrimitiveFrameState,
  defineTreePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import { PrimitiveRenderer } from "@/shared/visualization/primitive-renderer"
import { layoutTree } from "@/shared/visualization/layouts/tree-layout"
import { layoutCallTree } from "@/shared/visualization/layouts/call-tree-layout"

describe("PrimitiveRenderer", () => {
  it("renders array primitives with deterministic pointer order and highlight tone", () => {
    const primitive = defineArrayPrimitiveFrameState({
      id: "array",
      kind: "array",
      title: "Search Interval",
      data: {
        cells: [
          { id: "cell-0", index: 0, value: 1 },
          { id: "cell-1", index: 1, value: 3 },
        ],
      },
      pointers: [
        {
          id: "mid",
          targetId: "cell-1",
          label: "mid",
          tone: "compare",
          placement: "bottom",
          priority: 2,
        },
        {
          id: "lo",
          targetId: "cell-1",
          label: "lo",
          tone: "primary",
          placement: "bottom",
          priority: 1,
        },
      ],
      highlights: [
        {
          targetId: "cell-1",
          tone: "compare",
          emphasis: "strong",
        },
      ],
      annotations: [
        {
          id: "candidate",
          targetId: "cell-1",
          kind: "badge",
          text: "candidate",
          tone: "active",
        },
      ],
    })

    render(<PrimitiveRenderer primitive={primitive} />)

    const bottomStack = screen.getByTestId("pointer-stack-bottom-cell-1")
    const pointerLabels = within(bottomStack)
      .getAllByText(/lo|mid/)
      .map((node) => node.textContent)

    expect(pointerLabels).toEqual(["lo", "mid"])
    expect(screen.getByText("candidate")).toBeInTheDocument()
    expect(
      screen.getByText("3").closest("[data-highlight-tone]")
    ).toHaveAttribute("data-highlight-tone", "compare")
  })

  it("renders state primitives as labeled rows", () => {
    const primitive = defineStatePrimitiveFrameState({
      id: "state",
      kind: "state",
      title: "State",
      data: {
        values: [
          { label: "lo", value: 0 },
          { label: "hi", value: 5 },
        ],
      },
    })

    render(<PrimitiveRenderer primitive={primitive} />)

    expect(screen.getByText("State")).toBeInTheDocument()
    expect(screen.getByText("lo")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("renders stack, queue, hash-map, tree, graph, call-tree, code-trace, and narration primitives", () => {
    const stackPrimitive = defineStackPrimitiveFrameState({
      id: "stack",
      kind: "stack",
      title: "Call Stack",
      data: {
        topLabel: "top",
        frames: [
          { id: "f1", label: "dfs(3)", status: "active" },
          { id: "f2", label: "dfs(2)", status: "waiting" },
        ],
      },
    })
    const queuePrimitive = defineQueuePrimitiveFrameState({
      id: "queue",
      kind: "queue",
      title: "Frontier",
      data: {
        frontLabel: "front",
        backLabel: "back",
        items: [
          { id: "q1", label: "A", status: "active" },
          { id: "q2", label: "B", status: "waiting" },
        ],
      },
    })
    const hashMapPrimitive = defineHashMapPrimitiveFrameState({
      id: "memo",
      kind: "hash-map",
      title: "Memo",
      data: {
        entries: [
          { id: "e1", key: "3", value: 8, status: "memo" },
          { id: "e2", key: "4", value: null, status: "pending" },
        ],
      },
    })
    const treePrimitive = defineTreePrimitiveFrameState({
      id: "tree",
      kind: "tree",
      title: "Tree",
      data: {
        rootId: "a",
        nodes: [
          { id: "a", label: "A", status: "active" },
          { id: "b", label: "B", parentId: "a", status: "default" },
          { id: "c", label: "C", parentId: "a", status: "default" },
        ],
      },
    })
    const graphPrimitive = defineGraphPrimitiveFrameState({
      id: "graph",
      kind: "graph",
      title: "Graph",
      data: {
        nodes: [
          { id: "a", label: "A", x: 80, y: 80, status: "active" },
          { id: "b", label: "B", x: 200, y: 160, status: "frontier" },
        ],
        edges: [{ id: "a-b", sourceId: "a", targetId: "b" }],
      },
    })
    const callTreePrimitive = defineCallTreePrimitiveFrameState({
      id: "call-tree",
      kind: "call-tree",
      title: "Execution",
      data: {
        rootId: "root",
        nodes: [
          { id: "root", label: "dfs", stateValue: "(3)", status: "current" },
          {
            id: "left",
            label: "dfs",
            stateValue: "(2)",
            parentId: "root",
            status: "waiting",
          },
        ],
      },
    })
    const codeTracePrimitive = defineCodeTracePrimitiveFrameState({
      id: "code",
      kind: "code-trace",
      title: "Code Trace",
      data: {
        activeLineId: "L2",
        lines: [
          {
            id: "L1",
            lineNumber: 1,
            text: "let lo = 0",
            tokens: [{ content: "let lo = 0" }],
          },
          {
            id: "L2",
            lineNumber: 2,
            text: "return mid",
            tokens: [{ content: "return mid" }],
          },
        ],
      },
    })
    const narrationPrimitive = defineNarrationPrimitiveFrameState({
      id: "narration",
      kind: "narration",
      title: "Narration",
      data: {
        summary: "Return the answer.",
        segments: [],
        codeLine: "L2",
        visualChange: "result",
      },
    })

    render(
      <div>
        <PrimitiveRenderer primitive={stackPrimitive} />
        <PrimitiveRenderer primitive={queuePrimitive} />
        <PrimitiveRenderer primitive={hashMapPrimitive} />
        <PrimitiveRenderer primitive={treePrimitive} />
        <PrimitiveRenderer primitive={graphPrimitive} />
        <PrimitiveRenderer primitive={callTreePrimitive} />
        <PrimitiveRenderer primitive={codeTracePrimitive} />
        <PrimitiveRenderer primitive={narrationPrimitive} />
      </div>
    )

    expect(screen.getByText("Call Stack")).toBeInTheDocument()
    expect(screen.getByText("Frontier")).toBeInTheDocument()
    expect(screen.getByText("Memo")).toBeInTheDocument()
    expect(screen.getByText("Tree")).toBeInTheDocument()
    expect(screen.getByText("Graph")).toBeInTheDocument()
    expect(screen.getByText("Execution")).toBeInTheDocument()
    expect(screen.getAllByText("Code Trace")).toHaveLength(1)
    expect(screen.getByText("Narration")).toBeInTheDocument()
    expect(screen.getByText("dfs(3)")).toBeInTheDocument()
    expect(screen.getByText("front")).toBeInTheDocument()
    expect(screen.getAllByText("A").length).toBeGreaterThan(1)
    expect(screen.getByText("?")).toBeInTheDocument()
    expect(screen.getByText("return mid")).toBeInTheDocument()
  })

  it("produces deterministic structural and execution tree layouts", () => {
    const structural = layoutTree([
      { id: "root" },
      { id: "left", parentId: "root" },
      { id: "right", parentId: "root" },
    ])
    const execution = layoutCallTree([
      { id: "root" },
      { id: "child", parentId: "root" },
    ])

    expect(structural.nodes.map((node) => node.id)).toEqual([
      "root",
      "left",
      "right",
    ])
    expect(structural.edges).toHaveLength(2)
    expect(execution.nodes[1]?.y).toBeGreaterThan(execution.nodes[0]?.y ?? 0)
  })
})
