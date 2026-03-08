import { defineApproachDefinition, defineLessonDefinition } from "@/domains/lessons/types"

import { rollingDpHouseRobberCodeTemplate } from "./approaches/rolling-dp/code"
import {
  parseHouseRobberInput,
  traceRollingDpHouseRobber,
} from "./approaches/rolling-dp/trace"
import { projectRollingDpHouseRobber } from "./approaches/rolling-dp/project"
import { verifyRollingDpHouseRobber } from "./approaches/rolling-dp/verify"
import { rollingDpHouseRobberNotes } from "./approaches/rolling-dp/notes"
import { houseRobberPresets } from "./presets"

const rollingDpApproach = defineApproachDefinition({
  id: "rolling-dp",
  label: "Rolling DP",
  codeTemplate: rollingDpHouseRobberCodeTemplate,
  parseInput: parseHouseRobberInput,
  presets: houseRobberPresets,
  requiredViews: [
    {
      id: "houses",
      primitive: "array",
      role: "primary",
      title: "House Values",
    },
    {
      id: "rolling-state",
      primitive: "state",
      role: "secondary",
      title: "DP State",
    },
    {
      id: "code-trace",
      primitive: "code-trace",
      role: "secondary",
      title: "Code Trace",
    },
  ],
  trace: traceRollingDpHouseRobber,
  project: projectRollingDpHouseRobber,
  verify: (events, frames) =>
    verifyRollingDpHouseRobber(rollingDpHouseRobberCodeTemplate, events, frames),
})

export const houseRobberLesson = defineLessonDefinition({
  id: "house-robber",
  slug: "house-robber",
  title: "House Robber",
  confusionType: "state-transition",
  shortPatternNote: rollingDpHouseRobberNotes.shortPatternNote,
  approaches: [rollingDpApproach],
  defaultApproachId: rollingDpApproach.id,
  defaultMode: "focus",
  viewportContract: {
    desktopMinWidth: 1280,
    desktopMinHeight: 720,
    avoidVerticalScroll: true,
    preferredLayout: "canvas-with-side-panels",
    maxVisibleSecondaryPanels: 2,
  },
})