import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  server: {
    port: 5173,
    host: "127.0.0.1",
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 900,
    // SSR 构建下三方依赖是 external，不能参与 manualChunks
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            // 生产级分包：三方依赖与业务代码分离，提升首屏与缓存命中
            manualChunks: {
              react: ["react", "react-dom", "react-router-dom"],
              charts: ["recharts"],
              motion: ["framer-motion"],
              markdown: ["react-markdown", "remark-gfm"],
            },
          },
        },
  },
}));
