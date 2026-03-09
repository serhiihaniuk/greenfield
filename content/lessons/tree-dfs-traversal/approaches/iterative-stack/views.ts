import { defineLessonViewSpecs } from "@/domains/lessons/view-specs"

export const iterativeStackTreeDfsViewSpecs = defineLessonViewSpecs([
  {
    id: "tree",
    primitive: "tree",
    role: "primary",
    title: "Traversal Tree",
    viewport: {
      role: "primary",
      preferredWidth: 920,
      minHeight: 340,
    },
  },
  {
    id: "dfs-stack",
    primitive: "stack",
    role: "co-primary",
    title: "DFS Stack",
    viewport: {
      role: "co-primary",
      preferredWidth: 320,
      minHeight: 220,
    },
  },
  {
    id: "visit-order",
    primitive: "sequence",
    role: "co-primary",
    title: "Preorder Output",
    viewport: {
      role: "co-primary",
      preferredWidth: 420,
      minHeight: 220,
    },
  },
] as const)
