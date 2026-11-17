const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'line',
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', actionTimeout: 15000, acceptDownloads: true },
  webServer: { command: 'python3 -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 20000 }
});
