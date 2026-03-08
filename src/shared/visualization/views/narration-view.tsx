import type { NarrationPrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { cn } from "@/shared/lib/utils"

const segmentClasses = {
  default: "text-foreground",
  active: "text-cyan-200",
  compare: "text-sky-200",
  candidate: "text-amber-200",
  done: "text-emerald-200",
  found: "text-emerald-100",
  error: "text-rose-200",
  memo: "text-violet-200",
  base: "text-teal-200",
  dim: "text-muted-foreground",
} as const

export function NarrationView({
  primitive,
}: {
  primitive: NarrationPrimitiveFrameState
}) {
  return (
    <PrimitiveShell primitive={primitive}>
      <div className="flex flex-col gap-4 text-sm leading-6">
        <div className="rounded-2xl border border-border/60 bg-muted/14 px-3 py-3">
          <p>
          {primitive.data.segments.length > 0
            ? primitive.data.segments.map((segment) => (
                <span
                  key={segment.id}
                  className={cn(segmentClasses[segment.tone ?? "default"])}
                >
                  {segment.text}
                </span>
              ))
            : primitive.data.summary}
          </p>
        </div>
        <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
          {primitive.data.codeLine ? (
            <div className="grid gap-1 rounded-xl border border-border/50 bg-background/20 px-2.5 py-2">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                Code line
              </div>
              <div className="font-mono text-xs">{primitive.data.codeLine}</div>
            </div>
          ) : null}
          {primitive.data.visualChange ? (
            <div className="grid gap-1 rounded-xl border border-border/50 bg-background/20 px-2.5 py-2">
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                Visual change
              </div>
              <div className="font-mono text-xs uppercase">
                {primitive.data.visualChange}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </PrimitiveShell>
  )
}
