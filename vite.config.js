import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      fastboot: path.resolve(__dirname, "./lib/fastboot"),
      opfs_blob_store: path.resolve(__dirname, "./lib/opfs_blob_store"),
    },
  },
  base: process.env.BASE_URL ? process.env.BASE_URL : "/",
})
