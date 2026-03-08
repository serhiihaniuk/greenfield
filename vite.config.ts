import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.split(path.sep).join("/")

          if (normalized.includes("/content/lessons/")) {
            return "lesson-content"
          }

          if (normalized.includes("/src/widgets/primitive-audit/")) {
            return "primitive-audit"
          }

          if (normalized.includes("/node_modules/react/")) {
            return "react-vendor"
          }

          if (normalized.includes("/node_modules/react-dom/")) {
            return "react-dom-vendor"
          }

          if (
            normalized.includes("/node_modules/motion/") ||
            normalized.includes("/node_modules/lucide-react/") ||
            normalized.includes("/node_modules/d3-hierarchy/") ||
            normalized.includes("/node_modules/react-resizable-panels/")
          ) {
            return "ui-vendor"
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
