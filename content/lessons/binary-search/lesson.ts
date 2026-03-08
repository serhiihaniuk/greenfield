import { defineApproachDefinition, defineLessonDefinition } from "@/domains/lessons/types"

import { iterativeBinarySearchCodeTemplate } from "./approaches/iterative/code"
import {
  parseBinarySearchInput,
  traceIterativeBinarySearch,
} from "./approaches/iterative/trace"
import { projectIterativeBinarySearch } from "./approaches/iterative/project"
import { verifyIterativeBinarySearch } from "./approaches/iterative/verify"
import { iterativeBinarySearchNotes } from "./approaches/iterative/notes"
import { binarySearchPresets } from "./presets"

const iterativeApproach = defineApproachDefinition({
  id: "iterative",
  label: "Iterative",
  codeTemplate: iterativeBinarySearchCodeTemplate,
  parseInput: parseBinarySearchInput,
  presets: binarySearchPresets,
  requiredViews: [
    {
      id: "search-interval",
      primitive: "array",
      role: "primary",
      title: "Search Interval",
    },
    {
      id: "state",
      primitive: "state",
      role: "secondary",
      title: "Active Variables",
    },
    {
      id: "code-trace",
      primitive: "code-trace",
      role: "secondary",
      title: "Code Trace",
    },
  ],
  trace: traceIterativeBinarySearch,
  project: projectIterativeBinarySearch,
  verify: (events, frames) =>
    verifyIterativeBinarySearch(iterativeBinarySearchCodeTemplate, events, frames),
})

export const binarySearchLesson = defineLessonDefinition({
  id: "binary-search",
  slug: "binary-search",
  title: "Binary Search",
  confusionType: "pointer-state",
  shortPatternNote: iterativeBinarySearchNotes.shortPatternNote,
  approaches: [iterativeApproach],
  defaultApproachId: iterativeApproach.id,
  defaultMode: "focus",
  viewportContract: {
    desktopMinWidth: 1280,
    desktopMinHeight: 720,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})
