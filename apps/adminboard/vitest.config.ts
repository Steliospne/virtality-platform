import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@virtality/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@virtality/shared/utils': path.resolve(
        __dirname,
        '../../packages/shared/src/utils/index.ts',
      ),
      '@virtality/shared/types': path.resolve(
        __dirname,
        '../../packages/shared/src/types/index.ts',
      ),
      '@virtality/react-query': path.resolve(
        __dirname,
        '../../packages/react-query/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['lib/**/*.test.ts', 'components/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
