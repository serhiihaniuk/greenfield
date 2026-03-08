import type { HashMapPrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { cn } from "@/shared/lib/utils"

const statusClasses = {
  default: "border-border/70 bg-muted/18",
  memo: "border-violet-400/45 bg-violet-400/10",
  read: "border-sky-400/45 bg-sky-400/10",
  write: "border-amber-400/45 bg-amber-400/10",
  pending: "border-border/50 bg-muted/8",
  done: "border-emerald-500/45 bg-emerald-500/8",
} as const

const valueClasses = {
  default: "text-foreground",
  memo: "text-violet-200",
  read: "text-sky-200",
  write: "text-amber-200",
  pending: "text-muted-foreground/40",
  done: "text-emerald-200",
} as const

export function HashMapView({
  primitive,
}: {
  primitive: HashMapPrimitiveFrameState
}) {
  return (
    <PrimitiveShell primitive={primitive}>
      <div className="grid gap-1">
        {primitive.data.entries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 font-mono text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
              statusClasses[entry.status]
            )}
          >
            <span className="min-w-5 text-right tabular-nums font-semibold">
              {entry.key}
            </span>
            <span className="text-[10px] leading-none text-muted-foreground/40">
              →
            </span>
            <span
              className={cn(
                "tabular-nums font-semibold",
                valueClasses[entry.status]
              )}
            >
              {entry.value === null ? "—" : entry.value}
            </span>
            {entry.annotation ? (
              <span className="ml-auto text-[10px] text-muted-foreground">
                {entry.annotation}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </PrimitiveShell>
  )
}
