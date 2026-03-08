import type { PresetDefinition } from "@/domains/lessons/types"

export const coinChangePresets: PresetDefinition[] = [
  {
    id: "reuse-six",
    label: "Reuse Six",
    rawInput: JSON.stringify(
      {
        coins: [1, 3, 4],
        amount: 6,
      },
      null,
      2
    ),
    description:
      "A small amount where repeated remainders make memo reuse visible before the optimal answer 2 is returned.",
  },
  {
    id: "blocked-seven",
    label: "Blocked Seven",
    rawInput: JSON.stringify(
      {
        coins: [2, 4],
        amount: 7,
      },
      null,
      2
    ),
    description:
      "An impossible target that forces the recursion to memoize failure states and return -1.",
  },
]
