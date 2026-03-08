import { useEffect, useMemo, useState } from "react"
import { FileJsonIcon, PlayIcon, SparklesIcon } from "lucide-react"

import type { ApproachDefinition, PresetDefinition } from "@/domains/lessons/types"
import { CommandShortcutHints } from "@/features/commands/shortcut-presentation"
import type { InputSource } from "@/features/player/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeaderClose,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Separator } from "@/shared/ui/separator"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/lib/utils"

const CUSTOM_ENTRY_ID = "__custom__"

type PresetStudioView = "presets" | "custom"

type PresetStudioDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  approach?: ApproachDefinition
  inputSource: InputSource
  selectedPresetId?: string
  rawInput: string
  preferredView: PresetStudioView
  shortcutHints?: readonly (readonly string[])[]
  onSelectPreset: (presetId: string) => void
  onApplyCustomInput: (rawInput: string) => void
}

function summarizeValue(value: unknown) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "empty array"
    }

    const preview = value
      .slice(0, 3)
      .map((entry) =>
        typeof entry === "object" && entry !== null ? "{...}" : String(entry)
      )
      .join(", ")

    return `${value.length} items: ${preview}${value.length > 3 ? ", ..." : ""}`
  }

  if (value && typeof value === "object") {
    return `${Object.keys(value).length} fields`
  }

  return String(value)
}

function buildPresetFacts(rawInput: string) {
  try {
    const parsed = JSON.parse(rawInput) as Record<string, unknown>
    return Object.entries(parsed).map(([key, value]) => ({
      key,
      value: summarizeValue(value),
    }))
  } catch {
    return []
  }
}

function getPresetDescription(preset: PresetDefinition | undefined) {
  if (!preset) {
    return "Pick a verified lesson scenario to replay a specific confusion pattern."
  }

  return (
    preset.description ??
    "A verified scenario for this approach. Use it to replay a known execution shape."
  )
}

type PresetSemanticTone = "success" | "failure" | "edge"

function classifyPreset(preset: PresetDefinition | undefined): {
  label: string
  tone: PresetSemanticTone
} {
  const description = getPresetDescription(preset).toLowerCase()
  const label = `${preset?.label ?? ""} ${preset?.id ?? ""}`.toLowerCase()

  if (
    description.includes("fail") ||
    description.includes("not found") ||
    description.includes("impossible") ||
    description.includes("blocked") ||
    description.includes("return -1") ||
    label.includes("blocked") ||
    label.includes("not-found")
  ) {
    return { label: "failure path", tone: "failure" }
  }

  if (
    description.includes("edge") ||
    description.includes("single") ||
    description.includes("heavy") ||
    description.includes("zigzag") ||
    description.includes("tail") ||
    label.includes("left-heavy") ||
    label.includes("zigzag")
  ) {
    return { label: "edge case", tone: "edge" }
  }

  return { label: "success path", tone: "success" }
}

function semanticBadgeVariant(tone: PresetSemanticTone) {
  switch (tone) {
    case "failure":
      return "destructive"
    case "edge":
      return "outline"
    case "success":
    default:
      return "success"
  }
}

