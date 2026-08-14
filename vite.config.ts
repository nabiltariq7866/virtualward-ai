import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], test: { include: ['src/**/*.test.ts'], environment: 'node', globals: true, setupFiles: './src/test/setup.ts', pool: 'threads', maxWorkers: 1 } })
