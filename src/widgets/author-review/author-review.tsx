import { useState } from "react"

import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type { VerificationIssue, VerificationReport } from "@/domains/verification/types"
import { ExecutionTokenMark } from "@/shared/visualization/execution-token-mark"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"
import {
  buildAuthorTimeline,
  collectRelatedIssues,
  formatAuthorValue,
  summarizeFrameDiff,
  summarizeExecutionTokens,
  summarizeNarrationBindings,
} from "@/widgets/author-review/model"

type AuthorReviewProps = {
  frame?: Frame
  previousFrame?: Frame
  nextFrame?: Frame
  event?: TraceEvent
  verification?: VerificationReport
  trace: TraceEvent[]
  frames: Frame[]
  selectedPrimitiveId?: string
  onInspectPreviousFrame?: () => void
  onInspectNextFrame?: () => void
  onJumpToFrameId?: (frameId: string) => void
  onJumpToEventId?: (eventId: string) => void
  onFocusPrimitiveId?: (primitiveId: string) => void
}

function StatBadge({
  label,
  value,
  variant = "outline",
}: {
  label: string
  value: string | number
  variant?: "destructive" | "outline" | "secondary"
}) {
  return <Badge variant={variant}>{label} {value}</Badge>
}

function MetaItem({
  label,
  value,
}: {
  label: string
  value: string | number | undefined
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-xs text-foreground/90">{value ?? "-"}</div>
    </div>
  )
}

function JsonBlock({
  label,
  value,
}: {
  label: string
  value: unknown
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <pre className="max-h-44 overflow-auto rounded-lg border border-border/50 bg-background/60 p-2 font-mono text-[11px] leading-relaxed text-foreground/85">
        {formatAuthorValue(value)}
      </pre>
    </div>
  )
}

