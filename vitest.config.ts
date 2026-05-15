import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    // pool: 'forks' prevents vi.stubGlobal/vi.resetModules conflicts between
    // jsdom test files running in parallel (plan 02-03 fix — all 115 tests pass).
    pool: 'forks',
  },
})
