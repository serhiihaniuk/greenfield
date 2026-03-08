import { describe, expect, it } from "vitest"

import {
  createLessonRegistry,
  getLessonById,
  getLessonBySlug,
} from "@/domains/lessons/registry"
import {
  defineApproachDefinition,
  defineLessonDefinition,
  type LessonDefinition,
} from "@/domains/lessons/types"
import { createVerificationReport } from "@/domains/verification/types"

const baseApproach = defineApproachDefinition({
  id: "iterative",
  label: "Iterative",
  codeTemplate: {
    language: "typescript",
    entryLine: "L1",
    lines: [
      {
        id: "L1",
        lineNumber: 1,
        text: "return input.n",
      },
    ],
  },
  parseInput: (raw) => ({ n: Number(raw) }),
  presets: [
    {
      id: "small",
      label: "Small",
      rawInput: "3",
    },
  ],
  requiredViews: [
    {
      id: "state",
      primitive: "state",
      role: "primary",
    },
  ],
  trace: () => [
    {
      id: "event-1",
      type: "start",
      codeLine: "L1",
      payload: {},
      snapshot: {},
    },
  ],
  project: () => [
    {
      id: "frame-1",
      sourceEventId: "event-1",
      codeLine: "L1",
      visualChangeType: "result",
      narration: {
        summary: "Return the parsed value.",
        segments: [],
        sourceValues: {},
      },
      primitives: [],
      checks: [],
    },
  ],
  verify: () => createVerificationReport([]),
})

function createLesson(
  overrides: Partial<LessonDefinition<{ n: number }>> = {}
): LessonDefinition<{ n: number }> {
  return defineLessonDefinition({
    id: "binary-search",
    slug: "binary-search",
    title: "Binary Search",
    confusionType: "pointer-state",
    shortPatternNote: "Shrink the sorted search interval around the target.",
    approaches: [baseApproach],
    defaultApproachId: "iterative",
    defaultMode: "focus",
    viewportContract: {
      desktopMinWidth: 1280,
      desktopMinHeight: 720,
      avoidVerticalScroll: true,
      preferredLayout: "canvas-with-side-panels",
      maxVisibleSecondaryPanels: 2,
    },
    ...overrides,
  })
}

describe("createLessonRegistry", () => {
  it("indexes lessons by id and slug", () => {
    const lesson = createLesson()
    const registry = createLessonRegistry([lesson])

    expect(registry.all).toHaveLength(1)
    expect(getLessonById(registry, lesson.id)).toBe(lesson)
    expect(getLessonBySlug(registry, lesson.slug)).toBe(lesson)
  })

  it("rejects duplicate lesson ids", () => {
    const first = createLesson()
    const second = createLesson({ slug: "binary-search-alt" })

    expect(() => createLessonRegistry([first, second])).toThrow(
      /duplicate lesson id/i
    )
  })

  it("rejects duplicate lesson slugs", () => {
    const first = createLesson()
    const second = createLesson({ id: "binary-search-2" })

    expect(() => createLessonRegistry([first, second])).toThrow(
      /duplicate lesson slug/i
    )
  })
})
