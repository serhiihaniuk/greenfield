import { LessonPlayer } from "@/widgets/lesson-player/lesson-player"
import { PrimitiveAudit } from "@/widgets/primitive-audit/primitive-audit"

export function App() {
  if (typeof window !== "undefined") {
    const search = new URLSearchParams(window.location.search)

    if (search.get("audit") === "primitives") {
      return <PrimitiveAudit />
    }
  }

  return (
    <LessonPlayer lessonId="binary-search" />
  )
}

export default App
