import type { PropsWithChildren, ReactNode } from "react"

import type { PrimitiveFrameState } from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"

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
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/80 bg-card/90 p-4",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className
      )}
    >
      {primitive.title || primitive.subtitle ? (
        <header className="mb-4 flex flex-col gap-1">
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

      <div>{children}</div>

      {footer ? (
        <footer className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
          {footer}
        </footer>
      ) : null}
    </section>
  )
}
