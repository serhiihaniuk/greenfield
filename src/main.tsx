import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "@/app/App"
import { ThemeProvider } from "@/app/providers/theme-provider"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="greenfield-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
)
