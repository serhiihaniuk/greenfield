import { describe, expect, it } from "vitest"

import { listCatalogDescriptors, listCatalogEntries } from "@/domains/lessons/catalog"
import { listLessons } from "@/domains/lessons/loaders"

describe("lesson catalog", () => {
  it("defines catalog metadata for every registered lesson and no extras", () => {
    const lessonIds = new Set(listLessons().map((lesson) => lesson.id))
    const descriptorIds = new Set(
      listCatalogDescriptors().map((descriptor) => descriptor.lessonId)
    )

    expect(descriptorIds).toEqual(lessonIds)
  })

  it("merges lesson definitions into catalog entries", () => {
    const entries = listCatalogEntries()

    expect(entries).toHaveLength(listLessons().length)
    expect(entries.every((entry) => entry.defaultApproachLabel.length > 0)).toBe(true)
  })
})
