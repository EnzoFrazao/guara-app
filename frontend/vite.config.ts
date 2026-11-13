import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// SPA servida como arquivos estáticos (sem servidor Node). Em desenvolvimento, /api e /ws vão
// para a API FastAPI da homologação (codigo/backend, porta 8000); sem o back-end no ar, o app
// segue com os dados ilustrativos de src/lib/dados-mock.ts.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8000",
      "/ws": { target: "ws://localhost:8000", ws: true },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
