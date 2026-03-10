import type { NarrationPrimitiveFrameState } from "@/entities/visualization/primitives"
import type {
  NarrationClause,
  NarrationEvidence,
  NarrationPayload,
} from "@/domains/projection/types"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { ExecutionTokenMark } from "@/shared/visualization/execution-token-mark"
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

type NarrationSegmentsProps = {
  summary: string
  segments: NarrationPrimitiveFrameState["data"]["segments"]
}

export function NarrationSegments({
  summary,
  segments,
}: NarrationSegmentsProps) {
  if (segments.length === 0) {
    return <>{summary}</>
  }

  return segments.map((segment) => (
    <span
      key={segment.id}
      className={cn(segmentClasses[segment.tone ?? "default"])}
      data-token-id={segment.tokenId}
    >
      {segment.tokenStyle ? (
        <ExecutionTokenMark label={segment.text} style={segment.tokenStyle} />
      ) : (
        segment.text
      )}
    </span>
  ))
}

function NarrationClauseView({
  label,
  clause,
  className,
}: {
  label: string
  clause?: NarrationClause
  className?: string
}) {
  if (!clause) {
    return null
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/90">
        {label}
      </div>
      <div className="text-sm leading-6 text-foreground">
        <NarrationSegments
          summary={clause.segments.map((segment) => segment.text).join("")}
          segments={clause.segments}
        />
      </div>
    </div>
  )
}

function NarrationEvidenceChip({ evidence }: { evidence: NarrationEvidence }) {
  return (
    <div className="grid gap-1 rounded-xl border border-border/50 bg-background/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {evidence.label}
      </div>
      <div
        className={cn(
          "text-xs font-medium text-foreground",
          evidence.tone ? segmentClasses[evidence.tone] : undefined
        )}
      >
        {evidence.tokenStyle ? (
          <ExecutionTokenMark
            label={evidence.value}
            style={evidence.tokenStyle}
          />
        ) : (
          evidence.value
        )}
      </div>
    </div>
  )
}

export function NarrationPanel({
  narration,
  blockedMessage,
}: {
  narration?: NarrationPayload
  blockedMessage?: string
}) {
  if (blockedMessage) {
    return (
      <div className="grid gap-2 rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-destructive/80">
          Explanation blocked
        </div>
        <p className="text-sm leading-6 text-foreground">{blockedMessage}</p>
      </div>
    )
  }

  if (!narration) {
    return (
      <div className="grid gap-2 rounded-2xl border border-border/60 bg-muted/14 px-4 py-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/90">
          Explanation
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Load a lesson to begin playback.
        </p>
      </div>
    )
  }

  const headline = narration.headline ?? { segments: narration.segments }

  return (
    <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/14 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/90">
          Explanation
        </div>
        {narration.family ? (
          <div className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {narration.family}
          </div>
        ) : null}
      </div>

      <NarrationClauseView
        label="What changed"
        clause={headline}
        className="gap-2"
      />

      {narration.reason ? (
        <div className="rounded-xl border border-border/40 bg-background/20 px-3 py-2.5">
          <NarrationClauseView label="Because" clause={narration.reason} />
        </div>
      ) : null}

      {narration.implication ? (
        <div className="rounded-xl border border-border/40 bg-background/20 px-3 py-2.5">
          <NarrationClauseView label="So now" clause={narration.implication} />
        </div>
      ) : null}

      {narration.evidence.length > 0 ? (
        <div className="grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2">
          {narration.evidence.map((evidence) => (
            <NarrationEvidenceChip key={evidence.id} evidence={evidence} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function NarrationView({
  primitive,
}: {
  primitive: NarrationPrimitiveFrameState
}) {
  return (
    <PrimitiveShell primitive={primitive}>
      <div className="flex flex-col gap-4 text-sm leading-6">
        <NarrationPanel
          narration={{
            summary: primitive.data.summary,
            segments: primitive.data.segments,
            headline: primitive.data.headline,
            reason: primitive.data.reason,
            implication: primitive.data.implication,
            evidence: primitive.data.evidence,
            family: primitive.data.family,
            sourceValues: {},
          }}
        />
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
