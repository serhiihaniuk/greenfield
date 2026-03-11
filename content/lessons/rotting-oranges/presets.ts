import type { PresetDefinition } from "@/domains/lessons/types"

export const rottingOrangesPresets: PresetDefinition[] = [
  {
    id: "classic-wave",
    label: "Classic Wave",
    rawInput: JSON.stringify(
      {
        grid: [
          [2, 1, 1],
          [1, 1, 0],
          [0, 1, 1],
        ],
      },
      null,
      2
    ),
    description:
      "A standard multi-source BFS where the rot reaches every fresh orange over four frontier waves.",
  },
  {
    id: "sealed-fresh",
    label: "Sealed Fresh",
    rawInput: JSON.stringify(
      {
        grid: [
          [2, 1, 1],
          [0, 1, 1],
          [1, 0, 1],
        ],
      },
      null,
      2
    ),
    description:
      "A blocked configuration where one fresh orange can never be reached, forcing the final answer to stay at -1.",
  },
]
