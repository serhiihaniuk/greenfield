import {
  defineApproachDefinition,
  defineLessonDefinition,
} from "@/domains/lessons/types"

import { recursiveMaximumDepthCodeTemplate } from "./approaches/recursive-dfs/code"
import {
  parseMaximumDepthInput,
  traceRecursiveMaximumDepth,
} from "./approaches/recursive-dfs/trace"
import { projectRecursiveMaximumDepth } from "./approaches/recursive-dfs/project"
import { verifyRecursiveMaximumDepth } from "./approaches/recursive-dfs/verify"
import { recursiveMaximumDepthNotes } from "./approaches/recursive-dfs/notes"
import { maximumDepthPresets } from "./presets"

const recursiveDfsApproach = defineApproachDefinition({
  id: "recursive-dfs",
  label: "Recursive DFS",
  codeTemplate: recursiveMaximumDepthCodeTemplate,
  parseInput: parseMaximumDepthInput,
  presets: maximumDepthPresets,
  requiredViews: [
    {
      id: "tree",
      primitive: "tree",
      role: "primary",
      title: "Binary Tree",
    },
    {
      id: "call-stack",
      primitive: "stack",
      role: "secondary",
      title: "Call Stack",
    },
    {
      id: "execution-tree",
      primitive: "call-tree",
      role: "secondary",
      title: "Execution Tree",
    },
  ],
  trace: traceRecursiveMaximumDepth,
  project: projectRecursiveMaximumDepth,
  verify: (events, frames) =>
    verifyRecursiveMaximumDepth(
      recursiveMaximumDepthCodeTemplate,
      events,
      frames
    ),
})

export const maximumDepthLesson = defineLessonDefinition({
  id: "maximum-depth",
  slug: "maximum-depth",
  title: "Maximum Depth of Binary Tree",
  confusionType: "stack-execution",
  shortPatternNote: recursiveMaximumDepthNotes.shortPatternNote,
  approaches: [recursiveDfsApproach],
  defaultApproachId: recursiveDfsApproach.id,
  defaultMode: "full",
  viewportContract: {
    desktopMinWidth: 1366,
    desktopMinHeight: 768,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})
