import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@virtality/auth/lib/password': path.resolve(
        __dirname,
        '../auth/src/lib/password.ts',
      ),
      '@virtality/shared/utils': path.resolve(
        __dirname,
        '../shared/src/utils/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
