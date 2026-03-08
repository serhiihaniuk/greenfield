import { createLessonRegistry } from "@/domains/lessons/registry"
import type { AnyLessonDefinition } from "@/domains/lessons/types"
import { binarySearchLesson } from "./binary-search/lesson"

export const lessonDefinitions: AnyLessonDefinition[] = [binarySearchLesson]

export const lessonRegistry = createLessonRegistry(lessonDefinitions)
