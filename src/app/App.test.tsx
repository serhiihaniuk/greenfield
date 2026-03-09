import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"

import App from "@/app/App"
import { ThemeProvider } from "@/app/providers/theme-provider"
import { createVerificationReport } from "@/domains/verification/types"
import { buildPlainCodePresentation } from "@/features/player/code-presentation"
import { lessonPlayerStore } from "@/features/player/store"

vi.mock("@/features/player/code", () => ({
  tokenizeCodeTemplate: async (template: Parameters<typeof buildPlainCodePresentation>[0]) =>
    buildPlainCodePresentation(template),
}))

async function renderApp() {
  await act(async () => {
    render(
      <ThemeProvider defaultTheme="dark" storageKey="greenfield-theme">
        <App />
      </ThemeProvider>
    )
    await Promise.resolve()
    await new Promise((resolve) => window.setTimeout(resolve, 0))
  })
}

describe("App", () => {
  beforeEach(() => {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
      writable: true,
    })
    window.history.replaceState({}, "", "/")
    lessonPlayerStore.getState().initialize("binary-search")
  })

  afterEach(() => {
    window.history.replaceState({}, "", "/")
    lessonPlayerStore.getState().initialize("binary-search")
  })

  it("renders the lesson player toolbar", async () => {
    await renderApp()

    expect(await screen.findByRole("button", { name: /previous frame/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /next frame/i })).toBeInTheDocument()
    expect(screen.getByText("Binary Search", { exact: true })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /open preset studio/i })
    ).toBeInTheDocument()
  })

  it("loads the lesson from the URL path", async () => {
    window.history.replaceState({}, "", "/lessons/graph-bfs")

    await renderApp()

    expect(
      await screen.findByRole("heading", { name: "Graph Frontier" })
    ).toBeInTheDocument()
  })

  it("redirects invalid lesson slugs back to the default lesson", async () => {
    window.history.replaceState({}, "", "/lessons/not-real")

    await renderApp()

    expect(
      await screen.findByRole("heading", { name: "Search Interval" })
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe("/lessons/binary-search")
  })

  it("opens custom input through the dialog shell", async () => {
    await renderApp()

    fireEvent.click(screen.getByRole("button", { name: /open preset studio/i }))
    fireEvent.click(screen.getByText("Custom input", { exact: true }))

    expect(screen.getByRole("dialog", { name: /preset studio/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/custom input editor/i)).toBeInTheDocument()
  })

  it("shows preset descriptions inside the preset studio", async () => {
    await renderApp()

    fireEvent.click(screen.getByRole("button", { name: /open preset studio/i }))
    fireEvent.click(screen.getByText("Not Found", { exact: true }))

    expect(
      screen.getAllByText(/The search exhausts the interval and returns -1/i).length
    ).toBeGreaterThan(0)
  })

  it("renders the verification blocker through the dialog shell", async () => {
    await renderApp()

    await act(async () => {
      lessonPlayerStore.setState({
        verification: createVerificationReport([
          {
            code: "PEDAGOGY_BLOCK",
            kind: "pedagogical-integrity",
            severity: "error",
            message: "The active frame hides required state.",
            frameId: lessonPlayerStore.getState().frames[0]?.id,
            pedagogicalCheck: "hidden-state-loss",
          },
        ]),
        authorMode: false,
      })
    })

    expect(
      await screen.findByRole("dialog", { name: /verification blocked/i })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /open audit mode/i }))

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /verification blocked/i })
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText("Execution Context", { exact: true })).toBeInTheDocument()
  })

  it("renders the primitive audit surface when requested by query param", async () => {
    window.history.replaceState({}, "", "/?audit=primitives")

    await renderApp()

    expect(
      await screen.findByRole("heading", {
        name: /primitive qa harness/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /composition audit: search stage/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /composition audit: recursion stage/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /single primitive scenarios/i })
    ).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { name: /memo table/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("heading", { name: /execution tree/i }).length).toBeGreaterThan(0)
  })
})
