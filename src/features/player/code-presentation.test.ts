import { describe, expect, it } from "vitest"

import { buildPlainCodePresentation } from "@/features/player/code-presentation"
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
})
