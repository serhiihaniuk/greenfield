import {
  categoryLabels,
  confusionLabels,
  difficultyLabels,
  mechanismLabels,
  type CatalogEntry,
} from "@/domains/lessons/catalog"
import type {
  CatalogStatus,
  LessonCategory,
  LessonDifficulty,
  Mechanism,
} from "@/domains/lessons/catalog-types"
import { confusionTypeSchema, type ConfusionType } from "@/domains/lessons/types"

export interface CatalogFilterState {
  search: string
  categories: Set<LessonCategory>
  difficulties: Set<LessonDifficulty>
  mechanisms: Set<Mechanism>
  confusions: Set<ConfusionType>
}

export const emptyCatalogFilter: CatalogFilterState = {
  search: "",
  categories: new Set(),
  difficulties: new Set(),
  mechanisms: new Set(),
  confusions: new Set(),
}

export interface CatalogCountMaps {
  categories: Map<LessonCategory, number>
  difficulties: Map<LessonDifficulty, number>
  mechanisms: Map<Mechanism, number>
  confusions: Map<ConfusionType, number>
}

type CatalogQueryOptions = {
  visibleStatuses?: readonly CatalogStatus[]
  activeLessonId?: string
}

const confusionValues = [...confusionTypeSchema.options]

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function matchesOptionalSet<T>(value: T, active: Set<T>) {
  return active.size === 0 || active.has(value)
}

function matchesOptionalIntersection<T>(values: readonly T[], active: Set<T>) {
  return active.size === 0 || values.some((value) => active.has(value))
}

function matchesSearch(entry: CatalogEntry, search: string) {
  if (!search) {
    return true
  }

  const haystack = [
    entry.title,
    entry.summary,
    entry.shortPatternNote,
    categoryLabels[entry.category],
    difficultyLabels[entry.difficulty],
    confusionLabels[entry.confusionType],
    ...entry.mechanisms.map((mechanism) => mechanismLabels[mechanism]),
  ]
    .join(" ")
    .toLowerCase()

  return haystack.includes(search)
}

function compareEntries(
  left: CatalogEntry,
  right: CatalogEntry,
  activeLessonId?: string
) {
  const leftIsActive = left.id === activeLessonId
  const rightIsActive = right.id === activeLessonId

  if (leftIsActive !== rightIsActive) {
    return leftIsActive ? -1 : 1
  }

  if (left.featuredRank !== right.featuredRank) {
    return left.featuredRank - right.featuredRank
  }

  return left.title.localeCompare(right.title)
}

function filterVisibleEntries(
  entries: CatalogEntry[],
  visibleStatuses: readonly CatalogStatus[]
) {
  return entries.filter((entry) => visibleStatuses.includes(entry.status))
}

function runBaseFilter(
  entries: CatalogEntry[],
  filter: CatalogFilterState,
  visibleStatuses: readonly CatalogStatus[]
) {
  const normalizedSearch = normalizeSearch(filter.search)

  return filterVisibleEntries(entries, visibleStatuses).filter(
    (entry) =>
      matchesSearch(entry, normalizedSearch) &&
      matchesOptionalSet(entry.category, filter.categories) &&
      matchesOptionalSet(entry.difficulty, filter.difficulties) &&
      matchesOptionalIntersection(entry.mechanisms, filter.mechanisms) &&
      matchesOptionalSet(entry.confusionType, filter.confusions)
  )
}

function countBySingleOption<T extends string>(
  entries: CatalogEntry[],
  select: (entry: CatalogEntry) => T,
  options: readonly T[]
) {
  const counts = new Map<T, number>(options.map((option) => [option, 0]))

  for (const entry of entries) {
    const selected = select(entry)
    counts.set(selected, (counts.get(selected) ?? 0) + 1)
  }

  return counts
}

function countByManyOptions<T extends string>(
  entries: CatalogEntry[],
  select: (entry: CatalogEntry) => readonly T[],
  options: readonly T[]
) {
  const counts = new Map<T, number>(options.map((option) => [option, 0]))

  for (const entry of entries) {
    for (const selected of select(entry)) {
      counts.set(selected, (counts.get(selected) ?? 0) + 1)
    }
  }

  return counts
}

export function queryCatalog(
  entries: CatalogEntry[],
  filter: CatalogFilterState,
  options: CatalogQueryOptions = {}
) {
  const visibleStatuses = options.visibleStatuses ?? ["flagship"]

  return runBaseFilter(entries, filter, visibleStatuses).sort((left, right) =>
    compareEntries(left, right, options.activeLessonId)
  )
}

export function createCatalogCounts(
  entries: CatalogEntry[],
  filter: CatalogFilterState,
  options: CatalogQueryOptions = {}
): CatalogCountMaps {
  const visibleStatuses = options.visibleStatuses ?? ["flagship"]

  const withoutCategories = runBaseFilter(
    entries,
    { ...filter, categories: new Set() },
    visibleStatuses
  )
  const withoutDifficulties = runBaseFilter(
    entries,
    { ...filter, difficulties: new Set() },
    visibleStatuses
  )
  const withoutMechanisms = runBaseFilter(
    entries,
    { ...filter, mechanisms: new Set() },
    visibleStatuses
  )
  const withoutConfusions = runBaseFilter(
    entries,
    { ...filter, confusions: new Set() },
    visibleStatuses
  )

  return {
    categories: countBySingleOption(
      withoutCategories,
      (entry) => entry.category,
      Object.keys(categoryLabels) as LessonCategory[]
    ),
    difficulties: countBySingleOption(
      withoutDifficulties,
      (entry) => entry.difficulty,
      Object.keys(difficultyLabels) as LessonDifficulty[]
    ),
    mechanisms: countByManyOptions(
      withoutMechanisms,
      (entry) => entry.mechanisms,
      Object.keys(mechanismLabels) as Mechanism[]
    ),
    confusions: countBySingleOption(
      withoutConfusions,
      (entry) => entry.confusionType,
      confusionValues
    ),
  }
}
