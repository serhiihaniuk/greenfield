import type { AnyLessonDefinition } from "@/domains/lessons/types"
import type { PlaybackSpeed, PlaybackStatus } from "@/features/player/types"
import {
  isCommandEnabled,
  isCommandVisible,
  type AppCommand,
} from "@/features/commands/types"

export type LessonPlayerCommandContext = {
  lessons: AnyLessonDefinition[]
  lesson?: AnyLessonDefinition
  approachId?: string
  selectedPresetId?: string
  playbackSpeed: PlaybackSpeed
  playbackStatus: PlaybackStatus
  learnerModeBlocked: boolean
  authorMode: boolean
  commandOpen: boolean
  hotkeysOpen: boolean
  presetStudioOpen: boolean
  hasFrames: boolean
  hasPreviousFrame: boolean
  hasNextFrame: boolean
  setLessonId: (lessonId: string) => void
  setApproachId: (approachId: string) => void
  selectPreset: (presetId: string) => void
  setPlaybackSpeed: (speed: PlaybackSpeed) => void
  play: () => void
  pause: () => void
  togglePlayback: () => void
  previousFrame: () => void
  nextFrame: () => void
  jumpToFirst: () => void
  jumpToLast: () => void
  reset: () => void
  toggleAudit: () => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleHotkeys: () => void
  openPresetStudio: (view?: "presets" | "custom") => void
  toggleTheme: () => void
}

const PLAYBACK_SPEED_OPTIONS: PlaybackSpeed[] = ["0.5x", "1x", "1.5x", "2x"]

function playerCommandsEnabled(context: LessonPlayerCommandContext) {
  return (
    !context.commandOpen &&
    !context.hotkeysOpen &&
    !context.presetStudioOpen &&
    !context.learnerModeBlocked
  )
}

function playbackNavigationEnabled(context: LessonPlayerCommandContext) {
  return playerCommandsEnabled(context) && context.hasFrames
}

function cyclePlaybackSpeed(
  current: PlaybackSpeed,
  direction: 1 | -1
): PlaybackSpeed | undefined {
  const index = PLAYBACK_SPEED_OPTIONS.indexOf(current)
  return PLAYBACK_SPEED_OPTIONS[index + direction]
}

