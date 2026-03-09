import type { Frame } from "@/domains/projection/types"
import type { ExecutionTokenStyle } from "@/entities/visualization/types"
import type { CodePresentation, CodePresentationLine } from "@/features/player/code-presentation"

type FrameExecutionToken = {
  id: string
  label: string
  style: ExecutionTokenStyle
}

function collectFrameExecutionTokens(frame: Frame | undefined): FrameExecutionToken[] {
  if (!frame) {
    return []
  }

  const tokens = new Map<string, FrameExecutionToken>()

  const addToken = (
    tokenId: string | undefined,
    label: string | undefined,
    style: ExecutionTokenStyle | undefined
  ) => {
    if (!tokenId || !label || !style || tokens.has(tokenId)) {
      return
    }

    tokens.set(tokenId, {
      id: tokenId,
      label,
      style,
    })
  }

  for (const primitive of frame.primitives) {
    if (primitive.kind === "state") {
      const values = (primitive.data as { values: Array<{ label: string; tokenId?: string; tokenStyle?: ExecutionTokenStyle }> }).values
      for (const value of values) {
        addToken(value.tokenId, value.label, value.tokenStyle)
      }
      continue
    }

    if (primitive.kind === "stack") {
      const frames = (primitive.data as { frames: Array<{ label: string; tokenId?: string; tokenStyle?: ExecutionTokenStyle }> }).frames
      for (const stackFrame of frames) {
        addToken(stackFrame.tokenId, stackFrame.label, stackFrame.tokenStyle)
      }
      continue
    }

    if (primitive.kind === "call-tree") {
      const nodes = (primitive.data as { nodes: Array<{ label: string; tokenId?: string; tokenStyle?: ExecutionTokenStyle }> }).nodes
      for (const node of nodes) {
        addToken(node.tokenId, node.label, node.tokenStyle)
      }
    }
  }

  for (const segment of frame.narration.segments) {
    addToken(segment.tokenId, segment.text, segment.tokenStyle)
  }

  return [...tokens.values()].sort((left, right) => right.label.length - left.label.length)
}

function splitTokenContent(
  content: string,
  token: FrameExecutionToken,
  _lineId: string,
  _tokenIndex: number,
  _partIndex: number
) {
  if (!content || !token.label) {
    return [{ content }]
  }

  const pattern = new RegExp(`\\b${token.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g")
  const parts: Array<{
    content: string
    tokenId?: string
    tokenStyle?: ExecutionTokenStyle
  }> = []

  let lastIndex = 0
  let match = pattern.exec(content)
  while (match) {
    if (match.index > lastIndex) {
      parts.push({ content: content.slice(lastIndex, match.index) })
    }

    parts.push({
      content: match[0],
      tokenId: token.id,
      tokenStyle: token.style,
    })

    lastIndex = match.index + match[0].length
    match = pattern.exec(content)
  }

  if (parts.length === 0) {
    return [{ content }]
  }

  if (lastIndex < content.length) {
    parts.push({ content: content.slice(lastIndex) })
  }

  return parts
}

function decorateLineTokens(
  line: CodePresentationLine,
  frameTokens: FrameExecutionToken[],
  activeLineId: string | undefined
): CodePresentationLine {
  if (line.id !== activeLineId || frameTokens.length === 0) {
    return line
  }

  const decoratedTokens = line.tokens.flatMap((token, tokenIndex) => {
    let parts = [{ ...token }]

    for (const frameToken of frameTokens) {
      parts = parts.flatMap((part, partIndex) => {
        if (part.tokenId || !part.content.trim()) {
          return [part]
        }

        return splitTokenContent(
          part.content,
          frameToken,
          line.id,
          tokenIndex,
          partIndex
        ).map((splitPart) => ({
          ...part,
          ...splitPart,
        }))
      })
    }

    return parts
  })

  return {
    ...line,
    tokens: decoratedTokens,
  }
}

export function decorateCodePresentationWithExecutionTokens(
  presentation: CodePresentation | undefined,
  frame: Frame | undefined
): CodePresentation | undefined {
  if (!presentation || !frame) {
    return presentation
  }

  const frameTokens = collectFrameExecutionTokens(frame)
  if (frameTokens.length === 0) {
    return presentation
  }

  return {
    ...presentation,
    lines: presentation.lines.map((line) =>
      decorateLineTokens(line, frameTokens, frame.codeLine)
    ),
  }
}
