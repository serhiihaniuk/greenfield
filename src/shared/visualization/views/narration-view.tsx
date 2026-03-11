import { AnimatePresence, motion } from "motion/react"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  LogInIcon,
  LogOutIcon,
  PencilIcon,
  SearchIcon,
} from "lucide-react"

import type { NarrationPrimitiveFrameState } from "@/entities/visualization/primitives"
import type {
  NarrationClause,
  NarrationEvidence,
  NarrationPayload,
  VisualChangeType,
} from "@/domains/projection/types"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { ExecutionTokenMark } from "@/shared/visualization/execution-token-mark"
import { MOTION_TOKENS, useMotionContract } from "@/shared/motion/contract"
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

/* -------------------------------------------------------------------------- */
/*  NarrationCard — compact accent-bordered card for the lesson player        */
/* -------------------------------------------------------------------------- */

const visualChangeAccent: Record<VisualChangeType, string> = {
  move: "border-l-cyan-400",
  compare: "border-l-sky-400",
  mutate: "border-l-orange-400",
  result: "border-l-emerald-400",
  enter: "border-l-violet-400",
  exit: "border-l-amber-400",
}

const visualChangeIconColor: Record<VisualChangeType, string> = {
  move: "text-cyan-400",
  compare: "text-sky-400",
  mutate: "text-orange-400",
  result: "text-emerald-400",
  enter: "text-violet-400",
  exit: "text-amber-400",
}

const visualChangeIcon: Record<VisualChangeType, React.ComponentType<{ className?: string }>> = {
  move: ArrowRightIcon,
  compare: SearchIcon,
  mutate: PencilIcon,
  result: CheckCircle2Icon,
  enter: LogInIcon,
  exit: LogOutIcon,
}

type NarrationCardProps = {
  summary: string
  segments: NarrationSegmentsProps["segments"]
  visualChangeType?: VisualChangeType
  codeLine?: string
  frameId?: string
  blocked?: boolean
  placeholder?: string
}

export function NarrationCard({
  summary,
  segments,
  visualChangeType,
  codeLine,
  frameId,
  blocked,
  placeholder,
}: NarrationCardProps) {
  const { prefersReducedMotion } = useMotionContract()

  if (blocked || (!summary && segments.length === 0)) {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
        <p className="text-sm leading-6 text-muted-foreground">
          {placeholder ?? "Load a lesson to begin playback."}
        </p>
      </div>
    )
  }

  const changeType = visualChangeType ?? "move"
  const Icon = visualChangeIcon[changeType]

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/80 shadow-sm",
        "border-l-2",
        visualChangeAccent[changeType]
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5">
          <Icon
            className={cn("size-3.5", visualChangeIconColor[changeType])}
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {changeType}
          </span>
        </div>
        {codeLine ? (
          <span className="rounded-md border border-border/40 bg-muted/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {codeLine}
          </span>
        ) : null}
      </div>

      <div className="px-4 pt-1 pb-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={frameId ?? summary}
            className="text-sm leading-6 text-foreground"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
            transition={MOTION_TOKENS.shell}
          >
            <NarrationSegments summary={summary} segments={segments} />
          </motion.p>
        </AnimatePresence>
      </div>
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
