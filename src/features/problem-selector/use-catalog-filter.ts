import { useMemo, useState } from "react"

import type { CatalogEntry } from "@/domains/lessons/catalog"
import type {
  LessonCategory,
  LessonDifficulty,
  Mechanism,
} from "@/domains/lessons/catalog-types"
import type { ConfusionType } from "@/domains/lessons/types"
import {
  createCatalogCounts,
  emptyCatalogFilter,
  queryCatalog,
  type CatalogFilterState,
} from "@/features/problem-selector/catalog-query"

type UseCatalogFilterOptions = {
  entries: CatalogEntry[]
  activeLessonId?: string
}

function toggleInSet<T extends string>(current: Set<T>, value: T) {
  const next = new Set(current)

  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }

  return next
}

export function useCatalogFilter({
  entries,
  activeLessonId,
}: UseCatalogFilterOptions) {
  const [filter, setFilter] = useState<CatalogFilterState>(emptyCatalogFilter)

  const results = useMemo(
    () =>
      queryCatalog(entries, filter, {
        activeLessonId,
        visibleStatuses: ["flagship"],
      }),
    [activeLessonId, entries, filter]
  )

  const counts = useMemo(
    () =>
      createCatalogCounts(entries, filter, {
        visibleStatuses: ["flagship"],
      }),
    [entries, filter]
  )

  return {
    filter,
    counts,
    results,
    setSearch: (search: string) =>
      setFilter((current) => ({ ...current, search })),
    toggleCategory: (category: LessonCategory) =>
      setFilter((current) => ({
        ...current,
        categories: toggleInSet(current.categories, category),
      })),
    toggleDifficulty: (difficulty: LessonDifficulty) =>
      setFilter((current) => ({
        ...current,
        difficulties: toggleInSet(current.difficulties, difficulty),
      })),
    toggleMechanism: (mechanism: Mechanism) =>
      setFilter((current) => ({
        ...current,
        mechanisms: toggleInSet(current.mechanisms, mechanism),
      })),
    toggleConfusion: (confusion: ConfusionType) =>
      setFilter((current) => ({
        ...current,
        confusions: toggleInSet(current.confusions, confusion),
      })),
    resetFilters: () => setFilter(emptyCatalogFilter),
  }
}
