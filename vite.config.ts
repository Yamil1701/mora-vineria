import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/mora-vineria/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});