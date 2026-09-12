// pages/EmployeeListPage.js
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class EmployeeListPage extends BasePage {
  constructor(page, testInfo) {
    super(page, testInfo);

    this.employeeIdSearchInput = this.locator('Employee List > Search > Employee Id Input', [
      p => p.locator('.oxd-grid-item:has-text("Employee Id") input'),
      p => p.locator('label:has-text("Employee Id") ~ input'),
      p => p.locator('input.oxd-input').nth(0),
    ]);

    this.searchButton = this.locator('Employee List > Search Button', [
      p => p.getByRole('button', { name: 'Search' }),
      p => p.locator('button[type="submit"]'),
    ]);

    this.resetButton = this.locator('Employee List > Reset Button', [
      p => p.getByRole('button', { name: 'Reset' }),
    ]);

    this.resultTableRows = this.locator('Employee List > Result Rows', [
      p => p.locator('.oxd-table-body .oxd-table-row'),
      p => p.locator('[role="row"].oxd-table-row'),
    ]);

    this.recordFoundText = this.locator('Employee List > Record Count Text', [
      p => p.locator('.orangehrm-horizontal-padding span').first(),
      p => p.getByText(/Record(s)? Found/),
    ]);

    this.firstRowCheckbox = this.locator('Employee List > First Row Checkbox', [
      p => p.locator('.oxd-table-body .oxd-table-row').first().locator('.oxd-checkbox-wrapper'),
    ]);

    this.deleteSelectedButton = this.locator('Employee List > Delete Selected Button', [
      p => p.getByRole('button', { name: /Delete Selected/i }),
    ]);

    this.confirmDeleteButton = this.locator('Employee List > Confirm Delete Button', [
      p => p.getByRole('button', { name: 'Yes, Delete' }),
    ]);

    this.deleteSuccessToast = this.locator('Employee List > Delete Success Toast', [
      p => p.locator('.oxd-toast-content--success'),
      p => p.getByText('Successfully Deleted'),
    ]);

    this.noRecordsText = this.locator('Employee List > No Records Text', [
      p => p.getByText('No Records Found'),
    ]);
  }

  async searchByEmployeeId(employeeId) {
    await this.runStep(`Search employee by Employee Id "${employeeId}"`, async () => {
      const input = (await this.employeeIdSearchInput.resolve()).first();
      await input.fill('');
      await input.fill(employeeId);
      await (await this.searchButton.resolve()).first().click();
      await this.waitForSpinnerToDisappear();
    });
  }

  async verifyEmployeeFound(employeeId) {
    await this.runStep(`Verify employee "${employeeId}" is present in search results`, async () => {
      const rows = await this.resultTableRows.resolve();
      await expect(rows.first(), `Expected at least one row for Employee Id ${employeeId}`)
        .toBeVisible({ timeout: 10000 });
      await expect(
        this.page.locator('.oxd-table-body'),
        `Result table should contain the Employee Id ${employeeId}`
      ).toContainText(employeeId);
    });
  }

  async openFirstResultRecord() {
    await this.runStep('Open the matched employee record', async () => {
      const rows = await this.resultTableRows.resolve();
      await rows.first().locator('.oxd-table-cell').nth(2).click();
      await this.waitForSpinnerToDisappear();
    });
  }

  async deleteFirstResult() {
    await this.runStep('Delete employee from UI', async () => {
      await (await this.firstRowCheckbox.resolve()).first().click();
      await (await this.deleteSelectedButton.resolve()).first().click();
      await (await this.confirmDeleteButton.resolve()).first().click();
      const toast = await this.deleteSuccessToast.resolve();
      await expect(toast.first(), 'Delete success toast should appear').toBeVisible({ timeout: 10000 });
    });
  }

  async verifyEmployeeDeletedFromUi(employeeId) {
    await this.runStep(`Verify employee "${employeeId}" no longer exists in UI search results`, async () => {
      await this.searchByEmployeeId(employeeId);
      const noRecords = await this.noRecordsText.resolve();
      await expect(
        noRecords.first(),
        `Search for deleted Employee Id ${employeeId} should return "No Records Found"`
      ).toBeVisible({ timeout: 10000 });
    });
  }
}

module.exports = { EmployeeListPage };
