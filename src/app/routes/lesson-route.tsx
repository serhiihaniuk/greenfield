import { useEffect } from "react"
import { Navigate, useParams } from "react-router"

import {
  getDefaultLessonSlug,
  hasLessonSlug,
} from "@/domains/lessons/loaders"
import { LessonPlayer } from "@/widgets/lesson-player/lesson-player"

function InvalidLessonRedirect({ slug }: { slug: string }) {
  const fallbackSlug = getDefaultLessonSlug()

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn(
        `Unknown lesson slug "${slug}". Redirecting to "${fallbackSlug}".`
      )
    }
  }, [fallbackSlug, slug])

  return <Navigate to={`/lessons/${fallbackSlug}`} replace />
}

export function LessonRoute() {
  const { slug } = useParams()
  const fallbackSlug = getDefaultLessonSlug()
  const activeSlug = slug ?? fallbackSlug

  if (!hasLessonSlug(activeSlug)) {
    return <InvalidLessonRedirect slug={activeSlug} />
  }

  return <LessonPlayer lessonId={activeSlug} />
}
