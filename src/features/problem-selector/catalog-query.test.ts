import { describe, expect, it } from "vitest"

import { listCatalogEntries } from "@/domains/lessons/catalog"
import { queryCatalog, createCatalogCounts, emptyCatalogFilter } from "@/features/problem-selector/catalog-query"

describe("problem selector catalog query", () => {
  const entries = listCatalogEntries()

  it("returns all flagship lessons when the filter is empty", () => {
    const results = queryCatalog(entries, emptyCatalogFilter)

    expect(results).toHaveLength(9)
  })

  it("uses AND semantics across groups and OR semantics within a group", () => {
    const results = queryCatalog(entries, {
      ...emptyCatalogFilter,
      categories: new Set(["trees"]),
      mechanisms: new Set(["recursion", "explicit-stack"]),
    })

    expect(results.map((entry) => entry.id)).toEqual([
      "maximum-depth",
      "tree-dfs-traversal",
    ])
  })

  it("matches search across title, summary, and labels", () => {
    const recursionResults = queryCatalog(entries, {
      ...emptyCatalogFilter,
      search: "recursion",
    })
    const frontierResults = queryCatalog(entries, {
      ...emptyCatalogFilter,
      search: "Frontier Expansion",
    })

    expect(recursionResults.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["coin-change", "maximum-depth"])
    )
    expect(frontierResults.map((entry) => entry.id)).toEqual([
      "graph-bfs",
      "rotting-oranges",
    ])
  })

  it("keeps the active lesson first when it still matches", () => {
    const results = queryCatalog(entries, emptyCatalogFilter, {
      activeLessonId: "graph-bfs",
    })

    expect(results[0]?.id).toBe("graph-bfs")
  })

  it("derives cross-filter-aware counts", () => {
    const counts = createCatalogCounts(entries, {
      ...emptyCatalogFilter,
      categories: new Set(["trees"]),
    })

    expect(counts.difficulties.get("easy")).toBe(1)
    expect(counts.difficulties.get("medium")).toBe(1)
    expect(counts.difficulties.get("hard")).toBe(0)
  })
})
