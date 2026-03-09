import { lessonRegistry } from "../../../content/lessons"

import { getLessonById, getLessonBySlug } from "@/domains/lessons/registry"
import type {
  AnyLessonDefinition,
  ApproachDefinition,
  PresetDefinition,
} from "@/domains/lessons/types"

export function listLessons(): AnyLessonDefinition[] {
  return lessonRegistry.all
}

export function getDefaultLesson(): AnyLessonDefinition {
  const firstLesson = lessonRegistry.all[0]

  if (!firstLesson) {
    throw new Error("No lessons are registered.")
  }

  return firstLesson
}

export function getDefaultLessonSlug() {
  return getDefaultLesson().slug
}

export function hasLessonSlug(slug: string) {
  return lessonRegistry.bySlug.has(slug)
}

export function resolveLesson(lessonIdOrSlug?: string): AnyLessonDefinition {
  if (!lessonIdOrSlug) {
    return getDefaultLesson()
  }

  return lessonRegistry.byId.has(lessonIdOrSlug)
    ? getLessonById(lessonRegistry, lessonIdOrSlug)
    : getLessonBySlug(lessonRegistry, lessonIdOrSlug)
}

export function resolveApproach(
  lesson: AnyLessonDefinition,
  approachId?: string
): ApproachDefinition {
  const resolvedApproachId = approachId ?? lesson.defaultApproachId
  const approach = lesson.approaches.find(
    (candidate) => candidate.id === resolvedApproachId
  )

  if (!approach) {
    throw new Error(
      `Unknown approach "${resolvedApproachId}" for lesson "${lesson.id}".`
    )
  }

  return approach
}

export function resolvePreset(
  approach: ApproachDefinition,
  presetId?: string
): PresetDefinition | undefined {
  if (!presetId) {
    return approach.presets[0]
  }

  return approach.presets.find((preset) => preset.id === presetId)
}
