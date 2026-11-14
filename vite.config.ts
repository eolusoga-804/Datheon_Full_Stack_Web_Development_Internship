import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Compile Tailwind utilities alongside React during development and builds.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
