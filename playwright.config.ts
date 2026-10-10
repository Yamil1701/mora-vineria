import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: '**/*.e2e.ts', fullyParallel: false, workers: 1, timeout: 45000,
  outputDir: '/tmp/mora-v2-playwright-results', reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173/mora-vineria/', viewport: { width: 390, height: 844 } },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: process.env.MORA_CHROME ? { executablePath: process.env.MORA_CHROME } : {} } },
    { name: 'webkit-mobile', testMatch: ['**/backup.e2e.ts','**/movements.e2e.ts'], use: { browserName: 'webkit', isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173/mora-vineria/', reuseExistingServer: false },
});
