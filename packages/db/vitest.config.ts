import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['prisma/seeds/**/*.test.ts'],
  },
})
