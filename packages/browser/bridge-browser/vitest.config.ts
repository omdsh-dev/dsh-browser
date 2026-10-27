import { defineConfig } from 'vitest/config'

/** Standalone test runner against the published DeepSeek Harness packages. */
export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
  },
})
