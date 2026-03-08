import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"

import { resolveApproach, resolvePreset } from "@/domains/lessons/loaders"
import type { VisualizationMode } from "@/domains/lessons/types"
import {
  buildLessonRuntime,
  DEFAULT_PLAYBACK_SPEED,
  resolvePlayerSelection,
  type PersistedLessonPreference,
} from "@/features/player/runtime"
import type {
  LessonPlayerState,
  LessonPlayerStoreState,
  PlaybackSpeed,
} from "@/features/player/types"

const PLAYER_PREFERENCES_KEY = "greenfield:lesson-player-preferences:v1"

type PreferenceRecord = Record<string, PersistedLessonPreference>

function readPreferences(): PreferenceRecord {
  try {
    const raw = localStorage.getItem(PLAYER_PREFERENCES_KEY)
    if (!raw) {
      return {}
    }

    return JSON.parse(raw) as PreferenceRecord
  } catch {
    return {}
  }
}

function writePreferences(preferences: PreferenceRecord) {
  localStorage.setItem(PLAYER_PREFERENCES_KEY, JSON.stringify(preferences))
}

function persistPreference(lessonId: string, preference: PersistedLessonPreference) {
  const preferences = readPreferences()
  preferences[lessonId] = {
    ...preferences[lessonId],
    ...preference,
  }
  writePreferences(preferences)
}

function createBaseState(): LessonPlayerState {
  return {
    lessonId: "",
    lesson: undefined,
    approachId: "",
    approach: undefined,
    mode: "focus",
    inputSource: "preset",
    selectedPresetId: undefined,
    rawInput: "",
    parsedInput: undefined,
    trace: [],
    frames: [],
    currentFrameIndex: 0,
    playbackStatus: "idle",
    playbackSpeed: DEFAULT_PLAYBACK_SPEED,
    verification: undefined,
    authorMode: false,
    selectedEventId: undefined,
    failure: undefined,
  }
}

