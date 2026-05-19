import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "copy-extension-manifest",
      closeBundle() {
        mkdirSync(resolve(__dirname, "dist"), { recursive: true });
        const rootManifest = readFileSync(resolve(__dirname, "manifest.json"), "utf8");
        const distManifest = rootManifest.replaceAll('"dist/', '"');
        writeFileSync(resolve(__dirname, "dist/manifest.json"), distManifest);
        if (existsSync(resolve(__dirname, "resume.md"))) {
          copyFileSync(resolve(__dirname, "resume.md"), resolve(__dirname, "dist/resume.md"));
        }
      }
    }
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        jobPage: resolve(__dirname, "src/content/jobPage.ts"),
        chatgpt: resolve(__dirname, "src/content/chatgpt.ts")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
