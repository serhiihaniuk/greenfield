import { z } from "zod"

export const lessonCategorySchema = z.enum([
  "arrays",
  "trees",
  "graphs",
  "dynamic-programming",
  "heaps",
  "sliding-windows",
  "search",
])

export type LessonCategory = z.infer<typeof lessonCategorySchema>

export const lessonDifficultySchema = z.enum(["easy", "medium", "hard"])

export type LessonDifficulty = z.infer<typeof lessonDifficultySchema>

export const mechanismSchema = z.enum([
  "two-pointers",
  "binary-search",
  "explicit-stack",
  "recursion",
  "memoization",
  "queue-bfs",
  "heap",
  "monotonic-deque",
  "sliding-window",
  "rolling-dp",
])

export type Mechanism = z.infer<typeof mechanismSchema>

export const catalogStatusSchema = z.enum(["flagship", "draft", "hidden"])

export type CatalogStatus = z.infer<typeof catalogStatusSchema>

export const catalogDescriptorSchema = z.object({
  lessonId: z.string().min(1),
  category: lessonCategorySchema,
  difficulty: lessonDifficultySchema,
  mechanisms: z.array(mechanismSchema).min(1),
  summary: z.string().min(1),
  status: catalogStatusSchema,
  featuredRank: z.number().int().nonnegative(),
})

export type CatalogDescriptor = z.infer<typeof catalogDescriptorSchema>

export const lessonCategoryValues = [...lessonCategorySchema.options]
export const lessonDifficultyValues = [...lessonDifficultySchema.options]
export const mechanismValues = [...mechanismSchema.options]
export const catalogStatusValues = [...catalogStatusSchema.options]
