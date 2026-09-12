// utils/SelfHealingLocator.js
//
// Self-healing locator engine.
//
// Every UI element in this framework is defined as an ORDERED ARRAY of candidate
// strategies (not a single selector). resolve() walks the array, returns the first
// strategy that finds >=1 visible/attached element, and:
//   1. Logs a "healing event" whenever the PRIMARY (index 0) strategy fails but a
//      fallback succeeds — this is what "self-healing" means in this framework:
//      the test does not fail just because the DOM/attribute changed, as long as
//      one of the declared alternative strategies still matches the element.
//   2. Persists healing events to reports/self-healing/healing-log.json so a human
//      (or an AI test engineer) can review which locators are getting brittle and
//      promote the healed strategy to primary.
//   3. Throws a clear, descriptive error only if EVERY strategy fails.
//
// This is intentionally dependency-free logic on top of Playwright's own Locator
// API, so it works with auto-waiting/retrying exactly like native locators.

const fs = require('fs');
const path = require('path');

const HEALING_LOG_DIR = path.join(process.cwd(), 'reports', 'self-healing');
const HEALING_LOG_FILE = path.join(HEALING_LOG_DIR, 'healing-log.json');

function ensureLogFile() {
  if (!fs.existsSync(HEALING_LOG_DIR)) {
    fs.mkdirSync(HEALING_LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(HEALING_LOG_FILE)) {
    fs.writeFileSync(HEALING_LOG_FILE, JSON.stringify([], null, 2));
  }
}

function recordHealingEvent(event) {
  try {
    ensureLogFile();
    const existing = JSON.parse(fs.readFileSync(HEALING_LOG_FILE, 'utf-8'));
    existing.push({ ...event, timestamp: new Date().toISOString() });
    fs.writeFileSync(HEALING_LOG_FILE, JSON.stringify(existing, null, 2));
  } catch (err) {
    // Never let logging failures break a test.
    console.warn(`[SelfHealingLocator] Could not persist healing log: ${err.message}`);
  }
}

class SelfHealingLocator {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} elementName  Human-readable name used in logs/errors, e.g. "Login > Username Input"
   * @param {Array<(page: import('@playwright/test').Page) => import('@playwright/test').Locator>} strategies
   *        Ordered list of locator-building functions. Index 0 is the "primary" strategy.
   */
  constructor(page, elementName, strategies) {
    if (!Array.isArray(strategies) || strategies.length === 0) {
      throw new Error(`SelfHealingLocator "${elementName}" requires at least one strategy.`);
    }
    this.page = page;
    this.elementName = elementName;
    this.strategies = strategies;
  }

  /**
   * Resolves to the first working Playwright Locator, healing across strategies as needed.
   * @param {{ timeoutPerStrategyMs?: number }} options
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async resolve(options = {}) {
    const timeoutPerStrategyMs = options.timeoutPerStrategyMs ?? 3000;
    const attempts = [];

    for (let i = 0; i < this.strategies.length; i++) {
      const buildLocator = this.strategies[i];
      let locator;
      try {
        locator = buildLocator(this.page);
        // A strategy "succeeds" if at least one matching element attaches within the timeout.
        await locator.first().waitFor({ state: 'attached', timeout: timeoutPerStrategyMs });

        if (i > 0) {
          // Primary strategy failed but a fallback worked -> this IS the self-healing event.
          recordHealingEvent({
            element: this.elementName,
            healedFromStrategyIndex: 0,
            healedToStrategyIndex: i,
            failedStrategies: attempts,
            url: this.page.url(),
          });
          console.warn(
            `[SelfHealingLocator] Healed "${this.elementName}": primary strategy failed, ` +
            `recovered using fallback strategy #${i}.`
          );
        }
        return locator;
      } catch (err) {
        attempts.push({ strategyIndex: i, error: err.message.split('\n')[0] });
        continue; // try next strategy
      }
    }

    // Every strategy failed.
    recordHealingEvent({
      element: this.elementName,
      healedFromStrategyIndex: 0,
      healedToStrategyIndex: null,
      failedStrategies: attempts,
      url: this.page.url(),
      fatal: true,
    });
    throw new Error(
      `SelfHealingLocator could not resolve "${this.elementName}" — all ${this.strategies.length} ` +
      `strategies failed on ${this.page.url()}.\n` +
      attempts.map(a => `  strategy #${a.strategyIndex}: ${a.error}`).join('\n')
    );
  }

  /** Convenience: resolve then click. */
  async click(options) {
    const locator = await this.resolve();
    await locator.first().click(options);
  }

  /** Convenience: resolve then fill. */
  async fill(value, options) {
    const locator = await this.resolve();
    await locator.first().fill(value, options);
  }

  /** Convenience: resolve then select an option (for <select>). */
  async selectOption(value, options) {
    const locator = await this.resolve();
    await locator.first().selectOption(value, options);
  }

  /** Convenience: resolve then read text content. */
  async textContent() {
    const locator = await this.resolve();
    return (await locator.first().textContent())?.trim();
  }

  /** Convenience: resolve then check visibility (does not throw if absent). */
  async isVisible() {
    try {
      const locator = await this.resolve({ timeoutPerStrategyMs: 2000 });
      return await locator.first().isVisible();
    } catch {
      return false;
    }
  }
}

module.exports = { SelfHealingLocator, HEALING_LOG_FILE };
