import type { StatePrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { cn } from "@/shared/lib/utils"

export function StateView({ primitive }: { primitive: StatePrimitiveFrameState }) {
  return (
    <PrimitiveShell primitive={primitive} className="min-h-[18rem]">
      <div className="grid gap-2 sm:grid-cols-2">
        {primitive.data.values.map((entry) => (
          <div
            key={entry.label}
            className={cn(
              "rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-3 py-3",
              "font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full border border-border/70 bg-muted/28 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {entry.label}
              </span>
              <span className="text-xl font-semibold leading-none text-foreground">
                {String(entry.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </PrimitiveShell>
  )
}
