import { useCallback, useEffect, useState } from "react"
import { CheckIcon, PaletteIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/popover"

const STORAGE_KEY = "greenfield-color-preset"

/*
 * OKLCH values sourced directly from shadcn's init API
 * (https://ui.shadcn.com/init?theme=<name>&...) — dark mode palette.
 *
 * `primary`         → buttons, badges, active states
 * `sidebarPrimary`  → sidebar highlights (also used as the swatch preview color)
 */
const COLOR_PRESETS = [
  { name: "Blue",    primary: "oklch(0.424 0.199 265.638)", sidebarPrimary: "oklch(0.623 0.214 259.815)" },
  { name: "Emerald", primary: "oklch(0.432 0.095 166.913)", sidebarPrimary: "oklch(0.696 0.17 162.48)" },
  { name: "Fuchsia", primary: "oklch(0.452 0.211 324.591)", sidebarPrimary: "oklch(0.667 0.295 322.15)" },
  { name: "Green",   primary: "oklch(0.453 0.124 130.933)", sidebarPrimary: "oklch(0.768 0.233 130.85)" },
  { name: "Indigo",  primary: "oklch(0.398 0.195 277.366)", sidebarPrimary: "oklch(0.585 0.233 277.117)" },
  { name: "Orange",  primary: "oklch(0.47 0.157 37.304)",   sidebarPrimary: "oklch(0.705 0.213 47.604)" },
  { name: "Pink",    primary: "oklch(0.459 0.187 3.815)",   sidebarPrimary: "oklch(0.656 0.241 354.308)" },
  { name: "Purple",  primary: "oklch(0.438 0.218 303.724)", sidebarPrimary: "oklch(0.627 0.265 303.9)" },
  { name: "Red",     primary: "oklch(0.444 0.177 26.899)",  sidebarPrimary: "oklch(0.637 0.237 25.331)" },
  { name: "Rose",    primary: "oklch(0.455 0.188 13.697)",  sidebarPrimary: "oklch(0.645 0.246 16.439)" },
  { name: "Sky",     primary: "oklch(0.443 0.11 240.79)",   sidebarPrimary: "oklch(0.685 0.169 237.323)" },
  { name: "Violet",  primary: "oklch(0.432 0.232 292.759)", sidebarPrimary: "oklch(0.606 0.25 292.717)" },
  { name: "Yellow",  primary: "oklch(0.795 0.184 86.047)",  sidebarPrimary: "oklch(0.795 0.184 86.047)" },
] as const

type PresetName = (typeof COLOR_PRESETS)[number]["name"]

/** The project ships with blue as its CSS default. */
const DEFAULT_PRESET: PresetName = "Blue"

function applyPreset(preset: (typeof COLOR_PRESETS)[number]) {
  const root = document.documentElement
  root.style.setProperty("--primary", preset.primary)
  root.style.setProperty("--ring", preset.primary)
  root.style.setProperty("--sidebar-primary", preset.sidebarPrimary)
}

function restoreSavedPreset(): PresetName {
  const saved = localStorage.getItem(STORAGE_KEY)
  const preset = COLOR_PRESETS.find((p) => p.name === saved)
  if (preset) {
    applyPreset(preset)
    return preset.name
  }
  return DEFAULT_PRESET
}

export function ThemeCustomizer({ className }: { className?: string }) {
  const [active, setActive] = useState<PresetName>(restoreSavedPreset)

  useEffect(() => {
    const preset = COLOR_PRESETS.find((p) => p.name === active)
    if (preset) {
      applyPreset(preset)
    }
  }, [active])

  const select = useCallback((preset: (typeof COLOR_PRESETS)[number]) => {
    setActive(preset.name)
    applyPreset(preset)
    localStorage.setItem(STORAGE_KEY, preset.name)
  }, [])

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Customize theme color"
        className={className}
      >
        <PaletteIcon className="size-4" />
      </PopoverTrigger>

      <PopoverContent side="top" sideOffset={8} align="end" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Accent color</PopoverTitle>
        </PopoverHeader>

        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              aria-label={preset.name}
              title={preset.name}
              onClick={() => select(preset)}
              className={cn(
                "group relative flex size-9 items-center justify-center rounded-md transition-colors",
                active === preset.name
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-popover"
                  : "hover:ring-1 hover:ring-muted-foreground/30 hover:ring-offset-1 hover:ring-offset-popover"
              )}
            >
              <span
                className="size-6 rounded-full"
                style={{ background: preset.sidebarPrimary }}
              />
              {active === preset.name && (
                <CheckIcon className="absolute size-3 text-primary-foreground" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
