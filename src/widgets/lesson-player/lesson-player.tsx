import { useEffect, useEffectEvent, useMemo, useState, useCallback } from "react"
import {
  BookOpenIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KeyboardIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

import { useTheme } from "@/app/providers/theme-provider"
import { listLessons } from "@/domains/lessons/loaders"
import { defineCodeTracePrimitiveFrameState } from "@/entities/visualization/primitives"
import type { PrimitiveFrameState } from "@/entities/visualization/types"
import { useCommandHotkeys } from "@/features/commands/use-command-hotkeys"
import { isCommandEnabled, type AppCommand } from "@/features/commands/types"
import {
  buildLessonCommandPalette,
  commandDisabled,
  getStaticLessonCommands,
  groupVisibleCommands,
  type LessonPlayerCommandContext,
} from "@/features/player/commands"
import { PLAYBACK_SPEED_MS } from "@/features/player/runtime"
import {
  buildPlainCodePresentation,
  type CodePresentation,
} from "@/features/player/code-presentation"
import { useLessonPlayerStore } from "@/features/player/store"
import { AuthorReview } from "@/widgets/author-review/author-review"
import { PresetStudioDialog } from "@/widgets/lesson-player/preset-studio-dialog"
import { VerificationBlockerDialog } from "@/widgets/lesson-player/verification-blocker-dialog"
import { collectRelatedIssues } from "@/widgets/author-review/model"
import { cn } from "@/shared/lib/utils"
import { PrimitiveRenderer } from "@/shared/visualization/primitive-renderer"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/shared/ui/command"
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
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { KbdGroup } from "@/shared/ui/kbd"
import { ThemeToggle } from "@/shared/ui/theme-toggle"

type LessonPlayerProps = {
  lessonId?: string
}

const PLAYBACK_SPEED_OPTIONS = ["0.5x", "1x", "1.5x", "2x"] as const
const CANVAS_KINDS = new Set(["tree", "call-tree", "graph"])
const STATIC_COMMANDS = getStaticLessonCommands()

function splitPrimitives(primitives: PrimitiveFrameState[]) {
  const supportPrimitives = primitives.filter((primitive) => primitive.kind === "state")
  const primaryPrimitives = primitives.filter(
    (primitive) =>
      primitive.viewport?.role === "primary" ||
      (!primitive.viewport?.role && primitive.kind !== "state")
  )
  const secondaryPrimitives = primitives.filter(
    (primitive) =>
      primitive.kind !== "state" &&
      (primitive.viewport?.role === "secondary" ||
        primitive.viewport?.role === "tertiary")
  )

  return {
    primaryPrimitives:
      primaryPrimitives.length > 0 ? primaryPrimitives : primitives,
    supportPrimitives,
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
  const { theme, setTheme } = useTheme()
  const {
    lesson,
    approach,
    approachId,
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
  const [presetStudioOpen, setPresetStudioOpen] = useState(false)
  const [presetStudioView, setPresetStudioView] = useState<"presets" | "custom">("presets")
  const [hotkeysOpen, setHotkeysOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [selectedPrimitiveId, setSelectedPrimitiveId] = useState<string>()
  const lessons = useMemo(() => listLessons(), [])
  const activeFrame = frames[currentFrameIndex]
  const previousVisibleFrame =
    currentFrameIndex > 0 ? frames[currentFrameIndex - 1] : undefined
  const nextVisibleFrame =
    currentFrameIndex + 1 < frames.length ? frames[currentFrameIndex + 1] : undefined
  const activeEvent = trace.find((event) => event.id === activeFrame?.sourceEventId)
  const activePrimitives = activeFrame?.primitives ?? []
  const { primaryPrimitives, supportPrimitives, secondaryPrimitives } =
    splitPrimitives(activePrimitives)
  const hasSupportPrimitives = supportPrimitives.length > 0
  const hasSecondaryStage = secondaryPrimitives.length > 0
  const hasExpansiveSecondary = secondaryPrimitives.some((p) => CANVAS_KINDS.has(p.kind))
  const currentFrameLabel =
    frames.length === 0 ? "0/0" : `${currentFrameIndex + 1}/${frames.length}`
  const visualChangeLabel = activeFrame?.visualChangeType ?? "-"
  const verificationBlocked = verification?.isValid === false
  const learnerModeBlocked = verificationBlocked && !authorMode
  const verificationBlockerOpen = learnerModeBlocked && !presetStudioOpen
  const blockingIssues = collectRelatedIssues(verification, activeFrame, activeEvent, 3)
  const codeTracePrimitive = buildCodeTracePrimitive(codePresentation, activeFrame?.codeLine)
  const activePreset =
    approach?.presets.find((preset) => preset.id === selectedPresetId) ?? approach?.presets[0]

  const inspectFrameById = useCallback(
    (frameId: string) => {
      const frameIndex = frames.findIndex((candidate) => candidate.id === frameId)
      if (frameIndex >= 0) {
        scrubTo(frameIndex)
      }
    },
    [frames, scrubTo]
  )

  const inspectEventById = useCallback(
    (eventId: string) => {
      const frameIndex = frames.findIndex(
        (candidate) => candidate.sourceEventId === eventId
      )
      if (frameIndex >= 0) {
        scrubTo(frameIndex)
      }
    },
    [frames, scrubTo]
  )

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
    if (failure?.kind === "input-parse") {
      setPresetStudioView("custom")
      setPresetStudioOpen(true)
    }
  }, [failure])

  useEffect(() => {
    if (
      selectedPrimitiveId &&
      !activePrimitives.some((primitive) => primitive.id === selectedPrimitiveId)
    ) {
      setSelectedPrimitiveId(undefined)
    }
  }, [activePrimitives, selectedPrimitiveId])

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

  const openPresetStudio = useCallback((view: "presets" | "custom" = "presets") => {
    setPresetStudioView(view)
    setPresetStudioOpen(true)
  }, [])

  const togglePlayback = useCallback(
    () => (playbackStatus === "playing" ? pause() : play()),
    [playbackStatus, pause, play]
  )

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [setTheme, theme])

  const commandContext = useMemo<LessonPlayerCommandContext>(
    () => ({
      lessons,
      lesson,
      approachId,
      selectedPresetId,
      playbackSpeed,
      playbackStatus,
      learnerModeBlocked,
      authorMode,
      commandOpen,
      hotkeysOpen,
      presetStudioOpen,
      hasFrames: frames.length > 0,
      hasPreviousFrame: currentFrameIndex > 0,
      hasNextFrame: currentFrameIndex + 1 < frames.length,
      setLessonId,
      setApproachId,
      selectPreset,
      setPlaybackSpeed,
      play,
      pause,
      togglePlayback,
      previousFrame,
      nextFrame,
      jumpToFirst,
      jumpToLast,
      reset,
      toggleAudit: toggleAuthorMode,
      openCommandPalette: () => setCommandOpen(true),
      closeCommandPalette: () => setCommandOpen(false),
      toggleHotkeys: () => setHotkeysOpen((value) => !value),
      openPresetStudio,
      toggleTheme,
    }),
    [
      approachId,
      authorMode,
      commandOpen,
      currentFrameIndex,
      frames.length,
      hotkeysOpen,
      openPresetStudio,
      jumpToFirst,
      jumpToLast,
      learnerModeBlocked,
      lesson,
      lessons,
      nextFrame,
      pause,
      playbackSpeed,
      playbackStatus,
      play,
      previousFrame,
      presetStudioOpen,
      reset,
      selectPreset,
      selectedPresetId,
      setApproachId,
      setLessonId,
      setPlaybackSpeed,
      theme,
      toggleAuthorMode,
      togglePlayback,
      toggleTheme,
    ]
  )
  const paletteCommands = useMemo(
    () => buildLessonCommandPalette(commandContext),
    [commandContext]
  )
  const paletteGroups = useMemo(
    () => Object.entries(groupVisibleCommands(paletteCommands, commandContext)),
    [commandContext, paletteCommands]
  )
  const hotkeyCommands = useMemo(
    () => STATIC_COMMANDS.filter((command) => command.shortcuts?.length),
    []
  )
  const hotkeyHelpCommands = useMemo(
    () =>
      hotkeyCommands.filter((command) =>
        command.scope === "player" ? true : command.scope !== undefined
      ),
    [hotkeyCommands]
  )
  const commandById = useMemo(
    () => new Map(STATIC_COMMANDS.map((command) => [command.id, command])),
    []
  )

  useCommandHotkeys(hotkeyCommands, commandContext)

  const runCommand = useCallback(
    (command: AppCommand<LessonPlayerCommandContext>) => {
      if (!isCommandEnabled(command, commandContext)) {
        return
      }

      command.run(commandContext)
    },
    [commandContext]
  )
  const firstFrameCommand = commandById.get("jump-first")
  const previousFrameCommand = commandById.get("previous-frame")
  const playPauseCommand = commandById.get("toggle-playback")
  const nextFrameCommand = commandById.get("next-frame")
  const lastFrameCommand = commandById.get("jump-last")
  const resetPlaybackCommand = commandById.get("reset-playback")
  const taskPaletteCommand = commandById.get("open-command-palette")
  const presetStudioCommand = commandById.get("open-preset-studio")
  const customInputCommand = commandById.get("open-custom-input")
  const auditCommand = commandById.get("toggle-audit")
  const shortcutsCommand = commandById.get("toggle-hotkeys")

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
              data-testid="support-column"
              className="flex h-full min-h-0 flex-col"
            >
              {hasSupportPrimitives ? (
                <div
                  data-testid="support-primitives-region"
                  className="shrink-0 border-b border-border/20 px-3 py-3"
                >
                  <div className="grid auto-rows-max gap-2">
                    {supportPrimitives.map((primitive) => (
                      <PrimitiveRenderer
                        key={primitive.id}
                        primitive={primitive}
                        role="secondary"
                        selectedPrimitiveId={selectedPrimitiveId}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="shrink-0 border-b border-border/20 px-3 py-2">
                <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Support
                </div>
                <p className="text-xs leading-relaxed text-foreground/80">
                  {learnerModeBlocked
                    ? "Learner mode is blocked until verification issues are inspected in lesson audit."
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
            <div
              data-testid="stage-visual-grid"
              className={cn(
                "grid h-full overflow-hidden",
                hasSecondaryStage && hasExpansiveSecondary
                  ? "xl:grid-cols-[1.2fr_1fr]"
                  : hasSecondaryStage
                    ? "xl:grid-cols-[1fr_minmax(16rem,22rem)]"
                    : ""
              )}
            >
              <section
                data-testid="stage-scroll-region"
                className="flex overflow-auto"
              >
                <div
                  data-testid="stage-primary-region"
                  className="m-auto grid auto-rows-max gap-4 p-4"
                >
                  {primaryPrimitives.map((primitive) => (
                    <PrimitiveRenderer
                      key={primitive.id}
                      primitive={primitive}
                      role="primary"
                      selectedPrimitiveId={selectedPrimitiveId}
                    />
                  ))}
                </div>
              </section>
              {hasSecondaryStage ? (
                <aside
                  data-testid="stage-secondary-region"
                  className="overflow-y-auto border-l border-border/20 p-4"
                >
                  <div className="grid auto-rows-max gap-3">
                    {secondaryPrimitives.map((primitive) => (
                      <PrimitiveRenderer
                        key={primitive.id}
                        primitive={primitive}
                        role="secondary"
                        selectedPrimitiveId={selectedPrimitiveId}
                      />
                    ))}
                  </div>
                </aside>
              ) : null}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <VerificationBlockerDialog
          open={verificationBlockerOpen}
          verification={verification}
          failure={failure}
          blockingIssues={blockingIssues.blocking}
          onOpenAuditMode={toggleAuthorMode}
          onInspectInput={() => openPresetStudio("custom")}
        />

        {authorMode ? (
          <div
            data-testid="author-review-drawer"
            className="absolute inset-x-0 bottom-0 z-10 border-t border-border/40 bg-card/95 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/20 px-4 py-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">lesson audit</Badge>
                  <Badge variant="outline">frame {currentFrameLabel}</Badge>
                  <Badge variant="outline">change {visualChangeLabel}</Badge>
                  <Badge variant="outline">status {playbackStatus}</Badge>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-foreground">Audit the live runtime</h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Verification, frame diffs, narration binding, and event history stay attached to the same state the learner sees.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant={verification?.isValid === false ? "destructive" : "outline"}
                >
                  verification {verification?.isValid === false ? "blocked" : "ok"}
                </Badge>
                <Badge variant="outline">code {activeFrame?.codeLine ?? "-"}</Badge>
                <Badge variant="outline">
                  views {primaryPrimitives.length + secondaryPrimitives.length}
                </Badge>
                <Button size="xs" variant="ghost" onClick={toggleAuthorMode}>
                  <KbdGroup shortcuts={[["Q"]]} />
                  Close
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 border-b border-border/20 px-4 py-1.5 text-xs text-muted-foreground">
              <ShieldCheckIcon className="size-3.5" />
              Runtime audit is internal QA tooling. Use it to verify trust, not to replace the learner-facing view.
            </div>
            <div className="max-h-[360px] overflow-y-auto p-4">
              <AuthorReview
                frame={activeFrame}
                previousFrame={previousVisibleFrame}
                nextFrame={nextVisibleFrame}
                event={activeEvent}
                verification={verification}
                trace={trace}
                frames={frames}
                selectedPrimitiveId={selectedPrimitiveId}
                onInspectPreviousFrame={previousFrame}
                onInspectNextFrame={nextFrame}
                onJumpToFrameId={inspectFrameById}
                onJumpToEventId={inspectEventById}
                onFocusPrimitiveId={setSelectedPrimitiveId}
              />
            </div>
          </div>
        ) : null}
      </div>

      <footer className="flex h-12 shrink-0 items-center gap-1 border-t border-border/40 px-2">
        <Button
          size="sm"
          variant="outline"
          className="w-[16rem] justify-between gap-2"
          onClick={() => taskPaletteCommand && runCommand(taskPaletteCommand)}
          aria-label="Open task command palette"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <BookOpenIcon data-icon="inline-start" />
            <span className="truncate">{lesson?.title ?? "Current task"}</span>
          </span>
          {taskPaletteCommand?.shortcutHints ? (
            <KbdGroup shortcuts={taskPaletteCommand.shortcutHints} className="shrink-0" />
          ) : null}
        </Button>

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

        <Button
          size="sm"
          variant="outline"
          className="w-[14rem] justify-between gap-2"
          onClick={() =>
            presetStudioCommand ? runCommand(presetStudioCommand) : openPresetStudio()
          }
          aria-label="Open preset studio"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <SlidersHorizontalIcon data-icon="inline-start" />
            <span className="truncate">
              {inputSource === "custom" ? "Custom input" : activePreset?.label ?? "Preset studio"}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2">
            <Badge variant={inputSource === "custom" ? "secondary" : "outline"}>
              {inputSource}
            </Badge>
            {presetStudioCommand?.shortcutHints ? (
              <KbdGroup shortcuts={presetStudioCommand.shortcutHints} />
            ) : null}
          </span>
        </Button>

        <div className="mx-1 h-5 border-l border-border/30" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => firstFrameCommand && runCommand(firstFrameCommand)}
                  disabled={firstFrameCommand ? commandDisabled(firstFrameCommand, commandContext) : learnerModeBlocked}
                  aria-label="First frame"
                />
              }
            >
              <ChevronFirstIcon />
            </TooltipTrigger>
            <TooltipContent>
              First frame <KbdGroup shortcuts={[["Home"]]} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => previousFrameCommand && runCommand(previousFrameCommand)}
                  disabled={previousFrameCommand ? commandDisabled(previousFrameCommand, commandContext) : learnerModeBlocked}
                  aria-label="Previous frame"
                />
              }
            >
              <ChevronLeftIcon />
            </TooltipTrigger>
            <TooltipContent>
              Previous <KbdGroup shortcuts={[["Left"], ["A"]]} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="xs"
                  onClick={() => playPauseCommand && runCommand(playPauseCommand)}
                  disabled={playPauseCommand ? commandDisabled(playPauseCommand, commandContext) : learnerModeBlocked}
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
              {playbackStatus === "playing" ? "Pause" : "Play"}{" "}
              <KbdGroup shortcuts={[["Space"]]} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => nextFrameCommand && runCommand(nextFrameCommand)}
                  disabled={nextFrameCommand ? commandDisabled(nextFrameCommand, commandContext) : learnerModeBlocked}
                  aria-label="Next frame"
                />
              }
            >
              <ChevronRightIcon />
            </TooltipTrigger>
            <TooltipContent>
              Next <KbdGroup shortcuts={[["Right"], ["D"]]} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => lastFrameCommand && runCommand(lastFrameCommand)}
                  disabled={lastFrameCommand ? commandDisabled(lastFrameCommand, commandContext) : learnerModeBlocked}
                  aria-label="Last frame"
                />
              }
            >
              <ChevronLastIcon />
            </TooltipTrigger>
            <TooltipContent>
              Last frame <KbdGroup shortcuts={[["End"]]} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => resetPlaybackCommand && runCommand(resetPlaybackCommand)}
                  disabled={resetPlaybackCommand ? commandDisabled(resetPlaybackCommand, commandContext) : learnerModeBlocked}
                  aria-label="Reset playback"
                />
              }
            >
              <RotateCcwIcon />
            </TooltipTrigger>
            <TooltipContent>
              Reset <KbdGroup shortcuts={[["R"]]} />
            </TooltipContent>
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
                variant={presetStudioOpen ? "secondary" : "ghost"}
                onClick={() => customInputCommand && runCommand(customInputCommand)}
                disabled={customInputCommand ? commandDisabled(customInputCommand, commandContext) : false}
                aria-label="Custom input"
              />
            }
          >
            <SlidersHorizontalIcon />
          </TooltipTrigger>
          <TooltipContent>Preset studio</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="xs"
                variant={learnerModeBlocked ? "destructive" : authorMode ? "secondary" : "ghost"}
                onClick={() => auditCommand && runCommand(auditCommand)}
                disabled={auditCommand ? commandDisabled(auditCommand, commandContext) : false}
              />
            }
          >
            <ShieldCheckIcon data-icon="inline-start" />
            Audit
          </TooltipTrigger>
          <TooltipContent>
            Lesson audit <KbdGroup shortcuts={[["Q"]]} />
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => shortcutsCommand && runCommand(shortcutsCommand)}
                disabled={shortcutsCommand ? commandDisabled(shortcutsCommand, commandContext) : false}
                aria-label="Keyboard shortcuts"
              />
            }
          >
            <KeyboardIcon />
          </TooltipTrigger>
          <TooltipContent>
            Keyboard shortcuts <KbdGroup shortcuts={[["/"]]} />
          </TooltipContent>
        </Tooltip>

        <ThemeToggle className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground" />
      </footer>

      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        title="Command Palette"
        description="Search tasks, approaches, presets, playback controls, and audit tools."
      >
        <CommandInput placeholder="Search tasks, playback, audit, and workspace actions..." />
        <CommandList>
          <CommandEmpty>No matching commands or tasks.</CommandEmpty>
          {paletteGroups.map(([group, commands]) => (
            <CommandGroup key={group} heading={group}>
              {commands.map((command) => (
                <CommandItem
                  key={command.id}
                  value={`${command.title} ${command.description ?? ""}`}
                  keywords={command.keywords}
                  disabled={commandDisabled(command, commandContext)}
                  onSelect={() => {
                    setCommandOpen(false)
                    runCommand(command)
                  }}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="truncate font-medium text-foreground">{command.title}</div>
                    {command.description ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {command.description}
                      </div>
                    ) : null}
                  </div>
                  {command.shortcutHints?.length ? (
                    <CommandShortcut>
                      <KbdGroup shortcuts={command.shortcutHints} />
                    </CommandShortcut>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      <Dialog open={hotkeysOpen} onOpenChange={setHotkeysOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Commands & Shortcuts</DialogTitle>
            <DialogDescription>
              The command layer drives buttons, hotkeys, and the task palette from the same action registry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1">
            {hotkeyHelpCommands.map((command) => (
              <div
                key={command.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="text-muted-foreground">{command.title}</div>
                  {command.description ? (
                    <div className="truncate text-xs text-muted-foreground/70">
                      {command.description}
                    </div>
                  ) : null}
                </div>
                <KbdGroup shortcuts={command.shortcutHints} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <PresetStudioDialog
        open={presetStudioOpen}
        onOpenChange={setPresetStudioOpen}
        approach={approach}
        inputSource={inputSource}
        selectedPresetId={selectedPresetId}
        rawInput={rawInput}
        preferredView={presetStudioView}
        onSelectPreset={selectPreset}
        onApplyCustomInput={(nextRawInput) => {
          setRawInput(nextRawInput)
          applyCustomInput()
        }}
      />
    </main>
  )
}
