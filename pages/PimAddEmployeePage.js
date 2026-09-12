// pages/PimAddEmployeePage.js
const { expect } = require('@playwright/test');
const path = require('path');
const { BasePage } = require('./BasePage');

class PimAddEmployeePage extends BasePage {
  constructor(page, testInfo) {
    super(page, testInfo);

    this.addEmployeeButton = this.locator('PIM > Add Employee Button', [
      p => p.getByRole('button', { name: 'Add' }),
      p => p.locator('.oxd-button', { hasText: 'Add' }),
    ]);

    this.firstNameInput = this.locator('PIM > Add Employee > First Name Input', [
      p => p.getByPlaceholder('First Name'),
      p => p.locator('input[name="firstName"]'),
    ]);

    this.lastNameInput = this.locator('PIM > Add Employee > Last Name Input', [
      p => p.getByPlaceholder('Last Name'),
      p => p.locator('input[name="lastName"]'),
    ]);

    this.employeeIdInput = this.locator('PIM > Add Employee > Employee Id Input', [
      p => p.locator('.oxd-grid-item:has-text("Employee Id") input'),
      p => p.locator('label:has-text("Employee Id") ~ input'),
      p => p.locator('.oxd-input').nth(2),
    ]);

    this.profilePictureInput = this.locator('PIM > Add Employee > Profile Picture File Input', [
      p => p.locator('.employee-image input[type="file"]'),
      p => p.locator('input[type="file"]').first(),
    ]);

    this.saveButton = this.locator('PIM > Add Employee > Save Button', [
      p => p.getByRole('button', { name: 'Save' }),
      p => p.locator('button[type="submit"]'),
    ]);

    this.successToast = this.locator('PIM > Add Employee > Success Toast', [
      p => p.locator('.oxd-toast-content--success'),
      p => p.getByText('Successfully Saved'),
    ]);

    this.personalDetailsHeader = this.locator('PIM > Personal Details Header', [
      p => p.getByRole('heading', { name: 'Personal Details' }),
      p => p.getByText('Personal Details', { exact: true }),
    ]);
  }

  async openAddEmployeeForm() {
    await this.runStep('Open PIM > Add Employee form', async () => {
      await (await this.addEmployeeButton.resolve()).first().click();
      await expect(this.page, 'Should navigate to Add Employee form')
        .toHaveURL(/pim\/addEmployee/);
    });
  }

  async fillEmployeeDetails(employee) {
    await this.runStep(
      `Fill employee form (data-driven): ${employee.firstName} ${employee.lastName} / ID ${employee.employeeId}`,
      async () => {
        await (await this.firstNameInput.resolve()).first().fill(employee.firstName);
        await (await this.lastNameInput.resolve()).first().fill(employee.lastName);

        const idField = (await this.employeeIdInput.resolve()).first();
        await idField.fill('');
        await idField.fill(employee.employeeId);

        const filePath = path.resolve(process.cwd(), employee.profilePicture);
        await (await this.profilePictureInput.resolve()).first().setInputFiles(filePath);
      }
    );
  }

  async save() {
    await this.runStep('Save new employee record', async () => {
      await (await this.saveButton.resolve()).first().click();
      const header = await this.personalDetailsHeader.resolve();
      await expect(
        header.first(),
        'Personal Details page should load, confirming the new employee record was created'
      ).toBeVisible({ timeout: 15000 });
    });
  }

  /** Reads the auto-generated numeric Employee Id shown on the Personal Details page after save. */
  async getSystemEmployeeId() {
    return this.runStep('Capture system-generated Employee Id from Personal Details page', async () => {
      const idInput = this.page.locator('label:has-text("Employee Id") ~ input, .oxd-input').first();
      const value = await this.page.locator('input.oxd-input').nth(2).inputValue().catch(async () => {
        return idInput.inputValue();
      });
      return value;
    });
  }
}

module.exports = { PimAddEmployeePage };
