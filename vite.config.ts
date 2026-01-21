import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// This config is for the example app
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "onscreen-recorder": path.resolve(__dirname, "./lib"),
    },
  },
});
