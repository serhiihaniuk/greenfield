import { describe, expect, it } from "vitest"

import { defineFrame, type Frame } from "@/domains/projection/types"
import {
  defineStatePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import { buildPlainCodePresentation } from "@/features/player/code-presentation"
import { decorateCodePresentationWithExecutionTokens } from "@/features/player/code-trace-tokens"
import type { CodeTemplate } from "@/domains/lessons/types"

const template: CodeTemplate = {
  language: "typescript",
  entryLine: "line-1",
  lines: [
    { id: "line-1", lineNumber: 1, text: "const lo = 0", highlightable: true },
    { id: "line-2", lineNumber: 2, text: "return lo" },
  ],
}

describe("buildPlainCodePresentation", () => {
  it("preserves code lines as visible plain-text tokens", () => {
    const presentation = buildPlainCodePresentation(template)

    expect(presentation.themeName).toBe("plain")
    expect(presentation.lines).toHaveLength(2)
    expect(presentation.lines[0]?.tokens).toEqual([{ content: "const lo = 0" }])
    expect(presentation.lines[1]?.tokens).toEqual([{ content: "return lo" }])
  })

  it("decorates the active code line with execution tokens from the current frame", () => {
    const presentation = buildPlainCodePresentation(template)
    const frame: Frame = defineFrame({
      id: "frame-1",
      sourceEventId: "event-1",
      codeLine: "line-1",
      visualChangeType: "move",
      narration: {
        summary: "Move lo.",
        segments: [],
        sourceValues: {},
      },
      primitives: [
        defineStatePrimitiveFrameState({
          id: "state",
          kind: "state",
          title: "State",
          data: {
            values: [
              {
                label: "lo",
                value: 0,
                tokenId: "lo",
                tokenStyle: "accent-1",
              },
            ],
          },
        }),
      ],
      checks: [],
    })

    const decorated = decorateCodePresentationWithExecutionTokens(
      presentation,
      frame
    )

    expect(
      decorated?.lines[0]?.tokens.some(
        (token) => token.content === "lo" && token.tokenId === "lo"
      )
    ).toBe(true)
    expect(
      decorated?.lines[1]?.tokens.some((token) => token.tokenId === "lo")
    ).toBe(false)
  })
})
