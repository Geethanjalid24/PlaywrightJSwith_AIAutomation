// pages/EmployeeJobDetailsPage.js
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class EmployeeJobDetailsPage extends BasePage {
  constructor(page, testInfo) {
    super(page, testInfo);

    this.jobTab = this.locator('Employee > Job Tab', [
      p => p.getByRole('tab', { name: 'Job' }),
      p => p.getByText('Job', { exact: true }),
    ]);

    this.jobTitleDropdown = this.locator('Employee > Job > Job Title Dropdown', [
      p => p.locator('.oxd-grid-item:has-text("Job Title") .oxd-select-text'),
      p => p.locator('label:has-text("Job Title") ~ div .oxd-select-text'),
    ]);

    this.employmentStatusDropdown = this.locator('Employee > Job > Employment Status Dropdown', [
      p => p.locator('.oxd-grid-item:has-text("Employment Status") .oxd-select-text'),
      p => p.locator('label:has-text("Employment Status") ~ div .oxd-select-text'),
    ]);

    this.dropdownOption = (optionText) => this.locator(`Dropdown Option "${optionText}"`, [
      p => p.locator('.oxd-select-dropdown .oxd-select-option', { hasText: optionText }),
      p => p.getByRole('option', { name: optionText }),
    ]);

    this.saveButton = this.locator('Employee > Job > Save Button', [
      p => p.locator('.oxd-form-actions button[type="submit"]'),
      p => p.getByRole('button', { name: 'Save' }),
    ]);

    this.successToast = this.locator('Employee > Job > Success Toast', [
      p => p.locator('.oxd-toast-content--success'),
      p => p.getByText('Successfully Updated'),
    ]);
  }

  async goToJobTab() {
    await this.runStep('Open employee "Job" tab', async () => {
      await (await this.jobTab.resolve()).first().click();
      await this.waitForSpinnerToDisappear();
    });
  }

  async updateJobTitle(jobTitle) {
    await this.runStep(`Update Job Title to "${jobTitle}"`, async () => {
      await (await this.jobTitleDropdown.resolve()).first().click();
      await (await this.dropdownOption(jobTitle).resolve()).first().click();
    });
  }

  async updateEmploymentStatus(status) {
    await this.runStep(`Update Employment Status to "${status}"`, async () => {
      await (await this.employmentStatusDropdown.resolve()).first().click();
      await (await this.dropdownOption(status).resolve()).first().click();
    });
  }

  async save() {
    await this.runStep('Save updated job information', async () => {
      await (await this.saveButton.resolve()).first().click();
      const toast = await this.successToast.resolve();
      await expect(toast.first(), 'Update success toast should appear').toBeVisible({ timeout: 10000 });
    });
  }

  async verifyJobTitle(expectedJobTitle) {
    await this.runStep(`Verify Job Title reflects "${expectedJobTitle}"`, async () => {
      const dropdown = await this.jobTitleDropdown.resolve();
      await expect(
        dropdown.first(),
        `Job Title field should display "${expectedJobTitle}" after save`
      ).toHaveText(expectedJobTitle, { timeout: 10000 });
    });
  }

  async verifyEmploymentStatus(expectedStatus) {
    await this.runStep(`Verify Employment Status reflects "${expectedStatus}"`, async () => {
      const dropdown = await this.employmentStatusDropdown.resolve();
      await expect(
        dropdown.first(),
        `Employment Status field should display "${expectedStatus}" after save`
      ).toHaveText(expectedStatus, { timeout: 10000 });
    });
  }
}

module.exports = { EmployeeJobDetailsPage };
