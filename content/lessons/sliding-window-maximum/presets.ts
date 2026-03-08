import type { PresetDefinition } from "@/domains/lessons/types"

export const slidingWindowMaximumPresets: PresetDefinition[] = [
  {
    id: "classic-five",
    label: "Classic Five",
    rawInput: JSON.stringify(
      {
        nums: [1, 3, -1, -3, 5],
        k: 3,
      },
      null,
      2
    ),
    description:
      "A short run that shows both stale front eviction and repeated back pops before the next maximum is emitted.",
  },
  {
    id: "rising-tail",
    label: "Rising Tail",
    rawInput: JSON.stringify(
      {
        nums: [4, 2, 12, 3, 8, 7],
        k: 2,
      },
      null,
      2
    ),
    description:
      "A smaller window where late larger values keep collapsing the deque tail before each output.",
  },
]
