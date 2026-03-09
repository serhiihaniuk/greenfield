import { defineLessonViewSpecs } from "@/domains/lessons/view-specs"

export const monotonicDequeSlidingWindowViewSpecs = defineLessonViewSpecs([
  {
    id: "window-array",
    primitive: "array",
    role: "primary",
    title: "Sliding Window",
    viewport: {
      role: "primary",
      preferredWidth: 960,
      minHeight: 300,
    },
  },
  {
    id: "monotonic-deque",
    primitive: "sequence",
    role: "co-primary",
    title: "Monotonic Deque",
    viewport: {
      role: "co-primary",
      preferredWidth: 360,
      minHeight: 220,
    },
  },
  {
    id: "window-state",
    primitive: "state",
    role: "support",
    title: "Window State",
    viewport: {
      role: "support",
      preferredWidth: 320,
      minHeight: 240,
    },
  },
] as const)
