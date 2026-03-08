import { createContext, useContext, type PropsWithChildren, type ReactNode } from "react"

import type { PrimitiveFrameState } from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"

export type PrimitiveRole = "primary" | "secondary" | "reference"

export const PrimitiveRoleContext = createContext<PrimitiveRole | undefined>(undefined)

type PrimitiveShellProps = PropsWithChildren<{
  primitive: PrimitiveFrameState
  footer?: ReactNode
  className?: string
}>

export function PrimitiveShell({
  primitive,
  footer,
  className,
  children,
}: PrimitiveShellProps) {
  const role = useContext(PrimitiveRoleContext)
  const showHeader = role !== "reference" && (primitive.title || primitive.subtitle)

  return (
    <section
      data-testid={`primitive-${primitive.id}`}
      data-primitive-kind={primitive.kind}
      className={cn(
        role === "primary" && "p-2",
        role === "secondary" && "rounded-xl border border-border/50 bg-card/60 p-3",
        role === "reference" && "flex flex-1 flex-col p-2",
        !role &&
          "rounded-2xl border border-border/80 bg-card/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className
      )}
    >
      {showHeader ? (
        <header className={cn("flex flex-col gap-1", role ? "mb-2" : "mb-4")}>
          {primitive.title ? (
            <h2 className="text-sm font-medium tracking-tight text-foreground">
              {primitive.title}
            </h2>
          ) : null}
          {primitive.subtitle ? (
            <p className="text-xs text-muted-foreground">{primitive.subtitle}</p>
          ) : null}
        </header>
      ) : null}

      <div className={cn(role === "reference" && "flex flex-1 flex-col min-h-0")}>
        {children}
      </div>

      {footer ? (
        <footer className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
          {footer}
        </footer>
      ) : null}
    </section>
  )
}
