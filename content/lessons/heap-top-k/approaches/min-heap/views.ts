import { defineLessonViewSpecs } from "@/domains/lessons/view-specs"

export const minHeapTopKViewSpecs = defineLessonViewSpecs([
  {
    id: "min-heap",
    primitive: "tree",
    role: "primary",
    title: "Min Heap",
    viewport: {
      role: "primary",
      preferredWidth: 900,
      minHeight: 340,
    },
  },
  {
    id: "input-array",
    primitive: "array",
    role: "co-primary",
    title: "Input Scan",
    viewport: {
      role: "co-primary",
      preferredWidth: 960,
      minHeight: 220,
    },
  },
  {
    id: "heap-state",
    primitive: "state",
    role: "support",
    title: "Top-K State",
    viewport: {
      role: "support",
      preferredWidth: 320,
      minHeight: 220,
    },
  },
] as const)
