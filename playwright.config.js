// playwright.config.js
// Central Playwright configuration.
// - Records video for every test (evidence requirement).
// - Captures screenshots on failure AND at each validation checkpoint (via ScreenshotHelper).
// - Produces an HTML report that embeds videos, screenshots, and step traces.
// - Reports total execution time via the custom TimingReporter.

const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90 * 1000,
  expect: {
    timeout: 10 * 1000,
    // Threshold for screenshot comparison (visual regression) assertions.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  fullyParallel: false, // lifecycle scenario is stateful/sequential by design
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  // Multiple reporters: HTML (visual report w/ video+screenshots), list (console), JSON (raw data),
  // and a custom reporter that prints/persists total execution time.
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/results/results.json' }],
    ['./utils/TimingReporter.js'],
  ],

  outputDir: 'reports/test-artifacts',

  use: {
    baseURL: process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com',
    headless: true,
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,

    // Video evidence for every test run (kept even on pass, per assessment requirement).
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 },
    },

    // Failure screenshots (full page) + trace for debugging/self-healing analysis.
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    trace: 'retain-on-failure',

    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
