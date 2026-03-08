import {
  defineApproachDefinition,
  defineLessonDefinition,
} from "@/domains/lessons/types"

import { iterativeStackTreeDfsCodeTemplate } from "./approaches/iterative-stack/code"
import { iterativeStackTreeDfsNotes } from "./approaches/iterative-stack/notes"
import { projectIterativeStackTreeDfs } from "./approaches/iterative-stack/project"
import {
  parseTreeDfsTraversalInput,
  traceIterativeStackTreeDfs,
} from "./approaches/iterative-stack/trace"
import { verifyIterativeStackTreeDfs } from "./approaches/iterative-stack/verify"
import { treeDfsTraversalPresets } from "./presets"

const iterativeStackApproach = defineApproachDefinition({
  id: "iterative-stack",
  label: "Iterative Stack",
  codeTemplate: iterativeStackTreeDfsCodeTemplate,
  parseInput: parseTreeDfsTraversalInput,
  presets: treeDfsTraversalPresets,
  requiredViews: [
    {
      id: "tree",
      primitive: "tree",
      role: "primary",
      title: "Traversal Tree",
    },
    {
      id: "dfs-stack",
      primitive: "stack",
      role: "secondary",
      title: "DFS Stack",
    },
    {
      id: "visit-order",
      primitive: "sequence",
      role: "secondary",
      title: "Visit Order",
    },
  ],
  trace: traceIterativeStackTreeDfs,
  project: projectIterativeStackTreeDfs,
  verify: (events, frames) =>
    verifyIterativeStackTreeDfs(
      iterativeStackTreeDfsCodeTemplate,
      events,
      frames
    ),
})

export const treeDfsTraversalLesson = defineLessonDefinition({
  id: "tree-dfs-traversal",
  slug: "tree-dfs-traversal",
  title: "Tree DFS Traversal with Stack",
  confusionType: "stack-execution",
  shortPatternNote: iterativeStackTreeDfsNotes.shortPatternNote,
  approaches: [iterativeStackApproach],
  defaultApproachId: iterativeStackApproach.id,
  defaultMode: "focus",
  viewportContract: {
    desktopMinWidth: 1366,
    desktopMinHeight: 768,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})
