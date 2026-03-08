import { useEffect, useEffectEvent, useMemo, useState, useCallback } from "react"
import {
  AlertTriangleIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  FileJsonIcon,
  KeyboardIcon,
  ListTreeIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react"

import { useHotkey } from "@tanstack/react-hotkeys"

import { listLessons } from "@/domains/lessons/loaders"
import type { VisualizationMode } from "@/domains/lessons/types"
import { defineCodeTracePrimitiveFrameState } from "@/entities/visualization/primitives"
import type { PrimitiveFrameState } from "@/entities/visualization/types"
import { PLAYBACK_SPEED_MS } from "@/features/player/runtime"
import {
  buildPlainCodePresentation,
  type CodePresentation,
} from "@/features/player/code-presentation"
import { useLessonPlayerStore } from "@/features/player/store"
import { AuthorReview } from "@/widgets/author-review/author-review"
import { collectRelatedIssues } from "@/widgets/author-review/model"
import { PrimitiveRenderer } from "@/shared/visualization/primitive-renderer"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/ui/resizable"
import { Textarea } from "@/shared/ui/textarea"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { ThemeToggle } from "@/shared/ui/theme-toggle"

type LessonPlayerProps = {
  lessonId?: string
}

const MODE_OPTIONS: VisualizationMode[] = ["focus", "full", "code", "compare"]
const PLAYBACK_SPEED_OPTIONS = ["0.5x", "1x", "1.5x", "2x"] as const

const HOTKEYS = [
  { keys: ["Space"], label: "Play / Pause" },
  { keys: ["W"], label: "Play" },
  { keys: ["S"], label: "Stop" },
  { keys: ["Left", "A"], label: "Previous frame" },
  { keys: ["Right", "D"], label: "Next frame" },
  { keys: ["Home"], label: "Jump to first frame" },
  { keys: ["End"], label: "Jump to last frame" },
  { keys: ["R"], label: "Reset" },
  { keys: ["]"], label: "Speed up" },
  { keys: ["["], label: "Speed down" },
  { keys: ["Q"], label: "Toggle author mode" },
  { keys: ["/"], label: "Show keyboard shortcuts" },
] as const

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      data-slot="kbd"
      className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-background/20 px-1 font-mono text-[10px] leading-none"
    >
      {children}
    </kbd>
  )
}

function splitPrimitives(primitives: PrimitiveFrameState[]) {
  const primaryPrimitives = primitives.filter(
    (primitive) =>
      primitive.viewport?.role === "primary" ||
      (!primitive.viewport?.role && primitive.kind !== "state")
  )
  const secondaryPrimitives = primitives.filter(
    (primitive) =>
      primitive.viewport?.role === "secondary" ||
      primitive.viewport?.role === "tertiary" ||
      (!primitive.viewport?.role && primitive.kind === "state")
  )

  return {
    primaryPrimitives:
      primaryPrimitives.length > 0 ? primaryPrimitives : primitives,
    secondaryPrimitives,
  }
}

function buildCodeTracePrimitive(
  code: CodePresentation | undefined,
  activeLineId: string | undefined
) {
  return defineCodeTracePrimitiveFrameState({
    id: "code-trace",
    kind: "code-trace",
    title: "Code Trace",
    subtitle: "Active line highlighting stays synchronized to the current frame.",
    data: {
      lines: code?.lines ?? [],
      activeLineId,
      background: code?.background,
      foreground: code?.foreground,
    },
    viewport: {
      role: "secondary",
      preferredWidth: 380,
      minHeight: 360,
    },
  })
}

