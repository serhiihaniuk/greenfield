import type { CodeTemplate } from "@/domains/lessons/types"

type HighlightToken = {
  content: string
  color?: string
  fontStyle?: number
}

export interface CodePresentationLine {
  id: string
  lineNumber: number
  text: string
  highlightable?: boolean
  tokens: HighlightToken[]
}

export interface CodePresentation {
  lines: CodePresentationLine[]
  background: string
  foreground: string
  themeName: string
}

export const DEFAULT_CODE_BACKGROUND = "#24292e"
export const DEFAULT_CODE_FOREGROUND = "#e1e4e8"
export const DEFAULT_CODE_THEME = "plain"

export function buildPlainCodePresentation(
  template: CodeTemplate
): CodePresentation {
  return {
    background: DEFAULT_CODE_BACKGROUND,
    foreground: DEFAULT_CODE_FOREGROUND,
    themeName: DEFAULT_CODE_THEME,
    lines: template.lines.map((line) => ({
      id: line.id,
      lineNumber: line.lineNumber,
      text: line.text,
      highlightable: line.highlightable,
      tokens: [{ content: line.text }],
    })),
  }
}
