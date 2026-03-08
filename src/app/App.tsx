import { LessonPlayer } from "@/widgets/lesson-player/lesson-player"
import { PrimitiveAudit } from "@/widgets/primitive-audit/primitive-audit"
import { TooltipProvider } from "@/shared/ui/tooltip"

export function App() {
  if (typeof window !== "undefined") {
    const search = new URLSearchParams(window.location.search)

    if (search.get("audit") === "primitives") {
      return <PrimitiveAudit />
    }
  }

  return (
    <TooltipProvider>
      <LessonPlayer lessonId="binary-search" />
    </TooltipProvider>
  )
}

export default App
