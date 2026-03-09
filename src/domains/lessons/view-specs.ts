import { requiredViewSchema, type RequiredView } from "@/domains/lessons/types"
import {
  primitiveViewportSpecSchema,
  type PrimitiveViewportSpec,
} from "@/entities/visualization/types"

export interface LessonViewSpec extends RequiredView {
  viewport?: PrimitiveViewportSpec
}

const lessonViewSpecSchema = requiredViewSchema.extend({
  viewport: primitiveViewportSpecSchema.optional(),
})

export function defineLessonViewSpecs<
  const T extends readonly LessonViewSpec[],
>(viewSpecs: T): T {
  for (const viewSpec of viewSpecs) {
    lessonViewSpecSchema.parse(viewSpec)
  }

  return viewSpecs
}

export function toRequiredViews(
  viewSpecs: readonly LessonViewSpec[]
): RequiredView[] {
  return viewSpecs.map((viewSpec) => {
    const requiredView = { ...viewSpec }
    delete requiredView.viewport
    return requiredView
  })
}

export function getLessonViewSpec(
  viewSpecs: readonly LessonViewSpec[],
  viewId: string
): LessonViewSpec {
  const viewSpec = viewSpecs.find((entry) => entry.id === viewId)

  if (!viewSpec) {
    throw new Error(`Missing lesson view spec "${viewId}".`)
  }

  return viewSpec
}
