import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@virtality/shared/utils': path.resolve(
        __dirname,
        '../../packages/shared/src/utils/index.ts',
      ),
      '@virtality/shared/types': path.resolve(
        __dirname,
        '../../packages/shared/src/types/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
