// pages/BasePage.js
// Shared base class for all Page Objects: wires up SelfHealingLocator + ScreenshotHelper
// so every page object gets consistent, resilient element access and evidence capture.

const { SelfHealingLocator } = require('../utils/SelfHealingLocator');
const { ScreenshotHelper } = require('../utils/ScreenshotHelper');
const { step } = require('../utils/Logger');

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {import('@playwright/test').TestInfo} testInfo
   */
  constructor(page, testInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.screenshots = new ScreenshotHelper(page, testInfo);
  }

  /**
   * Builds a self-healing locator for this page. `name` should be unique/descriptive
   * for readable logs, e.g. "PIM > Add Employee > Save Button".
   * `strategies` is an ordered array of (page) => Locator functions.
   */
  locator(name, strategies) {
    return new SelfHealingLocator(this.page, name, strategies);
  }

  async waitForSpinnerToDisappear() {
    // OrangeHRM shows a ".oxd-loading-spinner" during async grid/table loads.
    const spinner = this.page.locator('.oxd-loading-spinner, .oxd-form-loader');
    try {
      await spinner.first().waitFor({ state: 'visible', timeout: 2000 });
      await spinner.first().waitFor({ state: 'hidden', timeout: 15000 });
    } catch {
      // Spinner may never appear if the action was fast enough — that's fine.
    }
  }

  async runStep(title, fn) {
    try {
      return await step(title, fn);
    } catch (err) {
      await this.screenshots.captureFailure(title, err);
      throw err;
    }
  }
}

module.exports = { BasePage };
