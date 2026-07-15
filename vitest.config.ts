import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/**/*.test.ts', 'src/**/*.bench.ts', 'src/test-helpers.ts'],
      include: ['src/**/*.ts'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    environment: 'happy-dom',
    exclude: ['src/types.test.ts'],
    include: ['src/**/*.test.ts'],
  },
})
