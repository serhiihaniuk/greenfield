import { defineLessonViewSpecs } from "@/domains/lessons/view-specs"

export const multiSourceBfsViewSpecs = defineLessonViewSpecs([
  {
    id: "grid",
    primitive: "grid",
    role: "primary",
    title: "Orange Grid",
    viewport: {
      role: "primary",
      preferredWidth: 980,
      minHeight: 420,
    },
  },
  {
    id: "frontier-queue",
    primitive: "queue",
    role: "co-primary",
    title: "Frontier Queue",
    viewport: {
      role: "co-primary",
      preferredWidth: 360,
      minHeight: 180,
    },
  },
  {
    id: "rotting-state",
    primitive: "state",
    role: "support",
    title: "Rotting State",
    viewport: {
      role: "support",
      preferredWidth: 320,
      minHeight: 220,
    },
  },
] as const)
