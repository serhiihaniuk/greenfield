import { render, screen } from "@testing-library/react"

import {
  defineGraphPrimitiveFrameState,
  defineQueuePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import { PrimitiveRenderer } from "@/shared/visualization/primitive-renderer"

describe("execution token projections", () => {
  it("renders shared execution tokens on graph nodes and queue items", () => {
    const graphPrimitive = defineGraphPrimitiveFrameState({
      id: "graph",
      kind: "graph",
      title: "Graph",
      data: {
        nodes: [
          {
            id: "a",
            label: "A",
            tokenId: "current",
            tokenLabel: "current",
            tokenStyle: "accent-1",
            x: 80,
            y: 80,
            status: "active",
          },
          {
            id: "b",
            label: "B",
            tokenId: "neighbor",
            tokenLabel: "neighbor",
            tokenStyle: "accent-3",
            x: 200,
            y: 160,
            status: "frontier",
          },
        ],
        edges: [{ id: "a-b", sourceId: "a", targetId: "b" }],
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
          {
            id: "q1",
            label: "A",
            tokenId: "current",
            tokenLabel: "current",
            tokenStyle: "accent-1",
            status: "active",
          },
          {
            id: "q2",
            label: "B",
            tokenId: "neighbor",
            tokenLabel: "neighbor",
            tokenStyle: "accent-3",
            status: "waiting",
          },
        ],
      },
    })

    render(
      <div>
        <PrimitiveRenderer primitive={graphPrimitive} />
        <PrimitiveRenderer primitive={queuePrimitive} />
      </div>
    )

    expect(screen.getAllByText("current")).toHaveLength(2)
    expect(screen.getAllByText("neighbor")).toHaveLength(2)
    expect(
      screen
        .getAllByText("current")
        .some(
          (node) =>
            node.closest("[data-token-id]")?.getAttribute("data-token-id") ===
            "current"
        )
    ).toBe(true)
    expect(
      screen
        .getAllByText("neighbor")
        .some(
          (node) =>
            node.closest("[data-token-id]")?.getAttribute("data-token-id") ===
            "neighbor"
        )
    ).toBe(true)
  })
})
