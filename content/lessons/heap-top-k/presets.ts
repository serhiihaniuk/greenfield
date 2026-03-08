import type { PresetDefinition } from "@/domains/lessons/types"

export const heapTopKPresets: PresetDefinition[] = [
  {
    id: "classic-six-k3",
    label: "Classic Six K3",
    rawInput: JSON.stringify(
      {
        nums: [5, 1, 9, 3, 7, 8],
        k: 3,
      },
      null,
      2
    ),
    description:
      "A compact run that shows both heap growth and root replacement while finishing with top three values [9, 8, 7].",
  },
  {
    id: "skip-small-tail",
    label: "Skip Small Tail",
    rawInput: JSON.stringify(
      {
        nums: [12, 4, 10, 1, 2, 11],
        k: 2,
      },
      null,
      2
    ),
    description:
      "The heap fills quickly, then small tail values are skipped because they cannot replace the current threshold.",
  },
]