export function PresetStudioDialog({
  open,
  onOpenChange,
  approach,
  inputSource,
  selectedPresetId,
  rawInput,
  preferredView,
  shortcutHints,
  onSelectPreset,
  onApplyCustomInput,
}: PresetStudioDialogProps) {
  const [selectedEntryId, setSelectedEntryId] = useState<string>(CUSTOM_ENTRY_ID)
  const [customDraft, setCustomDraft] = useState(rawInput)

  const activePreset = useMemo(
    () => approach?.presets.find((preset) => preset.id === selectedPresetId),
    [approach?.presets, selectedPresetId]
  )
  const selectedPreset = useMemo(
    () =>
      selectedEntryId === CUSTOM_ENTRY_ID
        ? undefined
        : approach?.presets.find((preset) => preset.id === selectedEntryId),
    [approach?.presets, selectedEntryId]
  )
  const detailPreset = selectedPreset ?? activePreset ?? approach?.presets[0]
  const presetFacts = useMemo(
    () => buildPresetFacts(detailPreset?.rawInput ?? ""),
    [detailPreset?.rawInput]
  )
  const customFacts = useMemo(() => buildPresetFacts(customDraft), [customDraft])
  const customModeActive = inputSource === "custom"
  const presetModeActive = inputSource === "preset"

  useEffect(() => {
    if (!open) {
      return
    }

    const nextEntryId =
      preferredView === "custom"
        ? CUSTOM_ENTRY_ID
        : selectedPresetId ?? approach?.presets[0]?.id ?? CUSTOM_ENTRY_ID

    setSelectedEntryId(nextEntryId)
    setCustomDraft(rawInput)
  }, [approach?.presets, open, preferredView, rawInput, selectedPresetId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[min(94vh,52rem)] flex-col overflow-hidden p-0 sm:max-w-5xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-border/30 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle>Preset Studio</DialogTitle>
              <DialogDescription>
                Compare verified scenarios, see what makes each one special, and switch into custom input without leaving the player.
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {shortcutHints?.length ? (
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Shortcut</span>
                  <CommandShortcutHints shortcutHints={shortcutHints} />
                </div>
              ) : null}
              <DialogHeaderClose srLabel="Close preset studio" />
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-hidden xl:grid-cols-[minmax(20rem,23rem)_1fr]">
          <aside className="min-h-0 border-b border-border/30 p-4 xl:border-r xl:border-b-0">
            <div className="flex h-full min-h-0 flex-col gap-3">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Verified presets
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    Pick the scenario with the clearest teaching value. Presets are organized by explanation quality, not internal ids.
                  </p>
                </div>

                <div className="grid gap-2.5">
                  {approach?.presets.map((preset) => {
                    const isActive = preset.id === selectedPresetId && presetModeActive
                    const isSelected = preset.id === selectedEntryId
                    const semantic = classifyPreset(preset)

                    return (
                      <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedEntryId(preset.id)}
                      aria-pressed={isSelected}
                      className={cn("w-full text-left outline-none", isSelected && "rounded-xl")}
                    >
                      <Card
                        size="sm"
                        className={cn(
                          "w-full gap-2 ring-1 transition-colors",
                          isSelected ? "ring-primary/50" : "ring-foreground/10",
                          !isSelected && "hover:ring-foreground/20"
                        )}
                        >
                          <CardHeader className="gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="truncate">{preset.label}</CardTitle>
                              <Badge variant={semanticBadgeVariant(semantic.tone)}>
                                {semantic.label}
                              </Badge>
                              {isActive ? <Badge variant="secondary">active</Badge> : null}
                            </div>
                            <CardDescription className="line-clamp-1">
                              {getPresetDescription(preset)}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div className="shrink-0 space-y-2">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Custom runs
                  </div>
                  <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                    Branch from a preset or paste your own JSON when you need to inspect a failed attempt.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEntryId(CUSTOM_ENTRY_ID)}
                  aria-pressed={selectedEntryId === CUSTOM_ENTRY_ID}
                  className="w-full text-left outline-none"
                >
                  <Card
                    size="sm"
                    className={cn(
                      "w-full gap-2 ring-1 transition-colors",
                      selectedEntryId === CUSTOM_ENTRY_ID
                        ? "ring-primary/50"
                        : "ring-foreground/10 hover:ring-foreground/20"
                    )}
                  >
                    <CardHeader className="gap-1 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>Custom input</CardTitle>
                        <Badge variant="outline">explore</Badge>
                        {customModeActive ? <Badge variant="secondary">active</Badge> : null}
                      </div>
                    </CardHeader>
                  </Card>
                </button>
              </div>
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto p-5">
            {selectedEntryId === CUSTOM_ENTRY_ID ? (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">custom runtime</Badge>
                    <Badge variant={customModeActive ? "secondary" : "outline"}>
                      {customModeActive ? "currently active" : "not active"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Custom input</h3>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      Replay the current approach with your own JSON. This is the fastest way to test a failed whiteboard attempt or extend a verified preset into a new branch.
                    </p>
                  </div>
                </div>

                {activePreset ? (
                  <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          Start from the active preset
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Load <span className="font-medium text-foreground">{activePreset.label}</span> into the editor, then adjust only the part you want to test.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCustomDraft(activePreset.rawInput)}
                      >
                        <SparklesIcon data-icon="inline-start" />
                        Load active preset
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Editor
                  </div>
                  <Textarea
                    aria-label="Custom input editor"
                    value={customDraft}
                    onChange={(event) => setCustomDraft(event.target.value)}
                    rows={14}
                    className="font-mono text-xs"
                  />
                </div>

                {customFacts.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Current snapshot
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {customFacts.map((fact) => (
                        <Badge key={fact.key} variant="outline" className="gap-1">
                          <span className="font-medium text-foreground">{fact.key}</span>
                          <span className="text-muted-foreground">{fact.value}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="-mx-5 sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border/30 bg-background/95 px-5 pt-4 pb-1 backdrop-blur-sm">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Custom runs stay untrusted until the runtime rebuild passes the same verification checks as presets.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedPresetId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onSelectPreset(selectedPresetId)
                          onOpenChange(false)
                        }}
                      >
                        Use active preset
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => {
                        onApplyCustomInput(customDraft)
                        onOpenChange(false)
                      }}
                    >
                      <PlayIcon data-icon="inline-start" />
                      Apply custom input
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">verified preset</Badge>
                    {detailPreset?.id === selectedPresetId && presetModeActive ? (
                      <Badge variant="secondary">currently active</Badge>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {detailPreset?.label ?? "Preset"}
                    </h3>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {getPresetDescription(detailPreset)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    What makes it special
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
                    <p className="text-sm leading-relaxed text-foreground">
                      {getPresetDescription(detailPreset)}
                    </p>
                  </div>
                </div>

                {presetFacts.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Input snapshot
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {presetFacts.map((fact) => (
                        <Badge key={fact.key} variant="outline" className="gap-1">
                          <span className="font-medium text-foreground">{fact.key}</span>
                          <span className="text-muted-foreground">{fact.value}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Input preview
                  </div>
                  <pre className="overflow-x-auto rounded-2xl border border-border/40 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
                    <code>{detailPreset?.rawInput ?? ""}</code>
                  </pre>
                </div>

                <div className="-mx-5 sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border/30 bg-background/95 px-5 pt-4 pb-1 backdrop-blur-sm">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Verified presets are the fastest way to inspect a known confusion shape with trusted narration and golden-backed frames.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCustomDraft(detailPreset?.rawInput ?? "")
                        setSelectedEntryId(CUSTOM_ENTRY_ID)
                      }}
                    >
                      <FileJsonIcon data-icon="inline-start" />
                      Edit as custom
                    </Button>
                    <Button
                      size="sm"
                      disabled={!detailPreset || (detailPreset.id === selectedPresetId && presetModeActive)}
                      onClick={() => {
                        if (!detailPreset) {
                          return
                        }

                        onSelectPreset(detailPreset.id)
                        onOpenChange(false)
                      }}
                    >
                      <PlayIcon data-icon="inline-start" />
                      {detailPreset?.id === selectedPresetId && presetModeActive
                        ? "Active preset"
                        : "Run preset"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
