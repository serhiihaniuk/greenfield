import {
  defineApproachDefinition,
  defineLessonDefinition,
} from "@/domains/lessons/types"

import { minHeapTopKCodeTemplate } from "./approaches/min-heap/code"
import { minHeapTopKNotes } from "./approaches/min-heap/notes"
import { projectMinHeapTopK } from "./approaches/min-heap/project"
import {
  parseHeapTopKInput,
  traceMinHeapTopK,
} from "./approaches/min-heap/trace"
import { verifyMinHeapTopK } from "./approaches/min-heap/verify"
import { heapTopKPresets } from "./presets"

const minHeapApproach = defineApproachDefinition({
  id: "min-heap",
  label: "Min Heap",
  codeTemplate: minHeapTopKCodeTemplate,
  parseInput: parseHeapTopKInput,
  presets: heapTopKPresets,
  requiredViews: [
    {
      id: "min-heap",
      primitive: "tree",
      role: "primary",
      title: "Min Heap",
    },
    {
      id: "input-array",
      primitive: "array",
      role: "secondary",
      title: "Input Scan",
    },
    {
      id: "heap-state",
      primitive: "state",
      role: "secondary",
      title: "Top-K State",
    },
  ],
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
