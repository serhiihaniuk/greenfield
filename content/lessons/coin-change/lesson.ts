import {
  defineApproachDefinition,
  defineLessonDefinition,
} from "@/domains/lessons/types"

import { memoDfsCoinChangeCodeTemplate } from "./approaches/memo-dfs/code"
import { memoDfsCoinChangeNotes } from "./approaches/memo-dfs/notes"
import { projectMemoDfsCoinChange } from "./approaches/memo-dfs/project"
import {
  parseCoinChangeInput,
  traceMemoDfsCoinChange,
} from "./approaches/memo-dfs/trace"
import { verifyMemoDfsCoinChange } from "./approaches/memo-dfs/verify"
import { coinChangePresets } from "./presets"

const memoDfsApproach = defineApproachDefinition({
  id: "memo-dfs",
  label: "Memo DFS",
  codeTemplate: memoDfsCoinChangeCodeTemplate,
  parseInput: parseCoinChangeInput,
  presets: coinChangePresets,
  requiredViews: [
    {
      id: "execution-tree",
      primitive: "call-tree",
      role: "primary",
      title: "Execution Tree",
    },
    {
      id: "call-stack",
      primitive: "stack",
      role: "secondary",
      title: "Call Stack",
    },
    {
      id: "memo-table",
      primitive: "hash-map",
      role: "secondary",
      title: "Memo Table",
    },
  ],
  trace: traceMemoDfsCoinChange,
  project: projectMemoDfsCoinChange,
  verify: (events, frames) =>
    verifyMemoDfsCoinChange(memoDfsCoinChangeCodeTemplate, events, frames),
})

export const coinChangeLesson = defineLessonDefinition({
  id: "coin-change",
  slug: "coin-change",
  title: "Coin Change Memo DFS",
  confusionType: "memoization-reuse",
  shortPatternNote: memoDfsCoinChangeNotes.shortPatternNote,
  approaches: [memoDfsApproach],
  defaultApproachId: memoDfsApproach.id,
  defaultMode: "focus",
  viewportContract: {
    desktopMinWidth: 1366,
    desktopMinHeight: 768,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})