function IssueList({
  issues,
  emptyText,
  hiddenCount,
  title,
  onJumpToFrameId,
  onJumpToEventId,
}: {
  issues: VerificationIssue[]
  emptyText: string
  hiddenCount: number
  title: string
  onJumpToFrameId?: (frameId: string) => void
  onJumpToEventId?: (eventId: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </div>
      {issues.length > 0 ? (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div
              key={`${issue.code}-${issue.frameId ?? issue.eventId ?? issue.message}`}
              className="rounded-lg border border-border/50 bg-background/60 p-2.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-mono text-xs text-foreground/90">{issue.code}</div>
                <Badge
                  variant={issue.severity === "error" ? "destructive" : "secondary"}
                >
                  {issue.severity}
                </Badge>
                <Badge variant="outline">{issue.kind}</Badge>
                {issue.pedagogicalCheck ? (
                  <Badge variant="outline">{issue.pedagogicalCheck}</Badge>
                ) : null}
                {issue.frameId ? <Badge variant="outline">frame {issue.frameId}</Badge> : null}
                {issue.eventId ? <Badge variant="outline">event {issue.eventId}</Badge> : null}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {issue.message}
              </p>
              {issue.frameId || issue.eventId ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {issue.frameId ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onJumpToFrameId?.(issue.frameId!)}
                    >
                      Jump to frame
                    </Button>
                  ) : null}
                  {issue.eventId ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onJumpToEventId?.(issue.eventId!)}
                    >
                      Jump to event
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {hiddenCount > 0 ? (
            <div className="text-xs text-muted-foreground">
              +{hiddenCount} more {title.toLowerCase()} hidden from this summary.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">{emptyText}</div>
      )}
    </div>
  )
}

function DiffPanel({
  diff,
  title,
  emptyText,
  selectedPrimitiveId,
  onFocusPrimitiveId,
}: {
  diff: ReturnType<typeof summarizeFrameDiff>
  title: string
  emptyText: string
  selectedPrimitiveId?: string
  onFocusPrimitiveId?: (primitiveId: string) => void
}) {
  return (
    <div className="space-y-2.5 rounded-lg border border-border/50 bg-background/55 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </div>
        {diff ? <Badge variant="outline">groups {diff.changedGroupCount}</Badge> : null}
      </div>
      {diff ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            <StatBadge label="add" value={diff.summary.primitiveAdditions} />
            <StatBadge label="remove" value={diff.summary.primitiveRemovals} />
            <StatBadge label="data" value={diff.summary.dataChanges} />
            <StatBadge label="pointer" value={diff.summary.pointerChanges} />
            <StatBadge label="highlight" value={diff.summary.highlightChanges} />
            <StatBadge label="annot" value={diff.summary.annotationChanges} />
            <StatBadge label="viewport" value={diff.summary.viewportChanges} />
          </div>
          {diff.primitiveChanges.length > 0 ? (
            <div className="space-y-1.5">
              {diff.primitiveChanges.map((change) => (
                <div
                  key={change.primitiveId}
                  className="flex flex-wrap items-center gap-2 text-xs"
                >
                  <span className="font-mono text-foreground/90">{change.primitiveId}</span>
                  <Badge variant="outline">{change.primitiveKind}</Badge>
                  <span className="text-muted-foreground">
                    {change.changeKinds.join(", ")}
                  </span>
                  <Button
                    size="xs"
                    variant={
                      selectedPrimitiveId === change.primitiveId
                        ? "secondary"
                        : "outline"
                    }
                    onClick={() => onFocusPrimitiveId?.(change.primitiveId)}
                  >
                    {selectedPrimitiveId === change.primitiveId
                      ? "Focused"
                      : "Focus primitive"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No primitive-level changes recorded.
            </div>
          )}
        </>
      ) : (
        <div className="text-xs text-muted-foreground">{emptyText}</div>
      )}
    </div>
  )
}

export function AuthorReview({
  frame,
  previousFrame,
  nextFrame,
  event,
  verification,
  trace,
  frames,
  selectedPrimitiveId,
  onInspectPreviousFrame,
  onInspectNextFrame,
  onJumpToFrameId,
  onJumpToEventId,
  onFocusPrimitiveId,
}: AuthorReviewProps) {
  const [issueFilter, setIssueFilter] = useState<"all" | "blocking" | "warnings">("all")
  const issueSummary = collectRelatedIssues(verification, frame, event)
  const narrationBindings = summarizeNarrationBindings(frame, event)
  const executionTokens = summarizeExecutionTokens(frame)
  const diffFromPrevious = summarizeFrameDiff(previousFrame, frame)
  const diffToNext = summarizeFrameDiff(frame, nextFrame)
  const timeline = buildAuthorTimeline(trace, frames, verification, frame?.id)
  const frameCheckCounts = {
    pass: frame?.checks.filter((check) => check.status === "pass").length ?? 0,
    warn: frame?.checks.filter((check) => check.status === "warn").length ?? 0,
    fail: frame?.checks.filter((check) => check.status === "fail").length ?? 0,
  }
  const filteredIssues =
    issueFilter === "blocking"
      ? issueSummary.blocking
      : issueFilter === "warnings"
        ? issueSummary.warnings
        : [...issueSummary.blocking, ...issueSummary.warnings]

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Execution Context</CardTitle>
          <CardDescription>
            Inspect the active semantic event and the learner-visible frame bound to it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <StatBadge
              label="errors"
              value={verification?.errors.length ?? 0}
              variant={verification?.errors.length ? "destructive" : "outline"}
            />
            <StatBadge
              label="warnings"
              value={verification?.warnings.length ?? 0}
              variant={verification?.warnings.length ? "secondary" : "outline"}
            />
            <StatBadge label="change" value={frame?.visualChangeType ?? "-"} />
            <StatBadge label="code" value={frame?.codeLine ?? event?.codeLine ?? "-"} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={onInspectPreviousFrame}
              disabled={!previousFrame}
            >
              Inspect previous frame
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={onInspectNextFrame}
              disabled={!nextFrame}
            >
              Inspect next frame
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetaItem label="event id" value={event?.id} />
            <MetaItem label="event type" value={event?.type} />
            <MetaItem label="scope" value={event?.scopeId} />
            <MetaItem label="frame id" value={frame?.id} />
            <MetaItem label="source event" value={frame?.sourceEventId} />
            <MetaItem label="tags" value={event?.tags?.join(", ") || "-"} />
          </div>
          <Separator />
          <div className="grid gap-3 lg:grid-cols-2">
            <JsonBlock label="event payload" value={event?.payload ?? {}} />
            <JsonBlock label="event snapshot" value={event?.snapshot ?? {}} />
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Frame Contract</CardTitle>
          <CardDescription>
            Frame-level checks stay attached to the same runtime state as learner mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <StatBadge label="pass" value={frameCheckCounts.pass} />
            <StatBadge
              label="warn"
              value={frameCheckCounts.warn}
              variant={frameCheckCounts.warn ? "secondary" : "outline"}
            />
            <StatBadge
              label="fail"
              value={frameCheckCounts.fail}
              variant={frameCheckCounts.fail ? "destructive" : "outline"}
            />
          </div>
          {frame?.checks.length ? (
            <div className="space-y-2">
              {frame.checks.map((check) => (
                <div
                  key={check.id}
                  className="rounded-lg border border-border/50 bg-background/60 p-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-mono text-xs text-foreground/90">{check.kind}</div>
                    <Badge
                      variant={
                        check.status === "fail"
                          ? "destructive"
                          : check.status === "warn"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {check.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {check.message}
                  </p>
                  {check.meta ? (
                    <div className="mt-2">
                      <JsonBlock label="check meta" value={check.meta} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No frame checks are attached.</div>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Execution Tokens</CardTitle>
          <CardDescription>
            Shared execution objects should stay recognizable across the synchronized views in this frame.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <StatBadge label="tokens" value={executionTokens.length} />
          </div>
          {executionTokens.length > 0 ? (
            <div className="space-y-2">
              {executionTokens.map((token) => (
                <div
                  key={token.id}
                  className="rounded-lg border border-border/50 bg-background/60 p-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <ExecutionTokenMark label={token.label} style={token.style} />
                    <Badge variant="outline">{token.id}</Badge>
                    <Badge variant="outline">views {token.sourceCount}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {token.sources.map((source) => (
                      <Badge key={`${token.id}-${source}`} variant="secondary">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No shared execution tokens are projected in the active frame.
            </div>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Frame Diffs</CardTitle>
          <CardDescription>
            Compare the active frame against its adjacent states to expose overloaded or empty transitions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          <DiffPanel
            diff={diffFromPrevious}
            title="previous -> current"
            emptyText="No previous frame is available."
            selectedPrimitiveId={selectedPrimitiveId}
            onFocusPrimitiveId={onFocusPrimitiveId}
          />
          <DiffPanel
            diff={diffToNext}
            title="current -> next"
            emptyText="No next frame is available."
            selectedPrimitiveId={selectedPrimitiveId}
            onFocusPrimitiveId={onFocusPrimitiveId}
          />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Narration Binding</CardTitle>
          <CardDescription>
            Verify that narration is attached to the same source values the semantic event emitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <StatBadge label="segments" value={frame?.narration.segments.length ?? 0} />
            <StatBadge label="source keys" value={narrationBindings.sourceValueKeys.length} />
            <Badge
              variant={
                narrationBindings.synchronizedToEvent === false
                  ? "destructive"
                  : narrationBindings.synchronizedToEvent === true
                    ? "outline"
                    : "secondary"
              }
            >
              {narrationBindings.synchronizedToEvent === undefined
                ? "no event binding"
                : narrationBindings.synchronizedToEvent
                  ? "source synced"
                  : "source mismatch"}
            </Badge>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/60 p-3 text-sm leading-relaxed text-foreground/90">
            {frame?.narration.summary ?? "No narration summary for the active frame."}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                event payload keys
              </div>
              <div className="text-xs text-foreground/85">
                {narrationBindings.eventPayloadKeys.join(", ") || "-"}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                narration source keys
              </div>
              <div className="text-xs text-foreground/85">
                {narrationBindings.sourceValueKeys.join(", ") || "-"}
              </div>
            </div>
          </div>
          {(narrationBindings.missingNarrationKeys.length > 0 ||
            narrationBindings.extraNarrationKeys.length > 0) ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/8 p-3 text-xs text-destructive">
              <div>Missing narration keys: {narrationBindings.missingNarrationKeys.join(", ") || "none"}</div>
              <div className="mt-1">Extra narration keys: {narrationBindings.extraNarrationKeys.join(", ") || "none"}</div>
            </div>
          ) : null}
          {frame?.narration.segments.length ? (
            <div className="space-y-2">
              {frame.narration.segments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-background/60 p-2.5 text-xs"
                >
                  <span className="font-mono text-foreground/90">{segment.id}</span>
                  <Badge variant="outline">{segment.tone ?? "default"}</Badge>
                  {segment.targetId ? <Badge variant="outline">{segment.targetId}</Badge> : null}
                  {segment.tokenStyle ? (
                    <ExecutionTokenMark label={segment.text} style={segment.tokenStyle} />
                  ) : (
                    <span className="text-muted-foreground">{segment.text}</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          <JsonBlock label="narration source values" value={frame?.narration.sourceValues ?? {}} />
        </CardContent>
      </Card>

      <Card size="sm" className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Issue Inbox</CardTitle>
          <CardDescription>
            Filter the relevant issues for this runtime state, then jump directly to the linked frame or event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="xs"
              variant={issueFilter === "all" ? "secondary" : "outline"}
              onClick={() => setIssueFilter("all")}
            >
              All {issueSummary.blocking.length + issueSummary.warnings.length}
            </Button>
            <Button
              size="xs"
              variant={issueFilter === "blocking" ? "secondary" : "outline"}
              onClick={() => setIssueFilter("blocking")}
            >
              Blocking {issueSummary.blocking.length}
            </Button>
            <Button
              size="xs"
              variant={issueFilter === "warnings" ? "secondary" : "outline"}
              onClick={() => setIssueFilter("warnings")}
            >
              Warnings {issueSummary.warnings.length}
            </Button>
          </div>
          <IssueList
            issues={filteredIssues}
            emptyText="No relevant issues are attached to this frame, event, or the global runtime report."
            hiddenCount={
              issueFilter === "blocking"
                ? issueSummary.hiddenBlockingCount
                : issueFilter === "warnings"
                  ? issueSummary.hiddenWarningCount
                  : issueSummary.hiddenBlockingCount + issueSummary.hiddenWarningCount
            }
            title={issueFilter === "all" ? "Relevant Issues" : issueFilter === "blocking" ? "Blocking Issues" : "Warnings"}
            onJumpToFrameId={onJumpToFrameId}
            onJumpToEventId={onJumpToEventId}
          />
        </CardContent>
      </Card>

      <Card size="sm" className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>
            Audit the full frame-backed event stream and jump the live player to any step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {timeline.map((entry, index) => (
              <div
                key={entry.frameId}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-background/60 p-2.5"
              >
                <Badge variant={entry.isActive ? "secondary" : "outline"}>
                  {entry.isActive ? "active" : `step ${index + 1}`}
                </Badge>
                <Badge variant="outline">{entry.eventType}</Badge>
                <Badge variant="outline">{entry.codeLine}</Badge>
                {entry.blockingIssueCount > 0 ? (
                  <Badge variant="destructive">errors {entry.blockingIssueCount}</Badge>
                ) : null}
                {entry.warningIssueCount > 0 ? (
                  <Badge variant="secondary">warnings {entry.warningIssueCount}</Badge>
                ) : null}
                <span className="font-mono text-xs text-muted-foreground">
                  {entry.eventId}
                </span>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    variant={entry.isActive ? "secondary" : "outline"}
                    onClick={() => onJumpToFrameId?.(entry.frameId)}
                  >
                    {entry.isActive ? "Inspecting" : "Inspect"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
