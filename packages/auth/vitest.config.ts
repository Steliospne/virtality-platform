import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@virtality/shared/utils': path.resolve(
        __dirname,
        '../shared/src/utils/index.ts',
      ),
      '@virtality/shared/types': path.resolve(
        __dirname,
        '../shared/src/types/index.ts',
      ),
      '@virtality/db': path.resolve(__dirname, '../db/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
