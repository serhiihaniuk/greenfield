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
        role: "secondary",
        title: "Memo Table",
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
        role: "secondary",
        title: "Memo Table",
      },
    ])

    expect(getLessonViewSpec(viewSpecs, "execution-tree").viewport).toEqual({
      role: "primary",
      preferredWidth: 960,
      minHeight: 360,
    })
  })
})
