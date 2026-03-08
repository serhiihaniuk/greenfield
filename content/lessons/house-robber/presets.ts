import type { PresetDefinition } from "@/domains/lessons/types"

export const houseRobberPresets: PresetDefinition[] = [
  {
    id: "classic-five",
    label: "Classic Five",
    rawInput: JSON.stringify(
      {
        nums: [2, 7, 9, 3, 1],
      },
      null,
      2
    ),
    description: "The optimal answer skips local greed and lands on 12.",
  },
  {
    id: "staggered-four",
    label: "Staggered Four",
    rawInput: JSON.stringify(
      {
        nums: [2, 1, 1, 2],
      },
      null,
      2
    ),
    description: "Two small middle houses still make the edge pair optimal.",
  },
]