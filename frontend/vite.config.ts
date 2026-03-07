import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React 全家桶单独 chunk，利于缓存与主包瘦身
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/react-router-dom/")) {
            return "vendor-router";
          }
          if (id.includes("node_modules/@tanstack/react-query/")) {
            return "vendor-query";
          }
          // Markdown + 数学公式（katex）仅问答页使用，打单独 chunk
          if (
            id.includes("node_modules/react-markdown/") ||
            id.includes("node_modules/remark-") ||
            id.includes("node_modules/rehype-") ||
            id.includes("node_modules/katex/")
          ) {
            return "vendor-markdown";
          }
          // UI 库与工具
          if (
            id.includes("node_modules/radix-ui/") ||
            id.includes("node_modules/lucide-react/") ||
            id.includes("node_modules/sonner/")
          ) {
            return "vendor-ui";
          }
          if (
            id.includes("node_modules/zustand/") ||
            id.includes("node_modules/next-themes/")
          ) {
            return "vendor-state";
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  test: {
    environment: "jsdom",
    clearMocks: true,
  },
});
