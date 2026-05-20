import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single-file build: all JS + CSS inlined into one index.html
export default defineConfig({
  plugins: [react(), viteSingleFile()],
})
