import { useEffect, useMemo, useState } from "react"
import { FileJsonIcon, PlayIcon, SparklesIcon } from "lucide-react"

import type { ApproachDefinition, PresetDefinition } from "@/domains/lessons/types"
import type { InputSource } from "@/features/player/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { KbdGroup } from "@/shared/ui/kbd"
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

export function PresetStudioDialog({
  open,
  onOpenChange,
  approach,
  inputSource,
  selectedPresetId,
  rawInput,
  preferredView,
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
      <DialogContent className="overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border/30 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle>Preset Studio</DialogTitle>
              <DialogDescription>
                Compare verified scenarios, see what makes each one special, and switch into custom input without leaving the player.
              </DialogDescription>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span>Shortcut</span>
              <KbdGroup shortcuts={[["P"]]} />
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-[34rem] overflow-hidden xl:grid-cols-[minmax(18rem,21rem)_1fr]">
          <Command className="border-b border-border/30 xl:border-r xl:border-b-0">
            <CommandInput placeholder="Search presets or jump to custom input..." />
            <CommandList className="max-h-none p-3">
              <CommandEmpty>No presets match the current search.</CommandEmpty>
              <CommandGroup heading="Verified Presets">
                {approach?.presets.map((preset) => {
                  const isActive = preset.id === selectedPresetId && presetModeActive
                  const isSelected = preset.id === selectedEntryId

                  return (
                    <CommandItem
                      key={preset.id}
                      value={`${preset.label} ${preset.description ?? ""}`}
                      keywords={[preset.id]}
                      onFocus={() => setSelectedEntryId(preset.id)}
                      onMouseMove={() => setSelectedEntryId(preset.id)}
                      onSelect={() => setSelectedEntryId(preset.id)}
                      className={cn(
                        "items-start rounded-xl border border-transparent px-3 py-3",
                        isSelected && "border-border/50 bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{preset.label}</span>
                          {isActive ? <Badge variant="secondary">active</Badge> : null}
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {getPresetDescription(preset)}
                        </p>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              <CommandSeparator className="my-2" />

              <CommandGroup heading="Custom Runs">
                <CommandItem
                  value="Custom input JSON replay"
                  keywords={["custom", "input", "json", "replay"]}
                  onFocus={() => setSelectedEntryId(CUSTOM_ENTRY_ID)}
                  onMouseMove={() => setSelectedEntryId(CUSTOM_ENTRY_ID)}
                  onSelect={() => setSelectedEntryId(CUSTOM_ENTRY_ID)}
                  className={cn(
                    "items-start rounded-xl border border-transparent px-3 py-3",
                    selectedEntryId === CUSTOM_ENTRY_ID &&
                      "border-border/50 bg-accent text-accent-foreground"
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Custom input</span>
                      {customModeActive ? <Badge variant="secondary">active</Badge> : null}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      Paste a failed interview example or branch off an existing preset into a new runtime.
                    </p>
                  </div>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>

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
