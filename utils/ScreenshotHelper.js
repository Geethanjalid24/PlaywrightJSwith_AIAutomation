// utils/ScreenshotHelper.js
//
// Wraps Playwright's native screenshot-comparison assertion (`expect(page).toHaveScreenshot()`)
// so every validation checkpoint in the scenario:
//   1. Captures a full-page screenshot.
//   2. Compares it pixel-by-pixel against a committed baseline (reports/../__screenshots__)
//      using the maxDiffPixelRatio configured in playwright.config.js.
//   3. On the FIRST run (no baseline yet) Playwright auto-creates the baseline; commit it.
//   4. On mismatch, Playwright writes actual/expected/diff PNGs into the HTML report AND
//      the checkpoint is also stored under reports/screenshots/<step>.png as durable
//      "failure evidence" independent of the HTML report.
//   5. Also exposes a plain (non-comparison) evidence capture for steps that are expected
//      to always change (e.g. a page showing a live timestamp) but still need a screenshot
//      on record for the report.

const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');

const EVIDENCE_DIR = path.join(process.cwd(), 'reports', 'screenshots');

function ensureEvidenceDir() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
}

class ScreenshotHelper {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {import('@playwright/test').TestInfo} testInfo
   */
  constructor(page, testInfo) {
    this.page = page;
    this.testInfo = testInfo;
  }

  /**
   * Visual-regression checkpoint: compares against a stored baseline and fails
   * the test (with diff image attached to the HTML report) if pixels drift
   * beyond the configured threshold.
   *
   * @param {string} checkpointName  e.g. "dashboard-after-login"
   * @param {{ mask?: import('@playwright/test').Locator[], fullPage?: boolean }} options
   */
  async compare(checkpointName, options = {}) {
    ensureEvidenceDir();
    const fileName = `${checkpointName}.png`;

    await expect(this.page, `Visual checkpoint failed: "${checkpointName}"`).toHaveScreenshot(fileName, {
      fullPage: options.fullPage ?? true,
      mask: options.mask ?? [],
    });

    // Also keep a durable, human-browsable copy of the checkpoint outside the snapshot cache.
    const evidencePath = path.join(EVIDENCE_DIR, `${this.testInfo.title.replace(/\s+/g, '_')}__${checkpointName}.png`);
    await this.page.screenshot({ path: evidencePath, fullPage: true });
    await this.testInfo.attach(`checkpoint: ${checkpointName}`, { path: evidencePath, contentType: 'image/png' });

    return evidencePath;
  }

  /**
   * Plain evidence screenshot (no baseline comparison) — used for report evidence at
   * points where pixel-perfect comparison isn't meaningful (e.g. dynamic data grids).
   */
  async capture(label) {
    ensureEvidenceDir();
    const safeLabel = label.replace(/\s+/g, '_');
    const evidencePath = path.join(EVIDENCE_DIR, `${this.testInfo.title.replace(/\s+/g, '_')}__${safeLabel}.png`);
    await this.page.screenshot({ path: evidencePath, fullPage: true });
    await this.testInfo.attach(`evidence: ${label}`, { path: evidencePath, contentType: 'image/png' });
    return evidencePath;
  }

  /** Explicit failure-screenshot capture, called from a step's catch block. */
  async captureFailure(stepName, error) {
    ensureEvidenceDir();
    const safeLabel = `FAILURE__${stepName}`.replace(/\s+/g, '_');
    const evidencePath = path.join(EVIDENCE_DIR, `${this.testInfo.title.replace(/\s+/g, '_')}__${safeLabel}.png`);
    await this.page.screenshot({ path: evidencePath, fullPage: true }).catch(() => {});
    await this.testInfo.attach(`FAILURE at step: ${stepName}`, {
      path: evidencePath,
      contentType: 'image/png',
    }).catch(() => {});
    console.error(`[ScreenshotHelper] Failure screenshot captured for step "${stepName}": ${error?.message}`);
    return evidencePath;
  }
}

module.exports = { ScreenshotHelper };
