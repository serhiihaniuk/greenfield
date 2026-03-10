import { describe, expect, it } from "vitest"

import {
  defineStructuredNarration,
  flattenNarrationSegments,
  narrationText,
} from "@/domains/projection/narration"

describe("defineStructuredNarration", () => {
  it("derives summary text from the headline and keeps structured clauses", () => {
    const payload = defineStructuredNarration({
      family: "compare",
      headline: [
        narrationText("h0", "Compare "),
        narrationText("h1", "mid"),
        narrationText("h2", " with target."),
      ],
      reason: "This decides which half survives.",
      implication: "The next frame can safely prune one side.",
      sourceValues: {
        mid: 2,
      },
    })

    expect(payload.summary).toBe("Compare mid with target.")
    expect(payload.headline?.segments).toHaveLength(3)
    expect(payload.reason?.segments[0]?.text).toBe(
      "This decides which half survives."
    )
    expect(payload.implication?.segments[0]?.text).toBe(
      "The next frame can safely prune one side."
    )
  })

  it("flattens headline, reason, and implication segments into one token-aware stream", () => {
    const payload = defineStructuredNarration({
      headline: [
        {
          id: "headline-mid",
          text: "mid",
          tokenId: "mid",
          tokenStyle: "accent-3",
        },
      ],
      reason: "because nums[mid] is too large",
      implication: "so the right half is gone",
    })

    expect(flattenNarrationSegments(payload).map((segment) => segment.id)).toEqual(
      ["headline-mid", "reason", "implication"]
    )
    expect(flattenNarrationSegments(payload).some((segment) => segment.tokenId === "mid")).toBe(
      true
    )
  })
})