export function LessonPlayer({ lessonId }: LessonPlayerProps) {
  const {
    lesson,
    lessonId: activeLessonId,
    approach,
    approachId,
    mode,
    inputSource,
    selectedPresetId,
    rawInput,
    trace,
    frames,
    currentFrameIndex,
    playbackStatus,
    playbackSpeed,
    verification,
    authorMode,
    failure,
    initialize,
    setLessonId,
    setApproachId,
    setMode,
    selectPreset,
    setRawInput,
    applyCustomInput,
    play,
    pause,
    previousFrame,
    nextFrame,
    jumpToFirst,
    jumpToLast,
    reset,
    scrubTo,
    setPlaybackSpeed,
    toggleAuthorMode,
  } = useLessonPlayerStore((state) => state)

  const [codePresentation, setCodePresentation] = useState<CodePresentation>()
  const [inputModalOpen, setInputModalOpen] = useState(false)
  const [stateCollapsed, setStateCollapsed] = useState(false)
  const [hotkeysOpen, setHotkeysOpen] = useState(false)
  const lessons = useMemo(() => listLessons(), [])
  const activeFrame = frames[currentFrameIndex]
  const previousVisibleFrame =
    currentFrameIndex > 0 ? frames[currentFrameIndex - 1] : undefined
  const nextVisibleFrame =
    currentFrameIndex + 1 < frames.length ? frames[currentFrameIndex + 1] : undefined
  const activeEvent = trace.find((event) => event.id === activeFrame?.sourceEventId)
  const activePrimitives = activeFrame?.primitives ?? []
  const { primaryPrimitives, secondaryPrimitives } = splitPrimitives(activePrimitives)
  const hasSecondaryStage = secondaryPrimitives.length > 0
  const currentFrameLabel =
    frames.length === 0 ? "0/0" : `${currentFrameIndex + 1}/${frames.length}`
  const visualChangeLabel = activeFrame?.visualChangeType ?? "-"
  const verificationBlocked = verification?.isValid === false
  const learnerModeBlocked = verificationBlocked && !authorMode
  const blockingIssues = collectRelatedIssues(verification, activeFrame, activeEvent, 3)
  const codeTracePrimitive = buildCodeTracePrimitive(codePresentation, activeFrame?.codeLine)

  useEffect(() => {
    initialize(lessonId)
  }, [initialize, lessonId])

  useEffect(() => {
    if (!approach) return
    let cancelled = false
    setCodePresentation(buildPlainCodePresentation(approach.codeTemplate))

    import("@/features/player/code")
      .then(({ tokenizeCodeTemplate }) =>
        tokenizeCodeTemplate(approach.codeTemplate)
      )
      .then((presentation) => {
        if (!cancelled) setCodePresentation(presentation)
      })
      .catch(() => {
        // Leave the plain-text presentation in place if highlighting fails.
      })

    return () => {
      cancelled = true
    }
  }, [approach])

  useEffect(() => {
    if (failure?.kind === "input-parse") setInputModalOpen(true)
  }, [failure])

  const stepPlayback = useEffectEvent(() => {
    if (playbackStatus === "playing") nextFrame()
  })

  useEffect(() => {
    if (playbackStatus !== "playing") return
    const timer = window.setTimeout(stepPlayback, PLAYBACK_SPEED_MS[playbackSpeed])
    return () => {
      window.clearTimeout(timer)
    }
  }, [currentFrameIndex, playbackSpeed, playbackStatus])

  const togglePlayback = useCallback(
    () => (playbackStatus === "playing" ? pause() : play()),
    [playbackStatus, pause, play]
  )

  const cycleSpeed = useCallback(
    (direction: 1 | -1) => {
      const idx = PLAYBACK_SPEED_OPTIONS.indexOf(playbackSpeed)
      const next = PLAYBACK_SPEED_OPTIONS[idx + direction]
      if (next) setPlaybackSpeed(next)
    },
    [playbackSpeed, setPlaybackSpeed]
  )

  useHotkey("Space", togglePlayback)
  useHotkey("W", play)
  useHotkey("S", pause)
  useHotkey("ArrowLeft", previousFrame)
  useHotkey("A", previousFrame)
  useHotkey("ArrowRight", nextFrame)
  useHotkey("D", nextFrame)
  useHotkey("Home", jumpToFirst)
  useHotkey("End", jumpToLast)
  useHotkey("R", reset)
  useHotkey("]", () => cycleSpeed(1))
  useHotkey("[", () => cycleSpeed(-1))
  useHotkey("Q", toggleAuthorMode)
  useHotkey("/", () => setHotkeysOpen((value) => !value))

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="relative min-h-0 flex-1">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            id="left"
            defaultSize="27%"
            minSize="12%"
            maxSize="45%"
            collapsible
            collapsedSize="0%"
          >
            <div
              data-testid="context-column"
              className="flex h-full min-h-0 flex-col"
            >
              {hasSecondaryStage ? (
                <div
                  data-testid="secondary-primitives-region"
                  className="shrink-0 border-b border-border/30"
                >
                  <button
                    className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setStateCollapsed((value) => !value)}
                  >
                    {stateCollapsed ? (
                      <ChevronsUpDownIcon className="size-3" />
                    ) : (
                      <ChevronsDownUpIcon className="size-3" />
                    )}
                    State
                  </button>
                  {!stateCollapsed ? (
                    <div
                      data-testid="secondary-primitives-scroll"
                      className="overflow-y-auto px-3 pb-3"
                      style={{ maxHeight: "min(32rem, 58vh)" }}
                    >
                      <div className="grid auto-rows-max gap-2">
                        {secondaryPrimitives.map((primitive) => (
                          <PrimitiveRenderer
                            key={primitive.id}
                            primitive={primitive}
                            role="secondary"
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="shrink-0 border-b border-border/20 px-3 py-1.5">
                <p className="text-xs leading-relaxed text-foreground/80">
                  {learnerModeBlocked
                    ? "Learner mode is blocked until verification issues are inspected in author mode."
                    : activeFrame?.narration.summary ?? "Load a lesson to begin playback."}
                </p>
              </div>

              <div
                data-testid="reference-column"
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <PrimitiveRenderer primitive={codeTracePrimitive} role="reference" />
                {failure ? (
                  <div className="shrink-0 border-t border-destructive/30 bg-destructive/8 px-3 py-2">
                    <div className="text-xs font-medium text-destructive">
                      Runtime failure · {failure.kind}
                    </div>
                    <p className="mt-1 text-xs text-destructive/80">{failure.message}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel id="stage" defaultSize="73%" minSize="30%">
            <section
              data-testid="stage-scroll-region"
              className="flex h-full flex-col overflow-auto p-4"
            >
              <div className="grid auto-rows-max gap-4">
                {primaryPrimitives.map((primitive) => (
                  <PrimitiveRenderer
                    key={primitive.id}
                    primitive={primitive}
                    role="primary"
                  />
                ))}
              </div>
            </section>
          </ResizablePanel>
        </ResizablePanelGroup>

        {learnerModeBlocked ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/96 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-destructive/30 bg-card p-5 shadow-2xl">
              <div className="flex flex-wrap gap-2">
                <Badge variant="destructive">learner mode blocked</Badge>
                <Badge variant="outline">errors {verification?.errors.length ?? 0}</Badge>
                <Badge variant="outline">warnings {verification?.warnings.length ?? 0}</Badge>
              </div>
              <h2 className="mt-3 flex items-center gap-2 text-lg font-medium text-foreground">
                <AlertTriangleIcon className="size-5 text-destructive" />
                Verification failed before learner mode could be trusted.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This lesson output still has blocking verification issues. Open author mode to inspect the same runtime state with frame diffs, narration bindings, and verification context instead of relying on plausible visuals.
              </p>
              {failure ? (
                <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
                  {failure.message}
                </div>
              ) : null}
              <div className="mt-4 grid gap-2">
                {blockingIssues.blocking.map((issue) => (
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={toggleAuthorMode}>
                  Open author mode
                </Button>
                <Button size="sm" variant="outline" onClick={() => setInputModalOpen(true)}>
                  Inspect input
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {authorMode ? (
          <div
            data-testid="author-review-drawer"
            className="absolute inset-x-0 bottom-0 z-10 border-t border-border/40 bg-card/95 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 border-b border-border/20 px-4 py-1.5">
              <Badge variant="outline">change {visualChangeLabel}</Badge>
              <Badge variant="outline">status {playbackStatus}</Badge>
              <Badge
                variant={verification?.isValid === false ? "destructive" : "outline"}
              >
                verification {verification?.isValid === false ? "blocked" : "ok"}
              </Badge>
              <Badge variant="outline">code {activeFrame?.codeLine ?? "-"}</Badge>
              <Badge variant="outline">
                views {primaryPrimitives.length + secondaryPrimitives.length}
              </Badge>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-4">
              <AuthorReview
                frame={activeFrame}
                previousFrame={previousVisibleFrame}
                nextFrame={nextVisibleFrame}
                event={activeEvent}
                verification={verification}
              />
            </div>
          </div>
        ) : null}
      </div>

      <footer className="flex h-12 shrink-0 items-center gap-1 border-t border-border/40 px-2">
        <Select
          value={activeLessonId || null}
          onValueChange={(value) => value && setLessonId(value)}
        >
          <SelectTrigger size="sm" aria-label="Lesson">
            <SelectValue placeholder="Lesson" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Lessons</SelectLabel>
              {lessons.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={approachId || null}
          onValueChange={(value) => value && setApproachId(value)}
        >
          <SelectTrigger size="sm" aria-label="Approach">
            <SelectValue placeholder="Approach" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Approaches</SelectLabel>
              {lesson?.approaches.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={mode || null} onValueChange={(value) => value && setMode(value)}>
          <SelectTrigger size="sm" aria-label="Mode">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Modes</SelectLabel>
              {MODE_OPTIONS.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={selectedPresetId ?? null}
          onValueChange={(value) => value && selectPreset(value)}
        >
          <SelectTrigger size="sm" aria-label="Preset">
            <SelectValue placeholder="Preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Presets</SelectLabel>
              {approach?.presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="mx-1 h-5 border-l border-border/30" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={jumpToFirst}
                  disabled={learnerModeBlocked}
                  aria-label="First frame"
                />
              }
            >
              <ChevronFirstIcon />
            </TooltipTrigger>
            <TooltipContent>First frame <Kbd>Home</Kbd></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={previousFrame}
                  disabled={learnerModeBlocked}
                  aria-label="Previous frame"
                />
              }
            >
              <ChevronLeftIcon />
            </TooltipTrigger>
            <TooltipContent>Previous <Kbd>Left</Kbd> <Kbd>A</Kbd></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="xs"
                  onClick={playbackStatus === "playing" ? pause : play}
                  disabled={learnerModeBlocked}
                />
              }
            >
              {playbackStatus === "playing" ? (
                <PauseIcon data-icon="inline-start" />
              ) : (
                <PlayIcon data-icon="inline-start" />
              )}
              {playbackStatus === "playing" ? "Pause" : "Play"}
            </TooltipTrigger>
            <TooltipContent>
              {playbackStatus === "playing" ? "Pause" : "Play"} <Kbd>Space</Kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={nextFrame}
                  disabled={learnerModeBlocked}
                  aria-label="Next frame"
                />
              }
            >
              <ChevronRightIcon />
            </TooltipTrigger>
            <TooltipContent>Next <Kbd>Right</Kbd> <Kbd>D</Kbd></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={jumpToLast}
                  disabled={learnerModeBlocked}
                  aria-label="Last frame"
                />
              }
            >
              <ChevronLastIcon />
            </TooltipTrigger>
            <TooltipContent>Last frame <Kbd>End</Kbd></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={reset}
                  disabled={learnerModeBlocked}
                  aria-label="Reset playback"
                />
              }
            >
              <RotateCcwIcon />
            </TooltipTrigger>
            <TooltipContent>Reset <Kbd>R</Kbd></TooltipContent>
          </Tooltip>
        </div>

        <div className="mx-1 h-5 border-l border-border/30" />

        <input
          aria-label="Timeline"
          className="h-1 min-w-0 flex-1 accent-primary"
          disabled={frames.length <= 1 || learnerModeBlocked}
          max={Math.max(frames.length - 1, 0)}
          min={0}
          onChange={(event) => scrubTo(Number(event.currentTarget.value))}
          step={1}
          type="range"
          value={Math.min(currentFrameIndex, Math.max(frames.length - 1, 0))}
        />
        <span className="ml-1.5 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
          {currentFrameLabel}
        </span>

        <div className="mx-1 h-5 border-l border-border/30" />

        <Select
          value={playbackSpeed}
          onValueChange={(value) => value && setPlaybackSpeed(value)}
        >
          <SelectTrigger size="sm" className="w-[4.5rem]" aria-label="Playback speed">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Speed</SelectLabel>
              {PLAYBACK_SPEED_OPTIONS.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant={inputModalOpen ? "secondary" : "ghost"}
                onClick={() => setInputModalOpen((value) => !value)}
                aria-label="Custom input"
              />
            }
          >
            <FileJsonIcon />
          </TooltipTrigger>
          <TooltipContent>Custom input</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="xs"
                variant={learnerModeBlocked ? "destructive" : authorMode ? "secondary" : "ghost"}
                onClick={toggleAuthorMode}
              />
            }
          >
            <ListTreeIcon data-icon="inline-start" />
            Author
          </TooltipTrigger>
          <TooltipContent>Author mode <Kbd>Q</Kbd></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setHotkeysOpen(true)}
                aria-label="Keyboard shortcuts"
              />
            }
          >
            <KeyboardIcon />
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts <Kbd>/</Kbd></TooltipContent>
        </Tooltip>

        <ThemeToggle className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground" />
      </footer>

      <Dialog open={hotkeysOpen} onOpenChange={setHotkeysOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription className="sr-only">
              List of available keyboard shortcuts for the lesson player.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1">
            {HOTKEYS.map(({ keys, label }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="flex items-center gap-1">
                  {keys.map((key, index) => (
                    <span key={key} className="flex items-center gap-1">
                      {index > 0 ? (
                        <span className="text-[10px] text-muted-foreground">/</span>
                      ) : null}
                      <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border/60 bg-muted/40 px-1.5 font-mono text-[11px] text-foreground/70">
                        {key}
                      </kbd>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inputModalOpen} onOpenChange={setInputModalOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
          <DialogHeader className="pr-8">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle>Custom Input</DialogTitle>
                <DialogDescription>
                  Paste lesson JSON to rebuild the current runtime without leaving the player.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{inputSource}</Badge>
                <DialogClose
                  render={
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Close custom input"
                    />
                  }
                >
                  <XIcon />
                </DialogClose>
              </div>
            </div>
          </DialogHeader>
          <Textarea
            aria-label="Custom input editor"
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            rows={12}
            className="font-mono text-xs"
          />
          <DialogFooter className="sm:justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectedPresetId && selectPreset(selectedPresetId)}
            >
              Use preset
            </Button>
            <Button size="sm" onClick={applyCustomInput}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
