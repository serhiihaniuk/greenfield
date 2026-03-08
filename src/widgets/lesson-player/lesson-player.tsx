import { useEffect, useEffectEvent, useMemo, useState } from "react"
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileJsonIcon,
  GaugeIcon,
  ListTreeIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react"

import { listLessons } from "@/domains/lessons/loaders"
import type { VisualizationMode } from "@/domains/lessons/types"
import {
  defineCodeTracePrimitiveFrameState,
  defineNarrationPrimitiveFrameState,
} from "@/entities/visualization/primitives"
import type { PrimitiveFrameState } from "@/entities/visualization/types"
import { tokenizeCodeTemplate, type CodePresentation } from "@/features/player/code"
import { PLAYBACK_SPEED_MS } from "@/features/player/runtime"
import { useLessonPlayerStore } from "@/features/player/store"
import { AuthorReview } from "@/widgets/author-review/author-review"
import { PrimitiveRenderer } from "@/shared/visualization/primitive-renderer"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/shared/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Separator } from "@/shared/ui/separator"
import { Textarea } from "@/shared/ui/textarea"

type LessonPlayerProps = {
  lessonId?: string
}

const MODE_OPTIONS: VisualizationMode[] = ["focus", "full", "code", "compare"]
const PLAYBACK_SPEED_OPTIONS = ["0.5x", "1x", "1.5x", "2x"] as const

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

