import { createLessonRegistry } from "@/domains/lessons/registry"
import type { AnyLessonDefinition } from "@/domains/lessons/types"
import { binarySearchLesson } from "./binary-search/lesson"
import { houseRobberLesson } from "./house-robber/lesson"

export const lessonDefinitions: AnyLessonDefinition[] = [
  binarySearchLesson,
  houseRobberLesson,
]

export const lessonRegistry = createLessonRegistry(lessonDefinitions)