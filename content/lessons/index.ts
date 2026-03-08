import { createLessonRegistry } from "@/domains/lessons/registry"
import type { AnyLessonDefinition } from "@/domains/lessons/types"
import { binarySearchLesson } from "./binary-search/lesson"
import { houseRobberLesson } from "./house-robber/lesson"
import { maximumDepthLesson } from "./maximum-depth/lesson"

export const lessonDefinitions: AnyLessonDefinition[] = [
  binarySearchLesson,
  houseRobberLesson,
  maximumDepthLesson,
]

export const lessonRegistry = createLessonRegistry(lessonDefinitions)