const STATIC_COMMANDS: readonly AppCommand<LessonPlayerCommandContext>[] = [
  {
    id: "open-command-palette",
    group: "Workspace",
    title: "Open command palette",
    description: "Search lessons, approaches, presets, playback actions, and audit tools.",
    keywords: ["search", "command", "palette", "task"],
    shortcuts: ["Mod+E"],
    shortcutHints: [["Ctrl", "E"]],
    scope: "global",
    isEnabled: (context) => !context.hotkeysOpen && !context.presetStudioOpen,
    run: (context) => context.openCommandPalette(),
  },
  {
    id: "toggle-hotkeys",
    group: "Workspace",
    title: "Open keyboard shortcuts",
    description: "Review every active shortcut from the shared command system.",
    keywords: ["shortcuts", "keyboard", "help"],
    shortcuts: ["F1"],
    shortcutHints: [["F1"]],
    scope: "global",
    isEnabled: (context) => !context.commandOpen && !context.presetStudioOpen,
    run: (context) => {
      context.closeCommandPalette()
      context.toggleHotkeys()
    },
  },
  {
    id: "toggle-audit",
    group: "Audit",
    title: "Toggle lesson audit",
    description: "Open the runtime audit workspace for verification, diffs, and event inspection.",
    keywords: ["audit", "qa", "verification", "diagnostics"],
    shortcuts: ["X"],
    shortcutHints: [["X"]],
    scope: "audit",
    isEnabled: (context) =>
      !context.commandOpen && !context.hotkeysOpen && !context.presetStudioOpen,
    run: (context) => {
      context.closeCommandPalette()
      context.toggleAudit()
    },
  },
  {
    id: "toggle-playback",
    group: "Playback",
    title: "Play or pause",
    description: "Toggle autoplay for the current lesson trace.",
    keywords: ["play", "pause", "autoplay"],
    shortcuts: ["Space"],
    shortcutHints: [["Space"]],
    scope: "player",
    isEnabled: playbackNavigationEnabled,
    run: (context) => context.togglePlayback(),
  },
  {
    id: "play",
    group: "Playback",
    title: "Play",
    description: "Start autoplay from the current frame.",
    keywords: ["play"],
    shortcuts: ["W"],
    shortcutHints: [["W"]],
    scope: "player",
    isEnabled: playbackNavigationEnabled,
    run: (context) => context.play(),
  },
  {
    id: "pause",
    group: "Playback",
    title: "Pause",
    description: "Pause autoplay without resetting the current frame.",
    keywords: ["pause", "stop"],
    shortcuts: ["S"],
    shortcutHints: [["S"]],
    scope: "player",
    isEnabled: playbackNavigationEnabled,
    run: (context) => context.pause(),
  },
  {
    id: "previous-frame",
    group: "Playback",
    title: "Previous frame",
    description: "Move one learner-visible frame backward.",
    keywords: ["back", "previous"],
    shortcuts: ["ArrowLeft", "A"],
    shortcutHints: [["Left"], ["A"]],
    scope: "player",
    isEnabled: (context) => playbackNavigationEnabled(context) && context.hasPreviousFrame,
    run: (context) => context.previousFrame(),
  },
  {
    id: "next-frame",
    group: "Playback",
    title: "Next frame",
    description: "Move one learner-visible frame forward.",
    keywords: ["next", "forward"],
    shortcuts: ["ArrowRight", "D"],
    shortcutHints: [["Right"], ["D"]],
    scope: "player",
    isEnabled: (context) => playbackNavigationEnabled(context) && context.hasNextFrame,
    run: (context) => context.nextFrame(),
  },
  {
    id: "jump-first",
    group: "Playback",
    title: "Jump to first frame",
    description: "Return to the first frame in the runtime timeline.",
    keywords: ["first", "start", "home"],
    shortcuts: ["Home", "Z"],
    shortcutHints: [["Home"], ["Z"]],
    scope: "player",
    isEnabled: playbackNavigationEnabled,
    run: (context) => context.jumpToFirst(),
  },
  {
    id: "jump-last",
    group: "Playback",
    title: "Jump to last frame",
    description: "Jump to the final learner-visible frame.",
    keywords: ["last", "end"],
    shortcuts: ["End", "C"],
    shortcutHints: [["End"], ["C"]],
    scope: "player",
    isEnabled: playbackNavigationEnabled,
    run: (context) => context.jumpToLast(),
  },
  {
    id: "reset-playback",
    group: "Playback",
    title: "Reset playback",
    description: "Rebuild the current runtime from the active preset or custom input.",
    keywords: ["reset", "replay"],
    shortcuts: ["R"],
    shortcutHints: [["R"]],
    scope: "player",
    isEnabled: playbackNavigationEnabled,
    run: (context) => context.reset(),
  },
  {
    id: "speed-down",
    group: "Playback",
    title: "Slow playback",
    description: "Lower autoplay speed by one step.",
    keywords: ["speed", "slower"],
    shortcuts: ["1"],
    shortcutHints: [["1"]],
    scope: "player",
    isEnabled: playbackNavigationEnabled,
    run: (context) => {
      const next = cyclePlaybackSpeed(context.playbackSpeed, -1)
      if (next) {
        context.setPlaybackSpeed(next)
      }
    },
  },
  {
    id: "speed-up",
    group: "Playback",
    title: "Speed up playback",
    description: "Raise autoplay speed by one step.",
    keywords: ["speed", "faster"],
    shortcuts: ["2"],
    shortcutHints: [["2"]],
    scope: "player",
    isEnabled: playbackNavigationEnabled,
    run: (context) => {
      const next = cyclePlaybackSpeed(context.playbackSpeed, 1)
      if (next) {
        context.setPlaybackSpeed(next)
      }
    },
  },
  {
    id: "open-preset-studio",
    group: "Workspace",
    title: "Open preset studio",
    description: "Inspect scenarios, compare preset notes, and switch into custom input.",
    keywords: ["preset", "scenario", "custom", "input"],
    shortcuts: ["Q"],
    shortcutHints: [["Q"]],
    isEnabled: (context) => !context.commandOpen && !context.hotkeysOpen,
    run: (context) => {
      context.closeCommandPalette()
      context.openPresetStudio("presets")
    },
  },
  {
    id: "open-custom-input",
    group: "Workspace",
    title: "Open custom input",
    description: "Jump straight into the preset studio editor for a custom replay.",
    keywords: ["custom input", "input", "json", "replay"],
    isEnabled: (context) => !context.commandOpen && !context.hotkeysOpen,
    run: (context) => {
      context.closeCommandPalette()
      context.openPresetStudio("custom")
    },
  },
  {
    id: "toggle-theme",
    group: "Workspace",
    title: "Toggle theme",
    description: "Switch between the dark and light study themes.",
    keywords: ["theme", "dark", "light"],
    run: (context) => {
      context.closeCommandPalette()
      context.toggleTheme()
    },
  },
] as const

