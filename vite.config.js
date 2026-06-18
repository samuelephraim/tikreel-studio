import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Change the base below depending on where you host:
//  - Vercel / Netlify  → base: "/"
//  - GitHub Pages      → base: "/tikreel-studio/"   (must match your repo name)

export default defineConfig({
  plugins: [react()],
  base: "/",   // ← change to "/tikreel-studio/" if using GitHub Pages
});
