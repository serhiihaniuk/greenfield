import { describe, expect, it } from "vitest"

import {
  defineLessonViewSpecs,
  getLessonViewSpec,
  toRequiredViews,
} from "@/domains/lessons/view-specs"

describe("lesson view specs", () => {
  it("reuses one definition for required views and viewport metadata", () => {
    const viewSpecs = defineLessonViewSpecs([
      {
        id: "execution-tree",
        primitive: "call-tree",
        role: "primary",
        title: "Execution Tree",
        viewport: {
          role: "primary",
          preferredWidth: 960,
          minHeight: 360,
        },
      },
      {
        id: "memo-table",
        primitive: "hash-map",
        role: "co-primary",
        title: "Memo Table",
        viewport: {
          role: "co-primary",
          preferredWidth: 360,
          minHeight: 200,
        },
      },
      {
        id: "memo-state",
        primitive: "state",
        role: "support",
        title: "Memo State",
      },
    ] as const)

    expect(toRequiredViews(viewSpecs)).toEqual([
      {
        id: "execution-tree",
        primitive: "call-tree",
        role: "primary",
        title: "Execution Tree",
      },
      {
        id: "memo-table",
        primitive: "hash-map",
        role: "co-primary",
        title: "Memo Table",
      },
      {
        id: "memo-state",
        primitive: "state",
        role: "support",
        title: "Memo State",
      },
    ])

    expect(getLessonViewSpec(viewSpecs, "execution-tree").viewport).toEqual({
      role: "primary",
      preferredWidth: 960,
      minHeight: 360,
    })
    expect(getLessonViewSpec(viewSpecs, "memo-table").viewport).toEqual({
      role: "co-primary",
      preferredWidth: 360,
      minHeight: 200,
    })
  })
})
