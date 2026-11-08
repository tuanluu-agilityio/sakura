import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets parallel worktrees run e2e without sharing a preview server.
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results/artifacts',
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
