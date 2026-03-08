import { createLessonRegistry } from "@/domains/lessons/registry"
import type { AnyLessonDefinition } from "@/domains/lessons/types"
import { binarySearchLesson } from "./binary-search/lesson"
import { coinChangeLesson } from "./coin-change/lesson"
import { graphBfsLesson } from "./graph-bfs/lesson"
import { heapTopKLesson } from "./heap-top-k/lesson"
import { houseRobberLesson } from "./house-robber/lesson"
import { maximumDepthLesson } from "./maximum-depth/lesson"
import { slidingWindowMaximumLesson } from "./sliding-window-maximum/lesson"
import { treeDfsTraversalLesson } from "./tree-dfs-traversal/lesson"

export const lessonDefinitions: AnyLessonDefinition[] = [
  binarySearchLesson,
  coinChangeLesson,
  graphBfsLesson,
  heapTopKLesson,
  houseRobberLesson,
  maximumDepthLesson,
  slidingWindowMaximumLesson,
  treeDfsTraversalLesson,
]

export const lessonRegistry = createLessonRegistry(lessonDefinitions)
