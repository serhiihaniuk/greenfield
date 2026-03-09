import { defineLessonViewSpecs } from "@/domains/lessons/view-specs"

export const memoDfsCoinChangeViewSpecs = defineLessonViewSpecs([
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
    id: "memo-table",
    primitive: "hash-map",
    role: "co-primary",
    title: "Memo Table",
    viewport: {
      role: "co-primary",
      preferredWidth: 340,
      minHeight: 260,
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
      minHeight: 240,
    },
  },
] as const)
