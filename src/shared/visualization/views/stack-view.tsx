import type { StackPrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { cn } from "@/shared/lib/utils"

export function StackView({ primitive }: { primitive: StackPrimitiveFrameState }) {
  return (
    <PrimitiveShell primitive={primitive}>
      <div className="relative flex flex-col gap-2 pl-5">
        <div className="absolute top-0 bottom-0 left-2 w-px bg-border/60" />
        {primitive.data.topLabel ? (
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            <span className="size-2 rounded-full border border-cyan-400/50 bg-cyan-400/18" />
            {primitive.data.topLabel}
          </div>
        ) : null}
        {primitive.data.frames.map((frame, index) => (
          <div key={frame.id} className="relative">
            <div className="absolute top-5 -left-[1.1rem] size-2 rounded-full border border-border/80 bg-background" />
            <div
              className={cn(
                "rounded-2xl border px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                frame.status === "active" && "border-cyan-400/60 bg-cyan-400/10",
                frame.status === "waiting" && "border-border/70 bg-muted/24",
                frame.status === "done" && "border-emerald-500/45 bg-emerald-500/8",
                frame.status === "archived" && "border-border/50 bg-muted/15 opacity-75"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border/70 bg-muted/28 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      depth {primitive.data.frames.length - index}
                    </span>
                    <div className="font-mono text-sm font-medium">{frame.label}</div>
                  </div>
                  {frame.detail ? (
                    <div className="text-xs text-muted-foreground">{frame.detail}</div>
                  ) : null}
                </div>
                {frame.annotation ? (
                  <div className="rounded-full border border-current/25 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {frame.annotation}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PrimitiveShell>
  )
}
