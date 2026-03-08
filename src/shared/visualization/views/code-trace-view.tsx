import type { CodeTracePrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { cn } from "@/shared/lib/utils"

export function CodeTraceView({
  primitive,
}: {
  primitive: CodeTracePrimitiveFrameState
}) {
  const waiting = new Set(primitive.data.waitingLineIds ?? [])
  const returned = new Set(primitive.data.returnedLineIds ?? [])

  return (
    <PrimitiveShell primitive={primitive}>
      <div
        className="h-[19rem] overflow-auto rounded-2xl border border-border/70 p-3 font-mono text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:h-[23rem]"
        style={{
          background:
            primitive.data.background ??
            "linear-gradient(180deg, rgba(15,23,34,1) 0%, rgba(20,28,43,1) 100%)",
        }}
      >
        <div className="grid min-w-max gap-1">
          {primitive.data.lines.map((line) => (
            <div
              key={line.id}
              className={cn(
                "rounded-xl px-2.5 py-1.5 whitespace-pre",
                primitive.data.activeLineId === line.id &&
                  "border border-white/10 bg-white/8 shadow-[0_0_0_1px_rgba(56,189,248,0.18)]",
                waiting.has(line.id) && "bg-white/5",
                returned.has(line.id) && "bg-emerald-400/10"
              )}
            >
              <span className="mr-3 inline-block w-7 text-right text-white/40">
                {line.lineNumber}
              </span>
              {line.tokens.map((token, index) => (
                <span
                  key={`${line.id}-${index}-${token.content}`}
                  style={{ color: token.color ?? primitive.data.foreground ?? "#e1e4e8" }}
                >
                  {token.content}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </PrimitiveShell>
  )
}
