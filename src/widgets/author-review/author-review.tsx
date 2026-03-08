import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type { VerificationReport } from "@/domains/verification/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"

type AuthorReviewProps = {
  frame?: Frame
  event?: TraceEvent
  verification?: VerificationReport
}

export function AuthorReview({
  frame,
  event,
  verification,
}: AuthorReviewProps) {
  const relatedIssues = [...(verification?.errors ?? []), ...(verification?.warnings ?? [])]
    .filter((issue) => {
      if (!frame && !event) {
        return true
      }

      return issue.frameId === frame?.id || issue.eventId === event?.id
    })
    .slice(0, 6)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Author Review</CardTitle>
        <CardDescription>
          Runtime inspection uses the same trace and frames as learner mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            errors {verification?.errors.length ?? 0}
          </Badge>
          <Badge variant="outline">
            warnings {verification?.warnings.length ?? 0}
          </Badge>
        </div>
        <div className="grid gap-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">
              Event
            </div>
            <div className="font-mono text-xs">
              {event ? `${event.id} · ${event.type}` : "No active event"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wide">
              Frame
            </div>
            <div className="font-mono text-xs">
              {frame ? `${frame.id} · ${frame.visualChangeType}` : "No active frame"}
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="text-muted-foreground text-xs uppercase tracking-wide">
            Frame Checks
          </div>
          {frame?.checks.length ? (
            frame.checks.map((check) => (
              <div
                key={check.id}
                className="rounded-xl border border-border/60 bg-muted/18 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-xs">{check.kind}</div>
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
                <p className="mt-2 text-xs text-muted-foreground">{check.message}</p>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">No frame checks</div>
          )}
        </div>
        <div className="grid gap-2">
          <div className="text-muted-foreground text-xs uppercase tracking-wide">
            Related Issues
          </div>
          {relatedIssues.length > 0 ? (
            relatedIssues.map((issue) => (
              <div
                key={`${issue.code}-${issue.frameId ?? issue.eventId ?? issue.message}`}
                className="rounded-xl border border-border/60 bg-muted/18 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-xs">{issue.code}</div>
                  <Badge
                    variant={issue.severity === "error" ? "destructive" : "secondary"}
                  >
                    {issue.severity}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{issue.message}</p>
                <div
                  className={cn(
                    "mt-2 text-[11px] uppercase tracking-wide text-muted-foreground"
                  )}
                >
                  {issue.kind}
                  {issue.pedagogicalCheck ? ` · ${issue.pedagogicalCheck}` : ""}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">
              No related verification issues for the active frame.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
