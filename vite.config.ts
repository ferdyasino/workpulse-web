import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      "/gas": {
        target: "https://script.google.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gas/, ""),
      },
    },
  },
});
