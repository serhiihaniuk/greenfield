import {
  defineApproachDefinition,
  defineLessonDefinition,
} from "@/domains/lessons/types"
import { toRequiredViews } from "@/domains/lessons/view-specs"

import { memoDfsCoinChangeCodeTemplate } from "./approaches/memo-dfs/code"
import { memoDfsCoinChangeNotes } from "./approaches/memo-dfs/notes"
import { projectMemoDfsCoinChange } from "./approaches/memo-dfs/project"
import {
  parseCoinChangeInput,
  traceMemoDfsCoinChange,
} from "./approaches/memo-dfs/trace"
import { verifyMemoDfsCoinChange } from "./approaches/memo-dfs/verify"
import { memoDfsCoinChangeViewSpecs } from "./approaches/memo-dfs/views"
import { coinChangePresets } from "./presets"

const memoDfsApproach = defineApproachDefinition({
  id: "memo-dfs",
  label: "Memo DFS",
  codeTemplate: memoDfsCoinChangeCodeTemplate,
  parseInput: parseCoinChangeInput,
  presets: coinChangePresets,
  requiredViews: toRequiredViews(memoDfsCoinChangeViewSpecs),
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
  defaultMode: "full",
  viewportContract: {
    desktopMinWidth: 1366,
    desktopMinHeight: 768,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})
