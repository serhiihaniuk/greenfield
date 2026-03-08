import { AlertTriangleIcon } from "lucide-react"

import type { RuntimeFailure } from "@/features/player/types"
import type { VerificationIssue, VerificationReport } from "@/domains/verification/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

type VerificationBlockerDialogProps = {
  open: boolean
  verification?: VerificationReport
  failure?: RuntimeFailure
  blockingIssues: VerificationIssue[]
  onOpenAuditMode: () => void
  onInspectInput: () => void
}

export function VerificationBlockerDialog({
  open,
  verification,
  failure,
  blockingIssues,
  onOpenAuditMode,
  onInspectInput,
}: VerificationBlockerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        data-testid="verification-blocker-dialog"
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="gap-3 border-b border-border/50 px-5 py-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="destructive">learner mode blocked</Badge>
            <Badge variant="outline">errors {verification?.errors.length ?? 0}</Badge>
            <Badge variant="outline">warnings {verification?.warnings.length ?? 0}</Badge>
          </div>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="size-5 text-destructive" />
            Verification Blocked
          </DialogTitle>
          <DialogDescription>
            This lesson output still has blocking verification issues. Open lesson audit to inspect the same runtime state with frame diffs, narration bindings, issue filters, and the event timeline instead of relying on plausible visuals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          {failure ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
              {failure.message}
            </div>
          ) : null}

          {blockingIssues.length > 0 ? (
            <div className="space-y-2">
              {blockingIssues.map((issue) => (
                <div
                  key={`${issue.code}-${issue.frameId ?? issue.eventId ?? issue.message}`}
                  className="rounded-lg border border-border/50 bg-background/60 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-foreground/90">{issue.code}</span>
                    <Badge variant="outline">{issue.kind}</Badge>
                    {issue.pedagogicalCheck ? (
                      <Badge variant="outline">{issue.pedagogicalCheck}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {issue.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 bg-background/60 p-3 text-sm text-muted-foreground">
              Verification failed, but no frame-linked blocking issues were attached to the current summary. Open audit mode for the full report.
            </div>
          )}
        </div>

        <DialogFooter className="border-border/50">
          <Button size="sm" variant="outline" onClick={onInspectInput}>
            Inspect input
          </Button>
          <Button size="sm" variant="secondary" onClick={onOpenAuditMode}>
            Open audit mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
