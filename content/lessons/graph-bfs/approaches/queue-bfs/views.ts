import { defineLessonViewSpecs } from "@/domains/lessons/view-specs"

export const queueBfsViewSpecs = defineLessonViewSpecs([
  {
    id: "graph",
    primitive: "graph",
    role: "primary",
    title: "Graph Frontier",
    viewport: {
      role: "primary",
      preferredWidth: 960,
      minHeight: 360,
    },
  },
  {
    id: "frontier-queue",
    primitive: "queue",
    role: "co-primary",
    title: "Frontier Queue",
    viewport: {
      role: "co-primary",
      preferredWidth: 340,
      minHeight: 180,
    },
  },
  {
    id: "frontier-state",
    primitive: "state",
    role: "support",
    title: "Traversal State",
    viewport: {
      role: "support",
      preferredWidth: 320,
      minHeight: 220,
    },
  },
] as const)
