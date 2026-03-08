import { createLessonRegistry } from "@/domains/lessons/registry"
import type { AnyLessonDefinition } from "@/domains/lessons/types"
import { binarySearchLesson } from "./binary-search/lesson"
import { graphBfsLesson } from "./graph-bfs/lesson"
import { houseRobberLesson } from "./house-robber/lesson"
import { maximumDepthLesson } from "./maximum-depth/lesson"
import { slidingWindowMaximumLesson } from "./sliding-window-maximum/lesson"

export const lessonDefinitions: AnyLessonDefinition[] = [
  binarySearchLesson,
  graphBfsLesson,
  houseRobberLesson,
  maximumDepthLesson,
  slidingWindowMaximumLesson,
]

export const lessonRegistry = createLessonRegistry(lessonDefinitions)
