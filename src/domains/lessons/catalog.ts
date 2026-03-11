import type { ConfusionType } from "@/domains/lessons/types"
import { listLessons } from "@/domains/lessons/loaders"
import {
  catalogDescriptorSchema,
  lessonCategoryValues,
  lessonDifficultyValues,
  mechanismValues,
  type CatalogDescriptor,
  type CatalogStatus,
  type LessonCategory,
  type LessonDifficulty,
  type Mechanism,
} from "@/domains/lessons/catalog-types"

export interface CatalogEntry {
  id: string
  slug: string
  title: string
  confusionType: ConfusionType
  shortPatternNote: string
  approachLabels: string[]
  defaultApproachLabel: string
  category: LessonCategory
  difficulty: LessonDifficulty
  mechanisms: Mechanism[]
  summary: string
  status: CatalogStatus
  featuredRank: number
}

const catalogDescriptors = [
  {
    lessonId: "binary-search",
    category: "arrays",
    difficulty: "medium",
    mechanisms: ["binary-search"],
    summary: "Learn how shrinking search bounds explains every binary-search decision.",
    status: "flagship",
    featuredRank: 0,
  },
  {
    lessonId: "coin-change",
    category: "dynamic-programming",
    difficulty: "medium",
    mechanisms: ["recursion", "memoization"],
    summary: "Watch recursive branches collapse into reusable memoized answers.",
    status: "flagship",
    featuredRank: 5,
  },
  {
    lessonId: "graph-bfs",
    category: "graphs",
    difficulty: "medium",
    mechanisms: ["queue-bfs"],
    summary: "See how the frontier queue drives breadth-first exploration through a graph.",
    status: "flagship",
    featuredRank: 3,
  },
  {
    lessonId: "heap-top-k",
    category: "heaps",
    difficulty: "medium",
    mechanisms: ["heap"],
    summary: "Study how a min-heap keeps only the strongest top-k candidates alive.",
    status: "flagship",
    featuredRank: 6,
  },
  {
    lessonId: "house-robber",
    category: "dynamic-programming",
    difficulty: "medium",
    mechanisms: ["rolling-dp"],
    summary: "Track rolling dynamic-programming state without building a full DP table.",
    status: "flagship",
    featuredRank: 1,
  },
  {
    lessonId: "maximum-depth",
    category: "trees",
    difficulty: "easy",
    mechanisms: ["recursion"],
    summary: "Follow recursive calls as subtree depths return and aggregate into one answer.",
    status: "flagship",
    featuredRank: 2,
  },
  {
    lessonId: "rotting-oranges",
    category: "graphs",
    difficulty: "medium",
    mechanisms: ["queue-bfs"],
    summary: "See a multi-source BFS spread through a matrix one frontier wave at a time.",
    status: "flagship",
    featuredRank: 8,
  },
  {
    lessonId: "sliding-window-maximum",
    category: "sliding-windows",
    difficulty: "hard",
    mechanisms: ["monotonic-deque", "sliding-window"],
    summary: "Understand how a monotonic deque preserves the current maximum in each window.",
    status: "flagship",
    featuredRank: 4,
  },
  {
    lessonId: "tree-dfs-traversal",
    category: "trees",
    difficulty: "medium",
    mechanisms: ["explicit-stack"],
    summary: "See how an explicit stack controls preorder traversal without recursion.",
    status: "flagship",
    featuredRank: 7,
  },
] as const satisfies readonly CatalogDescriptor[]

const descriptorByLessonId = new Map<string, CatalogDescriptor>(
  catalogDescriptors.map((descriptor) => {
    catalogDescriptorSchema.parse(descriptor)
    return [descriptor.lessonId, descriptor]
  })
)

export const categoryLabels: Record<LessonCategory, string> = {
  arrays: "Arrays",
  trees: "Trees",
  graphs: "Graphs",
  "dynamic-programming": "Dynamic Programming",
  heaps: "Heaps & Priority Queues",
  "sliding-windows": "Sliding Windows",
  search: "Search & Traversal",
}

export const confusionLabels: Record<ConfusionType, string> = {
  "pointer-state": "Pointer Movement",
  "stack-execution": "Stack Unwinding",
  "memoization-reuse": "Memoization & Reuse",
  "state-transition": "State Transitions",
  "frontier-traversal": "Frontier Expansion",
  "priority-structure": "Priority Structures",
  "structural-mutation": "Structural Mutation",
}

export const difficultyLabels: Record<LessonDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

export const mechanismLabels: Record<Mechanism, string> = {
  "two-pointers": "Two Pointers",
  "binary-search": "Binary Search",
  "explicit-stack": "Explicit Stack",
  recursion: "Recursion",
  memoization: "Memoization",
  "queue-bfs": "Queue / BFS",
  heap: "Heap",
  "monotonic-deque": "Monotonic Deque",
  "sliding-window": "Sliding Window",
  "rolling-dp": "Rolling DP",
}

export function listCatalogEntries(): CatalogEntry[] {
  return listLessons().map((lesson) => {
    const descriptor = descriptorByLessonId.get(lesson.id)

    if (!descriptor) {
      throw new Error(`Lesson "${lesson.id}" is missing catalog metadata.`)
    }

    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      confusionType: lesson.confusionType,
      shortPatternNote: lesson.shortPatternNote,
      approachLabels: lesson.approaches.map((approach) => approach.label),
      defaultApproachLabel:
        lesson.approaches.find((approach) => approach.id === lesson.defaultApproachId)
          ?.label ?? lesson.approaches[0]?.label ?? "",
      category: descriptor.category,
      difficulty: descriptor.difficulty,
      mechanisms: [...descriptor.mechanisms],
      summary: descriptor.summary,
      status: descriptor.status,
      featuredRank: descriptor.featuredRank,
    }
  })
}

export function listCatalogDescriptors() {
  return [...catalogDescriptors]
}

export const catalogFilterOptions = {
  categories: lessonCategoryValues,
  difficulties: lessonDifficultyValues,
  mechanisms: mechanismValues,
} as const
