import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 0.0.0.0 바인딩 → Codespaces 외부 접속 허용
    port: 5173,
    strictPort: true,
  },
});
