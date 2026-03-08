import type { StatePrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { cn } from "@/shared/lib/utils"

export function StateView({ primitive }: { primitive: StatePrimitiveFrameState }) {
  return (
    <PrimitiveShell primitive={primitive}>
      <div className="grid gap-2">
        {primitive.data.values.map((entry) => (
          <div
            key={entry.label}
            className={cn(
              "rounded-lg border border-border/60 px-2.5 py-2 font-mono"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {entry.label}
              </span>
              <span className="text-base font-semibold leading-none text-foreground">
                {String(entry.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </PrimitiveShell>
  )
}
