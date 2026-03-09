import {
  defineApproachDefinition,
  defineLessonDefinition,
} from "@/domains/lessons/types"
import { toRequiredViews } from "@/domains/lessons/view-specs"

import { minHeapTopKCodeTemplate } from "./approaches/min-heap/code"
import { minHeapTopKNotes } from "./approaches/min-heap/notes"
import { projectMinHeapTopK } from "./approaches/min-heap/project"
import {
  parseHeapTopKInput,
  traceMinHeapTopK,
} from "./approaches/min-heap/trace"
import { verifyMinHeapTopK } from "./approaches/min-heap/verify"
import { minHeapTopKViewSpecs } from "./approaches/min-heap/views"
import { heapTopKPresets } from "./presets"

const minHeapApproach = defineApproachDefinition({
  id: "min-heap",
  label: "Min Heap",
  codeTemplate: minHeapTopKCodeTemplate,
  parseInput: parseHeapTopKInput,
  presets: heapTopKPresets,
  requiredViews: toRequiredViews(minHeapTopKViewSpecs),
  trace: traceMinHeapTopK,
  project: projectMinHeapTopK,
  verify: (events, frames) =>
    verifyMinHeapTopK(minHeapTopKCodeTemplate, events, frames),
})

export const heapTopKLesson = defineLessonDefinition({
  id: "heap-top-k",
  slug: "heap-top-k",
  title: "Top K Largest with Min Heap",
  confusionType: "priority-structure",
  shortPatternNote: minHeapTopKNotes.shortPatternNote,
  approaches: [minHeapApproach],
  defaultApproachId: minHeapApproach.id,
  defaultMode: "full",
  viewportContract: {
    desktopMinWidth: 1366,
    desktopMinHeight: 768,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})
