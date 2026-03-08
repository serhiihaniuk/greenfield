import type { QueuePrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { cn } from "@/shared/lib/utils"

const statusClasses = {
  active: "border-cyan-400/60 bg-cyan-400/10 text-cyan-50",
  waiting: "border-border/70 bg-muted/20 text-foreground",
  done: "border-emerald-500/45 bg-emerald-500/8 text-emerald-100",
  archived: "border-border/50 bg-muted/10 text-muted-foreground",
} as const

export function QueueView({
  primitive,
}: {
  primitive: QueuePrimitiveFrameState
}) {
  return (
    <PrimitiveShell primitive={primitive}>
      <div className="grid gap-3">
        <div className="flex items-center justify-between text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          <span>{primitive.data.frontLabel ?? "front"}</span>
          <span>{primitive.data.backLabel ?? "back"}</span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-stretch gap-2">
            {primitive.data.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-5 text-sm text-muted-foreground">
                Queue is empty
              </div>
            ) : (
              primitive.data.items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "min-w-28 rounded-2xl border px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                      statusClasses[item.status]
                    )}
                  >
                    <div className="font-mono text-sm font-semibold">
                      {item.label}
                    </div>
                    {item.detail ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.detail}
                      </div>
                    ) : null}
                    {item.annotation ? (
                      <div className="mt-2 inline-flex rounded-full border border-current/25 px-2 py-0.5 font-mono text-[10px]">
                        {item.annotation}
                      </div>
                    ) : null}
                  </div>
                  {index < primitive.data.items.length - 1 ? (
                    <div className="text-muted-foreground/70">→</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PrimitiveShell>
  )
}
