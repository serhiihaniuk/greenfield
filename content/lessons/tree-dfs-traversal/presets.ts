import type { PresetDefinition } from "@/domains/lessons/types"

export const treeDfsTraversalPresets: PresetDefinition[] = [
  {
    id: "balanced-six",
    label: "Balanced Six",
    rawInput: JSON.stringify(
      {
        values: [8, 4, 12, 2, 6, 10, null],
      },
      null,
      2
    ),
    description:
      "A balanced tree where pushing right before left makes preorder stack behavior visible and finishes with order [8, 4, 2, 6, 12, 10].",
  },
  {
    id: "zigzag-five",
    label: "Zigzag Five",
    rawInput: JSON.stringify(
      {
        values: [7, 3, 9, null, 5, 8, 11],
      },
      null,
      2
    ),
    description:
      "An uneven tree that still requires the explicit stack to preserve preorder traversal order.",
  },
]
