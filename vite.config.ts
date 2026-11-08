import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.glsl'],
  build: { target: 'es2022' },
  test: { include: ['src/**/*.test.ts', 'tools/**/*.test.ts'] },
} as import('vite').UserConfig & { test: unknown });
