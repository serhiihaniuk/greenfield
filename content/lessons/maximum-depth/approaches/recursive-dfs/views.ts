import { defineLessonViewSpecs } from "@/domains/lessons/view-specs"

export const recursiveMaximumDepthViewSpecs = defineLessonViewSpecs([
  {
    id: "execution-tree",
    primitive: "call-tree",
    role: "primary",
    title: "Execution Tree",
    viewport: {
      role: "primary",
      preferredWidth: 980,
      minHeight: 380,
    },
  },
  {
    id: "call-stack",
    primitive: "stack",
    role: "co-primary",
    title: "Call Stack",
    viewport: {
      role: "co-primary",
      preferredWidth: 320,
      minHeight: 220,
    },
  },
  {
    id: "tree",
    primitive: "tree",
    role: "context",
    title: "Binary Tree",
    optional: true,
    viewport: {
      role: "context",
      preferredWidth: 360,
      minHeight: 300,
    },
  },
] as const)