export function getStaticLessonCommands() {
  return STATIC_COMMANDS
}

export function buildLessonCommandPalette(
  context: LessonPlayerCommandContext
): AppCommand<LessonPlayerCommandContext>[] {
  const lessonCommands = context.lessons.map((lesson) => ({
    id: `lesson:${lesson.id}`,
    group: "Tasks",
    title: lesson.title,
    description: lesson.shortPatternNote,
    keywords: [lesson.id, lesson.slug, lesson.confusionType],
    isEnabled: (current: LessonPlayerCommandContext) => current.lesson?.id !== lesson.id,
    run: (current: LessonPlayerCommandContext) => {
      current.setLessonId(lesson.id)
      current.closeCommandPalette()
    },
  }))

  const approachCommands =
    context.lesson?.approaches.map((approach) => ({
      id: `approach:${approach.id}`,
      group: "Approaches",
      title: approach.label,
      description: `Switch ${context.lesson?.title ?? "task"} to the ${approach.label} approach.`,
      keywords: [approach.id],
      isEnabled: (current: LessonPlayerCommandContext) => current.approachId !== approach.id,
      run: (current: LessonPlayerCommandContext) => {
        current.setApproachId(approach.id)
        current.closeCommandPalette()
      },
    })) ?? []

  const presetCommands =
    context.lesson?.approaches
      .find((approach) => approach.id === context.approachId)
      ?.presets.map((preset) => ({
        id: `preset:${preset.id}`,
        group: "Presets",
        title: preset.label,
        description: preset.description ?? `Replay the ${preset.label} preset.`,
        keywords: [preset.id],
        isEnabled: (current: LessonPlayerCommandContext) =>
          current.selectedPresetId !== preset.id,
        run: (current: LessonPlayerCommandContext) => {
          current.selectPreset(preset.id)
          current.closeCommandPalette()
        },
      })) ?? []

  return [
    ...lessonCommands,
    ...approachCommands,
    ...presetCommands,
    ...STATIC_COMMANDS.filter((command) => command.id !== "open-command-palette"),
  ]
}

export function groupVisibleCommands(
  commands: readonly AppCommand<LessonPlayerCommandContext>[],
  context: LessonPlayerCommandContext
) {
  const visible = commands.filter((command) => isCommandVisible(command, context))

  return visible.reduce<Record<string, AppCommand<LessonPlayerCommandContext>[]>>(
    (groups, command) => {
      const group = groups[command.group] ?? []
      group.push(command)
      groups[command.group] = group
      return groups
    },
    {}
  )
}

export function commandDisabled(
  command: AppCommand<LessonPlayerCommandContext>,
  context: LessonPlayerCommandContext
) {
  return !isCommandEnabled(command, context)
}
