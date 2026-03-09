import { useContext } from "react"
import { LayoutGroup, motion } from "motion/react"

import type { CodeTracePrimitiveFrameState } from "@/entities/visualization/primitives"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import { ExecutionTokenMark } from "@/shared/visualization/execution-token-mark"
import {
  PrimitiveRoleContext,
  PrimitiveShell,
} from "@/shared/visualization/primitive-shell"

export function CodeTraceView({
  primitive,
}: {
  primitive: CodeTracePrimitiveFrameState
}) {
  const role = useContext(PrimitiveRoleContext)
  const { animateTravel, transitions } = useMotionContract()
  const waiting = new Set(primitive.data.waitingLineIds ?? [])
  const returned = new Set(primitive.data.returnedLineIds ?? [])

  return (
    <PrimitiveShell primitive={primitive}>
      <div
        className={cn(
          "overflow-auto rounded-lg border border-border/70 p-3 font-mono text-sm",
          role === "reference" ? "min-h-0 flex-1" : "h-[19rem] xl:h-[23rem]"
        )}
        style={{
          background:
            primitive.data.background ??
            "linear-gradient(180deg, rgba(15,23,34,1) 0%, rgba(20,28,43,1) 100%)",
        }}
      >
        <LayoutGroup id={`${primitive.id}-code-trace`}>
          <div className="grid min-w-max gap-1">
            {primitive.data.lines.map((line) => {
              const isActive = primitive.data.activeLineId === line.id

              return (
                <motion.div
                  key={line.id}
                  layout={animateTravel}
                  transition={transitions.layout}
                  className={cn(
                    "relative overflow-hidden rounded-md px-2.5 py-1.5 whitespace-pre",
                    waiting.has(line.id) && "bg-white/5",
                    returned.has(line.id) && "bg-emerald-400/10"
                  )}
                >
                  {isActive ? (
                    <motion.div
                      layoutId={
                        animateTravel
                          ? `${primitive.id}-active-line`
                          : undefined
                      }
                      transition={transitions.pointer}
                      className="absolute inset-0 rounded-md border border-white/10 bg-white/8 shadow-[0_0_0_1px_rgba(56,189,248,0.18)]"
                    />
                  ) : null}
                  <div className="relative z-10">
                    <span className="mr-3 inline-block w-7 text-right text-white/40">
                      {line.lineNumber}
                    </span>
                    {line.tokens.map((token, index) => (
                      <span
                        key={`${line.id}-${index}-${token.content}`}
                        data-token-id={token.tokenId}
                        style={{
                          color:
                            token.color ??
                            primitive.data.foreground ??
                            "#e1e4e8",
                        }}
                      >
                        {token.tokenStyle ? (
                          <ExecutionTokenMark
                            label={token.content}
                            style={token.tokenStyle}
                            variant="text"
                          />
                        ) : (
                          token.content
                        )}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </LayoutGroup>
      </div>
    </PrimitiveShell>
  )
}
