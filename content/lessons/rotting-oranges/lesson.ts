import {
  defineApproachDefinition,
  defineLessonDefinition,
} from "@/domains/lessons/types"
import { toRequiredViews } from "@/domains/lessons/view-specs"

import { multiSourceBfsCodeTemplate } from "./approaches/multi-source-bfs/code"
import { multiSourceBfsNotes } from "./approaches/multi-source-bfs/notes"
import { projectMultiSourceBfs } from "./approaches/multi-source-bfs/project"
import {
  parseRottingOrangesInput,
  traceMultiSourceBfs,
} from "./approaches/multi-source-bfs/trace"
import { verifyMultiSourceBfs } from "./approaches/multi-source-bfs/verify"
import { multiSourceBfsViewSpecs } from "./approaches/multi-source-bfs/views"
import { rottingOrangesPresets } from "./presets"

const multiSourceBfsApproach = defineApproachDefinition({
  id: "multi-source-bfs",
  label: "Multi-Source BFS",
  codeTemplate: multiSourceBfsCodeTemplate,
  parseInput: parseRottingOrangesInput,
  presets: rottingOrangesPresets,
  requiredViews: toRequiredViews(multiSourceBfsViewSpecs),
  trace: traceMultiSourceBfs,
  project: projectMultiSourceBfs,
  verify: (events, frames) =>
    verifyMultiSourceBfs(multiSourceBfsCodeTemplate, events, frames),
})

export const rottingOrangesLesson = defineLessonDefinition({
  id: "rotting-oranges",
  slug: "rotting-oranges",
  title: "Rotting Oranges",
  confusionType: "frontier-traversal",
  shortPatternNote: multiSourceBfsNotes.shortPatternNote,
  approaches: [multiSourceBfsApproach],
  defaultApproachId: multiSourceBfsApproach.id,
  defaultMode: "full",
  viewportContract: {
    desktopMinWidth: 1366,
    desktopMinHeight: 768,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})
