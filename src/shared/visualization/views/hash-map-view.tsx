import type { HashMapPrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { cn } from "@/shared/lib/utils"

const statusClasses = {
  default: "border-border/70 bg-muted/18",
  memo: "border-violet-400/45 bg-violet-400/10",
  read: "border-sky-400/45 bg-sky-400/10",
  write: "border-amber-400/45 bg-amber-400/10",
  pending: "border-border/60 bg-muted/10 opacity-80",
  done: "border-emerald-500/45 bg-emerald-500/8",
} as const

export function HashMapView({
  primitive,
}: {
  primitive: HashMapPrimitiveFrameState
}) {
  return (
    <PrimitiveShell primitive={primitive}>
      <div className="grid gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>Key</span>
          <span />
          <span className="text-right">Value</span>
        </div>
        {primitive.data.entries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border px-3 py-3 font-mono text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
              statusClasses[entry.status]
            )}
          >
            <div className="grid gap-1">
              <div className="truncate text-base font-semibold">{entry.key}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {entry.status}
              </div>
            </div>
            <div className="rounded-full border border-border/70 bg-background/40 px-2 py-0.5 text-center text-[10px] text-muted-foreground">
              =&gt;
            </div>
            <div className="truncate text-right text-lg font-semibold">
              {entry.value === null ? "?" : entry.value}
            </div>
            {entry.annotation ? (
              <div className="col-span-3 rounded-xl border border-border/50 bg-background/25 px-2.5 py-2 text-[11px] text-muted-foreground">
                {entry.annotation}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </PrimitiveShell>
  )
}
