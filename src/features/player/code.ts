import { createHighlighter } from "shiki"

import type { CodeLanguage, CodeTemplate } from "@/domains/lessons/types"

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

let highlighterPromise:
  | ReturnType<typeof createHighlighter>
  | undefined

function toShikiLanguage(language: CodeLanguage) {
  switch (language) {
    case "typescript":
      return "ts"
    case "javascript":
      return "js"
    case "python":
      return "python"
    case "java":
      return "java"
    case "cpp":
      return "cpp"
    case "go":
      return "go"
    default:
      return "txt"
  }
}

async function getHighlighter() {
  highlighterPromise ??= createHighlighter({
    themes: ["github-dark"],
    langs: ["ts", "js", "python", "java", "cpp", "go", "txt"],
  })

  return highlighterPromise
}

export async function tokenizeCodeTemplate(
  template: CodeTemplate
): Promise<CodePresentation> {
  const highlighter = await getHighlighter()
  const source = template.lines.map((line) => line.text).join("\n")
  const tokenized = highlighter.codeToTokens(source, {
    lang: toShikiLanguage(template.language),
    theme: "github-dark",
  })

  return {
    background: tokenized.bg ?? "#24292e",
    foreground: tokenized.fg ?? "#e1e4e8",
    themeName: tokenized.themeName ?? "github-dark",
    lines: template.lines.map((line, index) => ({
      id: line.id,
      lineNumber: line.lineNumber,
      text: line.text,
      highlightable: line.highlightable,
      tokens: tokenized.tokens[index] ?? [],
    })),
  }
}
