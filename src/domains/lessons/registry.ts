import type { AnyLessonDefinition } from "@/domains/lessons/types"

export interface LessonRegistry {
  readonly all: AnyLessonDefinition[]
  readonly byId: ReadonlyMap<string, AnyLessonDefinition>
  readonly bySlug: ReadonlyMap<string, AnyLessonDefinition>
}

export function createLessonRegistry(
  lessons: AnyLessonDefinition[]
): LessonRegistry {
  const byId = new Map<string, AnyLessonDefinition>()
  const bySlug = new Map<string, AnyLessonDefinition>()

  for (const lesson of lessons) {
    if (byId.has(lesson.id)) {
      throw new Error(`Duplicate lesson id "${lesson.id}" in registry.`)
    }

    if (bySlug.has(lesson.slug)) {
      throw new Error(`Duplicate lesson slug "${lesson.slug}" in registry.`)
    }

    const defaultApproach = lesson.approaches.find(
      (approach) => approach.id === lesson.defaultApproachId
    )

    if (!defaultApproach) {
      throw new Error(
        `Lesson "${lesson.id}" default approach "${lesson.defaultApproachId}" is missing.`
      )
    }

    byId.set(lesson.id, lesson)
    bySlug.set(lesson.slug, lesson)
  }

  return {
    all: lessons,
    byId,
    bySlug,
  }
}

export function getLessonById(
  registry: LessonRegistry,
  lessonId: string
): AnyLessonDefinition {
  const lesson = registry.byId.get(lessonId)

  if (!lesson) {
    throw new Error(`Unknown lesson id "${lessonId}".`)
  }

  return lesson
}

export function getLessonBySlug(
  registry: LessonRegistry,
  slug: string
): AnyLessonDefinition {
  const lesson = registry.bySlug.get(slug)

  if (!lesson) {
    throw new Error(`Unknown lesson slug "${slug}".`)
  }

  return lesson
}