function buildNarrationPrimitive(
  summary: string | undefined,
  codeLine: string | undefined,
  visualChange: string | undefined
) {
  return defineNarrationPrimitiveFrameState({
    id: "narration",
    kind: "narration",
    title: "Narration",
    subtitle: "Short prose should explain the visual change, not replace it.",
    data: {
      summary: summary ?? "No active narration.",
      segments: [],
      codeLine,
      visualChange,
    },
    viewport: {
      role: "secondary",
      preferredWidth: 320,
      minHeight: 220,
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
  const [showInputEditor, setShowInputEditor] = useState(false)
  const lessons = useMemo(() => listLessons(), [])
  const activeFrame = frames[currentFrameIndex]
  const activeEvent = trace.find((event) => event.id === activeFrame?.sourceEventId)
  const activePrimitives = activeFrame?.primitives ?? []
  const { primaryPrimitives, secondaryPrimitives } = splitPrimitives(activePrimitives)
  const hasSecondaryStage = secondaryPrimitives.length > 0
  const selectedPresetLabel =
    approach?.presets.find((preset) => preset.id === selectedPresetId)?.label ??
    "No preset"
  const currentFrameLabel =
    frames.length === 0 ? "0 / 0" : `${currentFrameIndex + 1} / ${frames.length}`
  const visualChangeLabel = activeFrame?.visualChangeType ?? "—"
  const forcedInputEditorVisible =
    inputSource === "custom" || failure?.kind === "input-parse"
  const inputEditorVisible = showInputEditor || forcedInputEditorVisible
  const codeTracePrimitive = buildCodeTracePrimitive(codePresentation, activeFrame?.codeLine)
  const narrationPrimitive = buildNarrationPrimitive(
    activeFrame?.narration.summary,
    activeFrame?.codeLine,
    visualChangeLabel
  )

  useEffect(() => {
    initialize(lessonId)
  }, [initialize, lessonId])

  useEffect(() => {
    if (!approach) {
      return
    }

    let cancelled = false
    tokenizeCodeTemplate(approach.codeTemplate).then((presentation) => {
      if (!cancelled) {
        setCodePresentation(presentation)
      }
    })

    return () => {
      cancelled = true
    }
  }, [approach])

  const stepPlayback = useEffectEvent(() => {
    if (playbackStatus === "playing") {
      nextFrame()
    }
  })

  useEffect(() => {
    if (playbackStatus !== "playing") {
      return
    }

    const timer = window.setTimeout(stepPlayback, PLAYBACK_SPEED_MS[playbackSpeed])
    return () => {
      window.clearTimeout(timer)
    }
  }, [currentFrameIndex, playbackSpeed, playbackStatus])

  return (
    <main className="bg-background text-foreground min-h-svh">
      <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_20%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_18%),linear-gradient(180deg,rgba(9,14,23,0.96)_0%,rgba(9,14,23,1)_100%)]">
        <div className="mx-auto flex w-full max-w-[1620px] flex-col gap-4 px-4 py-5 xl:px-6">
          <Card
            size="sm"
            className="border border-border/60 bg-card/70 shadow-[0_18px_70px_rgba(2,8,23,0.42)] backdrop-blur"
          >
            <CardHeader className="gap-1 pb-0">
              <CardAction className="col-start-1 row-start-2 flex flex-wrap justify-start gap-2 self-start justify-self-start xl:col-start-2 xl:row-start-1 xl:justify-end xl:justify-self-end">
                <Badge variant="outline">change {visualChangeLabel}</Badge>
                <Badge variant="outline">status {playbackStatus}</Badge>
                <Badge
                  variant={verification?.isValid === false ? "destructive" : "outline"}
                >
                  verification {verification?.isValid === false ? "blocked" : "ok"}
                </Badge>
              </CardAction>
              <div className="flex flex-col gap-0.5">
                <CardTitle>
                  <h1 className="text-sm">Lesson Controls</h1>
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Select lesson state, then keep the stage in view.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <FieldGroup className="gap-3">
                <div className="grid gap-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,0.8fr)_minmax(0,0.95fr)]">
                  <Field orientation="horizontal" className="items-center gap-3">
                    <FieldTitle className="w-14 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                      Lesson
                    </FieldTitle>
                    <FieldContent>
                      <Select
                        value={activeLessonId || null}
                        onValueChange={(value) => value && setLessonId(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a lesson" />
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
                    </FieldContent>
                  </Field>
                  <Field orientation="horizontal" className="items-center gap-3">
                    <FieldTitle className="w-18 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                      Approach
                    </FieldTitle>
                    <FieldContent>
                      <Select
                        value={approachId || null}
                        onValueChange={(value) => value && setApproachId(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an approach" />
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
                    </FieldContent>
                  </Field>
                  <Field orientation="horizontal" className="items-center gap-3">
                    <FieldTitle className="w-12 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                      Mode
                    </FieldTitle>
                    <FieldContent>
                      <Select
                        value={mode || null}
                        onValueChange={(value) => value && setMode(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a mode" />
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
                    </FieldContent>
                  </Field>
                  <Field orientation="horizontal" className="items-center gap-3">
                    <FieldTitle className="w-14 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                      Preset
                    </FieldTitle>
                    <FieldContent>
                      <Select
                        value={selectedPresetId ?? null}
                        onValueChange={(value) => value && selectPreset(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a preset" />
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
                    </FieldContent>
                  </Field>
                </div>
              </FieldGroup>
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={jumpToFirst}>
                    <ChevronFirstIcon data-icon="inline-start" />
                    First
                  </Button>
                  <Button size="sm" variant="outline" onClick={previousFrame}>
                    <ChevronLeftIcon data-icon="inline-start" />
                    Prev
                  </Button>
                  <Button size="sm" onClick={playbackStatus === "playing" ? pause : play}>
                    {playbackStatus === "playing" ? (
                      <PauseIcon data-icon="inline-start" />
                    ) : (
                      <PlayIcon data-icon="inline-start" />
                    )}
                    {playbackStatus === "playing" ? "Pause" : "Play"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={nextFrame}>
                    <ChevronRightIcon data-icon="inline-start" />
                    Next
                  </Button>
                  <Button size="sm" variant="outline" onClick={jumpToLast}>
                    <ChevronLastIcon data-icon="inline-start" />
                    Last
                  </Button>
                  <Button size="sm" variant="outline" onClick={reset}>
                    <RotateCcwIcon data-icon="inline-start" />
                    Reset
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge variant="secondary">{selectedPresetLabel}</Badge>
                  <Badge variant="outline">input {inputSource}</Badge>
                  <Badge variant="outline">{currentFrameLabel}</Badge>
                  <Button
                    disabled={forcedInputEditorVisible}
                    size="sm"
                    variant="outline"
                    onClick={() => setShowInputEditor((current) => !current)}
                  >
                    <FileJsonIcon data-icon="inline-start" />
                    {forcedInputEditorVisible
                      ? "Input active"
                      : inputEditorVisible
                        ? "Hide input"
                        : "Edit input"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={toggleAuthorMode}>
                    <ListTreeIcon data-icon="inline-start" />
                    {authorMode ? "Hide author review" : "Author review"}
                  </Button>
                  <Select
                    value={playbackSpeed}
                    onValueChange={(value) => value && setPlaybackSpeed(value)}
                  >
                    <SelectTrigger className="w-[5.5rem]">
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
                </div>
              </div>
              <div className="flex w-full items-center gap-3">
                <div className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Timeline
                </div>
                <input
                  aria-label="Timeline"
                  className="accent-primary w-full"
                  disabled={frames.length <= 1}
                  max={Math.max(frames.length - 1, 0)}
                  min={0}
                  onChange={(event) => scrubTo(Number(event.currentTarget.value))}
                  step={1}
                  type="range"
                  value={Math.min(currentFrameIndex, Math.max(frames.length - 1, 0))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_21.5rem]">
            <div className="flex flex-col gap-5">
              <Card className="border border-cyan-500/12 bg-card/72 shadow-[0_20px_90px_rgba(2,8,23,0.45)] backdrop-blur">
                <CardHeader className="gap-2">
                  <CardAction className="col-start-1 row-start-2 flex flex-wrap gap-2 self-start justify-self-start xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:justify-self-end">
                    <Badge variant="outline">code {activeFrame?.codeLine ?? "—"}</Badge>
                    <Badge variant="outline">event {activeEvent?.type ?? "—"}</Badge>
                    <Badge variant="outline">
                      view {primaryPrimitives.length + secondaryPrimitives.length}
                    </Badge>
                  </CardAction>
                  <div className="grid gap-1">
                    <CardTitle>Frame {currentFrameLabel}</CardTitle>
                    <CardDescription className="text-base leading-snug text-foreground/82">
                      {activeFrame?.narration.summary ??
                        "Load a lesson to begin playback."}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={
                      hasSecondaryStage
                        ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]"
                        : "grid gap-4"
                    }
                  >
                    <div className="rounded-[1.5rem] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88)_0%,rgba(10,15,25,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <div className="grid auto-rows-max gap-4">
                        {primaryPrimitives.map((primitive) => (
                          <PrimitiveRenderer key={primitive.id} primitive={primitive} />
                        ))}
                      </div>
                    </div>
                    {hasSecondaryStage ? (
                      <div className="rounded-[1.35rem] border border-border/60 bg-muted/12 p-3">
                        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          <GaugeIcon />
                          Support Views
                        </div>
                        <div className="grid auto-rows-max gap-4">
                          {secondaryPrimitives.map((primitive) => (
                            <PrimitiveRenderer key={primitive.id} primitive={primitive} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col gap-4 xl:sticky xl:top-5 xl:self-start">
              <Card className="border border-border/60 bg-card/72 shadow-[0_18px_70px_rgba(2,8,23,0.36)] backdrop-blur">
                <CardHeader className="gap-1 pb-3">
                  <CardTitle className="text-sm">Reference</CardTitle>
                  <CardDescription className="text-[11px]">
                    Code and review stay docked here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <PrimitiveRenderer primitive={codeTracePrimitive} />
                  <PrimitiveRenderer primitive={narrationPrimitive} />

                  {failure ? (
                    <>
                      <Separator />
                      <Card size="sm" className="border border-destructive/30 bg-destructive/8">
                        <CardHeader>
                          <CardTitle>Runtime failure</CardTitle>
                          <CardDescription>{failure.kind}</CardDescription>
                        </CardHeader>
                        <CardContent>{failure.message}</CardContent>
                      </Card>
                    </>
                  ) : null}

                  {inputEditorVisible ? (
                    <>
                      <Separator />
                      <Card size="sm">
                        <CardHeader>
                          <CardAction>
                            <Badge variant="outline">{inputSource}</Badge>
                          </CardAction>
                          <CardTitle>Custom Input</CardTitle>
                          <CardDescription>
                            Use JSON input, then rebuild the trace without leaving the player.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <FieldGroup>
                            <Field>
                              <FieldLabel htmlFor="custom-input">Input JSON</FieldLabel>
                              <FieldContent>
                                <Textarea
                                  id="custom-input"
                                  value={rawInput}
                                  onChange={(event) => setRawInput(event.target.value)}
                                  rows={10}
                                />
                                <FieldDescription>
                                  Keep editing docked to the side so the stage remains visible.
                                </FieldDescription>
                              </FieldContent>
                            </Field>
                          </FieldGroup>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => selectedPresetId && selectPreset(selectedPresetId)}
                          >
                            Use preset
                          </Button>
                          <Button size="sm" onClick={applyCustomInput}>
                            Apply custom input
                          </Button>
                        </CardFooter>
                      </Card>
                    </>
                  ) : null}

                  {authorMode ? (
                    <>
                      <Separator />
                      <AuthorReview
                        frame={activeFrame}
                        event={activeEvent}
                        verification={verification}
                      />
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
