import {
  defineApproachDefinition,
  defineLessonDefinition,
} from "@/domains/lessons/types"

import { queueBfsCodeTemplate } from "./approaches/queue-bfs/code"
import { queueBfsNotes } from "./approaches/queue-bfs/notes"
import { projectQueueBfs } from "./approaches/queue-bfs/project"
import { parseGraphBfsInput, traceQueueBfs } from "./approaches/queue-bfs/trace"
import { verifyQueueBfs } from "./approaches/queue-bfs/verify"
import { graphBfsPresets } from "./presets"

const queueBfsApproach = defineApproachDefinition({
  id: "queue-bfs",
  label: "Queue BFS",
  codeTemplate: queueBfsCodeTemplate,
  parseInput: parseGraphBfsInput,
  presets: graphBfsPresets,
  requiredViews: [
    {
      id: "graph",
      primitive: "graph",
      role: "primary",
      title: "Graph Frontier",
    },
    {
      id: "frontier-queue",
      primitive: "queue",
      role: "secondary",
      title: "Frontier Queue",
    },
    {
      id: "frontier-state",
      primitive: "state",
      role: "secondary",
      title: "Traversal State",
    },
  ],
  trace: traceQueueBfs,
  project: projectQueueBfs,
  verify: (events, frames) =>
    verifyQueueBfs(queueBfsCodeTemplate, events, frames),
})

export const graphBfsLesson = defineLessonDefinition({
  id: "graph-bfs",
  slug: "graph-bfs",
  title: "Graph BFS Frontier",
  confusionType: "frontier-traversal",
  shortPatternNote: queueBfsNotes.shortPatternNote,
  approaches: [queueBfsApproach],
  defaultApproachId: queueBfsApproach.id,
  defaultMode: "full",
  viewportContract: {
    desktopMinWidth: 1366,
    desktopMinHeight: 768,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})
