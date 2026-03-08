import { createBundledHighlighter } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

import type { CodeLanguage, CodeTemplate } from "@/domains/lessons/types"
import {
  buildPlainCodePresentation,
  DEFAULT_CODE_BACKGROUND,
  DEFAULT_CODE_FOREGROUND,
  type CodePresentation,
} from "@/features/player/code-presentation"

const createCodeHighlighter = createBundledHighlighter({
  langs: {
    ts: () => import("@shikijs/langs/typescript"),
  },
  themes: {
    "github-dark": () => import("@shikijs/themes/github-dark"),
  },
  engine: () => createJavaScriptRegexEngine(),
})

let highlighterPromise:
  | ReturnType<typeof createCodeHighlighter>
  | undefined

function toShikiLanguage(language: CodeLanguage) {
  switch (language) {
    case "typescript":
      return "ts"
    default:
      return null
  }
}

async function getHighlighter() {
  highlighterPromise ??= createCodeHighlighter({
    themes: ["github-dark"],
    langs: ["ts"],
  })

  return highlighterPromise
}

export async function tokenizeCodeTemplate(
  template: CodeTemplate
): Promise<CodePresentation> {
  const language = toShikiLanguage(template.language)
  if (!language) return buildPlainCodePresentation(template)

  const highlighter = await getHighlighter()
  const source = template.lines.map((line) => line.text).join("\n")
  const tokenized = await highlighter.codeToTokens(source, {
    lang: language,
    theme: "github-dark",
  })

  return {
    background: tokenized.bg ?? DEFAULT_CODE_BACKGROUND,
    foreground: tokenized.fg ?? DEFAULT_CODE_FOREGROUND,
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
