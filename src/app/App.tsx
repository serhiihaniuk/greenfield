import { lazy, Suspense } from "react"

import { AppRouter } from "@/app/router"
import { TooltipProvider } from "@/shared/ui/tooltip"

const PrimitiveAudit = lazy(() =>
  import("@/widgets/primitive-audit/primitive-audit").then((module) => ({
    default: module.PrimitiveAudit,
  }))
)

export function App() {
  if (typeof window !== "undefined") {
    const search = new URLSearchParams(window.location.search)

    if (search.get("audit") === "primitives") {
      return (
        <Suspense fallback={null}>
          <PrimitiveAudit />
        </Suspense>
      )
    }
  }

  return (
    <TooltipProvider>
      <AppRouter />
    </TooltipProvider>
  )
}

export default App
