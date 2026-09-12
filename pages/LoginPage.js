// pages/LoginPage.js
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page, testInfo) {
    super(page, testInfo);

    this.usernameInput = this.locator('Login > Username Input', [
      p => p.getByPlaceholder('Username'),
      p => p.locator('input[name="username"]'),
      p => p.locator('.oxd-input').first(),
    ]);

    this.passwordInput = this.locator('Login > Password Input', [
      p => p.getByPlaceholder('Password'),
      p => p.locator('input[name="password"]'),
      p => p.locator('.oxd-input').nth(1),
    ]);

    this.loginButton = this.locator('Login > Submit Button', [
      p => p.getByRole('button', { name: 'Login' }),
      p => p.locator('button[type="submit"]'),
      p => p.locator('.oxd-button'),
    ]);

    this.errorAlert = this.locator('Login > Error Alert', [
      p => p.locator('.oxd-alert-content-text'),
      p => p.getByText('Invalid credentials'),
    ]);
  }

  async goto() {
    await this.runStep('Navigate to OrangeHRM login page', async () => {
      await this.page.goto('/web/index.php/auth/login');
      await expect(this.page).toHaveTitle(/OrangeHRM/);
    });
  }

  async login(username, password) {
    await this.runStep(`Login as "${username}"`, async () => {
      await (await this.usernameInput.resolve()).first().fill(username);
      await (await this.passwordInput.resolve()).first().fill(password);
      await (await this.loginButton.resolve()).first().click();
    });
  }
}

module.exports = { LoginPage };
