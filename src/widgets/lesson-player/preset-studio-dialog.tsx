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
import { ScrollArea } from "@/shared/ui/scroll-area"
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
  return preset?.description ?? ""
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
        className="flex h-[min(80vh,40rem)] flex-col overflow-hidden p-0 sm:max-w-4xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-border/30 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DialogTitle>Preset Studio</DialogTitle>
              <DialogDescription className="sr-only">
                Select an input scenario for the current approach.
              </DialogDescription>
              {shortcutHints?.length ? (
                <CommandShortcutHints shortcutHints={shortcutHints} />
              ) : null}
            </div>
            <DialogHeaderClose srLabel="Close preset studio" />
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] overflow-hidden md:grid-cols-[16rem_1fr] md:grid-rows-[1fr]">
          {/* ── Detail pane (first in DOM for focus order) ── */}
          <div className="flex min-h-0 flex-1 flex-col md:col-start-2">
            <ScrollArea className="min-h-0 flex-1">
              {selectedEntryId === CUSTOM_ENTRY_ID ? (
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">Custom input</h3>
                    {customModeActive ? (
                      <Badge variant="secondary">active</Badge>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    {activePreset ? (
                      <div className="flex items-center justify-end">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setCustomDraft(activePreset.rawInput)}
                        >
                          <SparklesIcon data-icon="inline-start" />
                          Load from {activePreset.label}
                        </Button>
                      </div>
                    ) : null}
                    <Textarea
                      aria-label="Custom input editor"
                      value={customDraft}
                      onChange={(event) => setCustomDraft(event.target.value)}
                      rows={14}
                      className="font-mono text-xs"
                    />
                  </div>

                  {customFacts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {customFacts.map((fact) => (
                        <Badge key={fact.key} variant="outline" className="gap-1">
                          <span className="font-medium text-foreground">{fact.key}</span>
                          <span className="text-muted-foreground">{fact.value}</span>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4 p-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {detailPreset?.label ?? "Preset"}
                      </h3>
                      {detailPreset?.id === selectedPresetId && presetModeActive ? (
                        <Badge variant="secondary">active</Badge>
                      ) : null}
                    </div>
                    {getPresetDescription(detailPreset) ? (
                      <p className="text-sm text-muted-foreground">
                        {getPresetDescription(detailPreset)}
                      </p>
                    ) : null}
                    {presetFacts.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {presetFacts.map((fact) => (
                          <Badge key={fact.key} variant="outline" className="gap-1">
                            <span className="font-medium text-foreground">{fact.key}</span>
                            <span className="text-muted-foreground">{fact.value}</span>
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <pre className="overflow-x-auto rounded-lg border border-border/40 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
                    <code>{detailPreset?.rawInput ?? ""}</code>
                  </pre>
                </div>
              )}
            </ScrollArea>

            {/* ── Fixed action footer ── */}
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/30 px-5 py-3">
              {selectedEntryId === CUSTOM_ENTRY_ID ? (
                <>
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
                </>
              ) : (
                <>
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
                      ? "Active"
                      : "Run preset"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ── Sidebar rail (second in DOM, visually on left via grid placement) ── */}
          <aside className="min-h-0 max-h-48 border-t border-border/30 md:col-start-1 md:row-start-1 md:max-h-none md:border-t-0 md:border-r">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3 p-4">
                <div className="text-xs font-medium text-muted-foreground">
                  Presets
                </div>

                <div className="grid gap-2">
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
                        className="h-full w-full cursor-pointer rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <Card
                          size="sm"
                          className={cn(
                            "h-full w-full gap-2 ring-1 transition-colors",
                            isSelected ? "ring-primary/50" : "ring-foreground/10",
                            !isSelected && "hover:ring-foreground/20"
                          )}
                        >
                          <CardHeader className="gap-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
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

                <Separator />

                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Custom
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEntryId(CUSTOM_ENTRY_ID)}
                    aria-pressed={selectedEntryId === CUSTOM_ENTRY_ID}
                    className="w-full cursor-pointer rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
                          {customModeActive ? <Badge variant="secondary">active</Badge> : null}
                        </div>
                      </CardHeader>
                    </Card>
                  </button>
                </div>
              </div>
            </ScrollArea>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
