import { describe, expect, it } from "vitest"

import { buildBinaryTreeArrayModel } from "@/shared/lib/binary-tree-array"

describe("buildBinaryTreeArrayModel", () => {
  it("builds stable parent-child relationships from level-order input", () => {
    const model = buildBinaryTreeArrayModel(
      [8, 4, 12, 2, 6, 10, null],
      "Test tree"
    )

    expect(model.rootId).toBe("node-0")
    expect(model.nodeById.get("node-0")?.leftId).toBe("node-1")
    expect(model.nodeById.get("node-0")?.rightId).toBe("node-2")
    expect(model.nodeById.get("node-1")?.leftId).toBe("node-3")
    expect(model.nodeById.get("node-1")?.rightId).toBe("node-4")
    expect(model.nodeById.get("node-2")?.leftId).toBe("node-5")
  })

  it("rejects disconnected nodes beneath null parents", () => {
    expect(() =>
      buildBinaryTreeArrayModel([1, null, 2, 3], "Test tree")
    ).toThrow(/disconnected from a null parent/i)
  })
})
