/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      globals: true,
      exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        exclude: [
          'dist/**',
          'coverage/**',
          'node_modules/**',
          '*.config.*',
          'src/test/**',
          'src/**/*.test.{ts,tsx}',
          'src/**/*.d.ts',
          'src/main.tsx',
          'src/App.tsx',
          'src/app/providers/**',
          'src/app/router/**',
          'src/features/**/index.ts',
        ],
      },
    },
  }
})
