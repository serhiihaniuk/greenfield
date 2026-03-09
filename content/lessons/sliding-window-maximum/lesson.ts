import {
  defineApproachDefinition,
  defineLessonDefinition,
} from "@/domains/lessons/types"
import { toRequiredViews } from "@/domains/lessons/view-specs"

import { monotonicDequeSlidingWindowMaximumCodeTemplate } from "./approaches/monotonic-deque/code"
import { monotonicDequeSlidingWindowMaximumNotes } from "./approaches/monotonic-deque/notes"
import { projectMonotonicDequeSlidingWindowMaximum } from "./approaches/monotonic-deque/project"
import {
  parseSlidingWindowMaximumInput,
  traceMonotonicDequeSlidingWindowMaximum,
} from "./approaches/monotonic-deque/trace"
import { verifyMonotonicDequeSlidingWindowMaximum } from "./approaches/monotonic-deque/verify"
import { monotonicDequeSlidingWindowViewSpecs } from "./approaches/monotonic-deque/views"
import { slidingWindowMaximumPresets } from "./presets"

const monotonicDequeApproach = defineApproachDefinition({
  id: "monotonic-deque",
  label: "Monotonic Deque",
  codeTemplate: monotonicDequeSlidingWindowMaximumCodeTemplate,
  parseInput: parseSlidingWindowMaximumInput,
  presets: slidingWindowMaximumPresets,
  requiredViews: toRequiredViews(monotonicDequeSlidingWindowViewSpecs),
  trace: traceMonotonicDequeSlidingWindowMaximum,
  project: projectMonotonicDequeSlidingWindowMaximum,
  verify: (events, frames) =>
    verifyMonotonicDequeSlidingWindowMaximum(
      monotonicDequeSlidingWindowMaximumCodeTemplate,
      events,
      frames
    ),
})

export const slidingWindowMaximumLesson = defineLessonDefinition({
  id: "sliding-window-maximum",
  slug: "sliding-window-maximum",
  title: "Sliding Window Maximum",
  confusionType: "state-transition",
  shortPatternNote: monotonicDequeSlidingWindowMaximumNotes.shortPatternNote,
  approaches: [monotonicDequeApproach],
  defaultApproachId: monotonicDequeApproach.id,
  defaultMode: "full",
  viewportContract: {
    desktopMinWidth: 1366,
    desktopMinHeight: 768,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})
