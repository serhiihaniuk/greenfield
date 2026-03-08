import { useEffect, useEffectEvent, useMemo, useState, useCallback } from "react"
import {
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
import { tokenizeCodeTemplate, type CodePresentation } from "@/features/player/code"
import { PLAYBACK_SPEED_MS } from "@/features/player/runtime"
import { useLessonPlayerStore } from "@/features/player/store"
import { AuthorReview } from "@/widgets/author-review/author-review"
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog"

type LessonPlayerProps = {
  lessonId?: string
}

const MODE_OPTIONS: VisualizationMode[] = ["focus", "full", "code", "compare"]
const PLAYBACK_SPEED_OPTIONS = ["0.5x", "1x", "1.5x", "2x"] as const

const HOTKEYS = [
  { keys: ["Space"], label: "Play / Pause" },
  { keys: ["W"], label: "Play" },
  { keys: ["S"], label: "Stop" },
  { keys: ["←", "A"], label: "Previous frame" },
  { keys: ["→", "D"], label: "Next frame" },
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
  const activeEvent = trace.find((event) => event.id === activeFrame?.sourceEventId)
  const activePrimitives = activeFrame?.primitives ?? []
  const { primaryPrimitives, secondaryPrimitives } = splitPrimitives(activePrimitives)
  const hasSecondaryStage = secondaryPrimitives.length > 0
  const currentFrameLabel =
    frames.length === 0 ? "0/0" : `${currentFrameIndex + 1}/${frames.length}`
  const visualChangeLabel = activeFrame?.visualChangeType ?? "—"
  const codeTracePrimitive = buildCodeTracePrimitive(codePresentation, activeFrame?.codeLine)

  useEffect(() => {
    initialize(lessonId)
  }, [initialize, lessonId])

  useEffect(() => {
    if (!approach) return
    let cancelled = false
    tokenizeCodeTemplate(approach.codeTemplate).then((presentation) => {
      if (!cancelled) setCodePresentation(presentation)
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

  // ─── Keyboard Shortcuts ───
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
  useHotkey("/", () => setHotkeysOpen((v) => !v))

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
      {/* ─── Narration Strip ─── */}
      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-border/20 px-4">
        <p className="flex-1 truncate text-sm text-foreground/80">
          {activeFrame?.narration.summary ?? "Load a lesson to begin playback."}
        </p>
        {activeFrame?.codeLine ? (
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            L{activeFrame.codeLine}
          </span>
        ) : null}
      </div>

      {/* ─── Main Content ─── */}
      <div className="relative flex-1 min-h-0">
        <ResizablePanelGroup orientation="horizontal">
          {/* Left panel — state (top) + code trace (bottom) */}
          <ResizablePanel
            id="left"
            defaultSize="27%"
            minSize="12%"
            maxSize="45%"
            collapsible
            collapsedSize="0%"
          >
            <div className="flex h-full flex-col min-h-0">
              {/* State — top, content-sized, collapsible */}
              {hasSecondaryStage ? (
                <div className="shrink-0 border-b border-border/30">
                  <button
                    className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setStateCollapsed((v) => !v)}
                  >
                    {stateCollapsed ? (
                      <ChevronsUpDownIcon className="size-3" />
                    ) : (
                      <ChevronsDownUpIcon className="size-3" />
                    )}
                    State
                  </button>
                  {!stateCollapsed ? (
                    <div className="grid auto-rows-max gap-2 px-3 pb-3">
                      {secondaryPrimitives.map((primitive) => (
                        <PrimitiveRenderer
                          key={primitive.id}
                          primitive={primitive}
                          role="secondary"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Code trace — fills remaining space */}
              <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
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

          {/* Stage — primary visualization */}
          <ResizablePanel id="stage" defaultSize="73%" minSize="30%">
            <section className="flex h-full flex-col overflow-auto p-4">
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

        {/* Author Mode Drawer */}
        {authorMode ? (
          <div className="absolute inset-x-0 bottom-0 z-10 border-t border-border/40 bg-card/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-border/20 px-4 py-1.5">
              <Badge variant="outline">change {visualChangeLabel}</Badge>
              <Badge variant="outline">status {playbackStatus}</Badge>
              <Badge
                variant={
                  verification?.isValid === false ? "destructive" : "outline"
                }
              >
                verification{" "}
                {verification?.isValid === false ? "blocked" : "ok"}
              </Badge>
              <Badge variant="outline">
                code {activeFrame?.codeLine ?? "—"}
              </Badge>
              <Badge variant="outline">
                views {primaryPrimitives.length + secondaryPrimitives.length}
              </Badge>
            </div>
            <div className="max-h-[260px] overflow-y-auto p-4">
              <AuthorReview
                frame={activeFrame}
                event={activeEvent}
                verification={verification}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* ─── Bottom Toolbar ─── */}
      <footer className="flex h-12 shrink-0 items-center gap-1 border-t border-border/40 px-2">
        <Select
          value={activeLessonId || null}
          onValueChange={(value) => value && setLessonId(value)}
        >
          <SelectTrigger size="sm">
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
          <SelectTrigger size="sm">
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

        <Select
          value={mode || null}
          onValueChange={(value) => value && setMode(value)}
        >
          <SelectTrigger size="sm">
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
          <SelectTrigger size="sm">
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
            <TooltipTrigger render={<Button size="icon-xs" variant="ghost" onClick={jumpToFirst} />}>
              <ChevronFirstIcon />
            </TooltipTrigger>
            <TooltipContent>First frame <Kbd>Home</Kbd></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button size="icon-xs" variant="ghost" onClick={previousFrame} />}>
              <ChevronLeftIcon />
            </TooltipTrigger>
            <TooltipContent>Previous <Kbd>←</Kbd> <Kbd>A</Kbd></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button size="xs" onClick={playbackStatus === "playing" ? pause : play} />}>
              {playbackStatus === "playing" ? (
                <PauseIcon data-icon="inline-start" />
              ) : (
                <PlayIcon data-icon="inline-start" />
              )}
              {playbackStatus === "playing" ? "Pause" : "Play"}
            </TooltipTrigger>
            <TooltipContent>{playbackStatus === "playing" ? "Pause" : "Play"} <Kbd>Space</Kbd></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button size="icon-xs" variant="ghost" onClick={nextFrame} />}>
              <ChevronRightIcon />
            </TooltipTrigger>
            <TooltipContent>Next <Kbd>→</Kbd> <Kbd>D</Kbd></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button size="icon-xs" variant="ghost" onClick={jumpToLast} />}>
              <ChevronLastIcon />
            </TooltipTrigger>
            <TooltipContent>Last frame <Kbd>End</Kbd></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button size="icon-xs" variant="ghost" onClick={reset} />}>
              <RotateCcwIcon />
            </TooltipTrigger>
            <TooltipContent>Reset <Kbd>R</Kbd></TooltipContent>
          </Tooltip>
        </div>

        <div className="mx-1 h-5 border-l border-border/30" />

        <input
          aria-label="Timeline"
          className="h-1 min-w-0 flex-1 accent-primary"
          disabled={frames.length <= 1}
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
          <SelectTrigger size="sm" className="w-[4.5rem]">
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
                onClick={() => setInputModalOpen((v) => !v)}
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
                variant={authorMode ? "secondary" : "ghost"}
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
              />
            }
          >
            <KeyboardIcon />
          </TooltipTrigger>
          <TooltipContent>Keyboard shortcuts <Kbd>/</Kbd></TooltipContent>
        </Tooltip>
      </footer>

      {/* Hotkeys Dialog */}
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
                  {keys.map((k, i) => (
                    <span key={k} className="flex items-center gap-1">
                      {i > 0 ? <span className="text-[10px] text-muted-foreground">/</span> : null}
                      <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border/60 bg-muted/40 px-1.5 font-mono text-[11px] text-foreground/70">
                        {k}
                      </kbd>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Input Editor Modal */}
      {inputModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setInputModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border border-border/60 bg-card p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium">Custom Input</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{inputSource}</Badge>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setInputModalOpen(false)}
                >
                  <XIcon />
                </Button>
              </div>
            </div>
            <Textarea
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  selectedPresetId && selectPreset(selectedPresetId)
                }
              >
                Use preset
              </Button>
              <Button size="sm" onClick={applyCustomInput}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
