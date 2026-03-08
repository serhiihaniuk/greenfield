import type { PresetDefinition } from "@/domains/lessons/types"

export const graphBfsPresets: PresetDefinition[] = [
  {
    id: "reach-f",
    label: "Reach F",
    rawInput: JSON.stringify(
      {
        nodes: [
          { id: "A", x: 120, y: 96 },
          { id: "B", x: 44, y: 212 },
          { id: "C", x: 190, y: 214 },
          { id: "D", x: 298, y: 108 },
          { id: "E", x: 292, y: 264 },
          { id: "F", x: 414, y: 190 },
        ],
        edges: [
          { sourceId: "A", targetId: "B" },
          { sourceId: "A", targetId: "C" },
          { sourceId: "B", targetId: "D" },
          { sourceId: "C", targetId: "D" },
          { sourceId: "C", targetId: "E" },
          { sourceId: "D", targetId: "F" },
          { sourceId: "E", targetId: "F" },
        ],
        startId: "A",
        targetId: "F",
      },
      null,
      2
    ),
    description:
      "A small graph where the frontier grows across two levels before the target is found.",
  },
  {
    id: "blocked-z",
    label: "Blocked Z",
    rawInput: JSON.stringify(
      {
        nodes: [
          { id: "S", x: 92, y: 118 },
          { id: "T", x: 214, y: 70 },
          { id: "U", x: 214, y: 204 },
          { id: "V", x: 346, y: 140 },
          { id: "Z", x: 470, y: 140 },
        ],
        edges: [
          { sourceId: "S", targetId: "T" },
          { sourceId: "S", targetId: "U" },
          { sourceId: "T", targetId: "V" },
          { sourceId: "U", targetId: "V" },
        ],
        startId: "S",
        targetId: "Z",
      },
      null,
      2
    ),
    description:
      "A disconnected target that forces the frontier to empty and makes the failed search visible.",
  },
]
