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
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          <span>{primitive.data.frontLabel ?? "front"}</span>
          <span>{primitive.data.backLabel ?? "back"}</span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-1.5">
            {primitive.data.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-2 text-sm text-muted-foreground">
                Queue is empty
              </div>
            ) : (
              primitive.data.items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "rounded-xl border px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                      statusClasses[item.status]
                    )}
                  >
                    <div className="flex items-baseline gap-2 font-mono text-sm font-semibold">
                      <span>{item.label}</span>
                      {item.detail ? (
                        <span className="text-xs font-normal text-muted-foreground">
                          {item.detail}
                        </span>
                      ) : null}
                    </div>
                    {item.annotation ? (
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {item.annotation}
                      </div>
                    ) : null}
                  </div>
                  {index < primitive.data.items.length - 1 ? (
                    <div className="text-xs text-muted-foreground/50">→</div>
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
