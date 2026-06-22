import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Change this to match your GitHub Pages repository name.
// Example: https://github.com/USERNAME/little-signs uses base: "/little-signs/"
// Example: https://USERNAME.github.io uses base: "/"
const githubPagesBase = "/little-signs/";

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === "production" ? githubPagesBase : "/"
});
