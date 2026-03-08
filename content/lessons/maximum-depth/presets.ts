import type { PresetDefinition } from "@/domains/lessons/types"

export const maximumDepthPresets: PresetDefinition[] = [
  {
    id: "balanced-five",
    label: "Balanced Five",
    rawInput: JSON.stringify(
      {
        values: [3, 9, 20, null, null, 15, 7],
      },
      null,
      2
    ),
    description:
      "A balanced tree where both recursive branches contribute to the final depth 3.",
  },
  {
    id: "left-heavy",
    label: "Left Heavy",
    rawInput: JSON.stringify(
      {
        values: [1, 2, null, 3, null, null, null, 4],
      },
      null,
      2
    ),
    description:
      "A skewed tree that makes the call stack visibly grow down one side.",
  },
]
