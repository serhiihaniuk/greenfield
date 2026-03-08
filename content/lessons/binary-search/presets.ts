import type { PresetDefinition } from "@/domains/lessons/types"

export const binarySearchPresets: PresetDefinition[] = [
  {
    id: "found-middle",
    label: "Found In Middle",
    rawInput: JSON.stringify(
      {
        nums: [1, 3, 5, 7, 9, 11],
        target: 7,
      },
      null,
      2
    ),
    description: "Target exists in the initial midpoint range.",
  },
  {
    id: "not-found",
    label: "Not Found",
    rawInput: JSON.stringify(
      {
        nums: [2, 4, 6, 8, 10, 12],
        target: 5,
      },
      null,
      2
    ),
    description: "The search exhausts the interval and returns -1.",
  },
]