export function createLessonPlayerStore() {
  return createStore<LessonPlayerStoreState>()((set, get) => ({
    ...createBaseState(),
    initialize: (lessonIdOrSlug) => {
      const fallbackPreferences = readPreferences()
      const selection = resolvePlayerSelection(
        lessonIdOrSlug,
        lessonIdOrSlug ? fallbackPreferences[lessonIdOrSlug] : undefined
      )
      const runtime = buildLessonRuntime({
        lesson: selection.lesson,
        approach: selection.approach,
        mode: selection.mode,
        rawInput: selection.rawInput,
      })

      set({
        lessonId: selection.lesson.id,
        lesson: selection.lesson,
        approachId: selection.approach.id,
        approach: selection.approach,
        mode: selection.mode,
        inputSource: selection.inputSource,
        selectedPresetId: selection.selectedPresetId,
        rawInput: selection.rawInput,
        parsedInput: runtime.parsedInput,
        trace: runtime.trace,
        frames: runtime.frames,
        currentFrameIndex: 0,
        playbackStatus: runtime.failure ? "error" : "idle",
        playbackSpeed: selection.playbackSpeed,
        verification: runtime.verification,
        selectedEventId: runtime.trace[0]?.id,
        failure: runtime.failure,
      })

      persistPreference(selection.lesson.id, {
        approachId: selection.approach.id,
        mode: selection.mode,
        selectedPresetId: selection.selectedPresetId,
        rawInput: selection.rawInput,
        inputSource: selection.inputSource,
        playbackSpeed: selection.playbackSpeed,
      })
    },
    setLessonId: (lessonIdOrSlug) => {
      get().initialize(lessonIdOrSlug)
    },
    setApproachId: (approachId) => {
      const state = get()
      if (!state.lesson) {
        return
      }

      const approach = resolveApproach(state.lesson, approachId)
      const preset = resolvePreset(approach)
      const rawInput =
        state.inputSource === "custom" ? state.rawInput : preset?.rawInput ?? ""
      const runtime = buildLessonRuntime({
        lesson: state.lesson,
        approach,
        mode: state.mode,
        rawInput,
      })

      set({
        approachId: approach.id,
        approach,
        selectedPresetId: preset?.id,
        rawInput,
        parsedInput: runtime.parsedInput,
        trace: runtime.trace,
        frames: runtime.frames,
        currentFrameIndex: 0,
        playbackStatus: runtime.failure ? "error" : "idle",
        verification: runtime.verification,
        selectedEventId: runtime.trace[0]?.id,
        failure: runtime.failure,
      })

      persistPreference(state.lesson.id, {
        approachId: approach.id,
        selectedPresetId: preset?.id,
        rawInput,
        inputSource: state.inputSource,
      })
    },
    setMode: (mode: VisualizationMode) => {
      const state = get()
      if (!state.lesson || !state.approach || !state.rawInput) {
        return
      }

      const runtime = buildLessonRuntime({
        lesson: state.lesson,
        approach: state.approach,
        mode,
        rawInput: state.rawInput,
      })

      set({
        mode,
        frames: runtime.frames,
        currentFrameIndex: 0,
        parsedInput: runtime.parsedInput,
        trace: runtime.trace,
        playbackStatus: runtime.failure ? "error" : "idle",
        verification: runtime.verification,
        selectedEventId: runtime.trace[0]?.id,
        failure: runtime.failure,
      })

      persistPreference(state.lesson.id, { mode })
    },
    selectPreset: (presetId) => {
      const state = get()
      if (!state.lesson || !state.approach) {
        return
      }

      const preset = resolvePreset(state.approach, presetId)
      if (!preset) {
        return
      }

      const runtime = buildLessonRuntime({
        lesson: state.lesson,
        approach: state.approach,
        mode: state.mode,
        rawInput: preset.rawInput,
      })

      set({
        inputSource: "preset",
        selectedPresetId: preset.id,
        rawInput: preset.rawInput,
        parsedInput: runtime.parsedInput,
        trace: runtime.trace,
        frames: runtime.frames,
        currentFrameIndex: 0,
        playbackStatus: runtime.failure ? "error" : "idle",
        verification: runtime.verification,
        selectedEventId: runtime.trace[0]?.id,
        failure: runtime.failure,
      })

      persistPreference(state.lesson.id, {
        inputSource: "preset",
        selectedPresetId: preset.id,
        rawInput: preset.rawInput,
      })
    },
    setRawInput: (rawInput) => set({ rawInput }),
    applyCustomInput: () => {
      const state = get()
      if (!state.lesson || !state.approach) {
        return
      }

      const runtime = buildLessonRuntime({
        lesson: state.lesson,
        approach: state.approach,
        mode: state.mode,
        rawInput: state.rawInput,
      })

      set({
        inputSource: "custom",
        parsedInput: runtime.parsedInput,
        trace: runtime.trace,
        frames: runtime.frames,
        currentFrameIndex: 0,
        playbackStatus: runtime.failure ? "error" : "idle",
        verification: runtime.verification,
        selectedEventId: runtime.trace[0]?.id,
        failure: runtime.failure,
      })

      persistPreference(state.lesson.id, {
        inputSource: "custom",
        rawInput: state.rawInput,
      })
    },
    play: () => {
      const state = get()
      if (state.frames.length === 0) {
        return
      }

      if (state.currentFrameIndex >= state.frames.length - 1) {
        set({ currentFrameIndex: 0, playbackStatus: "playing" })
        return
      }

      set({ playbackStatus: "playing" })
    },
    pause: () => set({ playbackStatus: "paused" }),
    nextFrame: () => {
      const state = get()
      if (state.frames.length === 0) {
        return
      }

      const nextIndex = Math.min(
        state.currentFrameIndex + 1,
        state.frames.length - 1
      )

      set({
        currentFrameIndex: nextIndex,
        playbackStatus:
          nextIndex >= state.frames.length - 1 ? "ended" : state.playbackStatus,
        selectedEventId: state.frames[nextIndex]?.sourceEventId,
      })
    },
    previousFrame: () => {
      const state = get()
      const nextIndex = Math.max(state.currentFrameIndex - 1, 0)

      set({
        currentFrameIndex: nextIndex,
        playbackStatus: nextIndex === 0 ? "idle" : "paused",
        selectedEventId: state.frames[nextIndex]?.sourceEventId,
      })
    },
    jumpToFirst: () => {
      const state = get()
      set({
        currentFrameIndex: 0,
        playbackStatus: "idle",
        selectedEventId: state.frames[0]?.sourceEventId,
      })
    },
    jumpToLast: () => {
      const state = get()
      const nextIndex = Math.max(state.frames.length - 1, 0)
      set({
        currentFrameIndex: nextIndex,
        playbackStatus: state.frames.length > 0 ? "ended" : "idle",
        selectedEventId: state.frames[nextIndex]?.sourceEventId,
      })
    },
    scrubTo: (frameIndex) => {
      const state = get()
      const boundedIndex = Math.min(
        Math.max(frameIndex, 0),
        Math.max(state.frames.length - 1, 0)
      )

      set({
        currentFrameIndex: boundedIndex,
        selectedEventId: state.frames[boundedIndex]?.sourceEventId,
        playbackStatus:
          boundedIndex >= state.frames.length - 1 ? "ended" : "paused",
      })
    },
    reset: () => {
      const state = get()
      if (!state.lesson || !state.approach) {
        return
      }

      const rawInput =
        state.inputSource === "preset" && state.selectedPresetId
          ? resolvePreset(state.approach, state.selectedPresetId)?.rawInput ??
            state.rawInput
          : state.rawInput

      const runtime = buildLessonRuntime({
        lesson: state.lesson,
        approach: state.approach,
        mode: state.mode,
        rawInput,
      })

      set({
        rawInput,
        parsedInput: runtime.parsedInput,
        trace: runtime.trace,
        frames: runtime.frames,
        currentFrameIndex: 0,
        playbackStatus: runtime.failure ? "error" : "idle",
        verification: runtime.verification,
        selectedEventId: runtime.trace[0]?.id,
        failure: runtime.failure,
      })
    },
    setPlaybackSpeed: (playbackSpeed: PlaybackSpeed) => {
      const state = get()
      set({ playbackSpeed })
      if (state.lesson) {
        persistPreference(state.lesson.id, { playbackSpeed })
      }
    },
    toggleAuthorMode: () =>
      set((state) => ({ authorMode: !state.authorMode })),
    setSelectedEventId: (selectedEventId) => set({ selectedEventId }),
  }))
}

export const lessonPlayerStore = createLessonPlayerStore()

export function useLessonPlayerStore<T>(
  selector: (state: LessonPlayerStoreState) => T
) {
  return useStore(lessonPlayerStore, selector)
}
