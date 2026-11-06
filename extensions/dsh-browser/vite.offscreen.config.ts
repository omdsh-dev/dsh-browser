import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { outDir, sharedPlugins } from './vite.shared.ts'

/**
 * Offscreen document: a packaged extension page the background uses to write
 * the system clipboard, which an MV3 service worker cannot touch directly.
 */
export default defineConfig({
  plugins: sharedPlugins,
  build: {
    outDir,
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'offscreen/index.html'),
      output: {
        entryFileNames: 'offscreen/[name].js',
        chunkFileNames: 'offscreen/[name]-[hash].js',
        assetFileNames: 'offscreen/[name][extname]',
      },
    },
  },
})

export { outDir }
