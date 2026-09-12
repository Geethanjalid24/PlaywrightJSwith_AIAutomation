// pages/DashboardPage.js
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(page, testInfo) {
    super(page, testInfo);

    this.dashboardHeader = this.locator('Dashboard > Header Title', [
      p => p.getByRole('heading', { name: 'Dashboard' }),
      p => p.locator('.oxd-topbar-header-breadcrumb h6'),
      p => p.getByText('Dashboard', { exact: true }),
    ]);

    this.userDropdown = this.locator('Dashboard > User Dropdown', [
      p => p.locator('.oxd-userdropdown-tab'),
      p => p.locator('.oxd-navbar-nav-right .oxd-userdropdown-name'),
    ]);

    this.logoutMenuItem = this.locator('Dashboard > Logout Menu Item', [
      p => p.getByRole('menuitem', { name: 'Logout' }),
      p => p.getByText('Logout', { exact: true }),
    ]);

    this.sidebarPimLink = this.locator('Dashboard > Sidebar PIM Link', [
      p => p.getByRole('link', { name: 'PIM' }),
      p => p.locator('a.oxd-main-menu-item', { hasText: 'PIM' }),
    ]);
  }

  async verifyDashboardVisible() {
    await this.runStep('Verify successful login via dashboard visibility', async () => {
      const header = await this.dashboardHeader.resolve();
      await expect(header.first(), 'Dashboard header should be visible after login').toBeVisible();
      await expect(this.page, 'URL should be on the /dashboard route after login')
        .toHaveURL(/dashboard/);
    });
  }

  async navigateToPim() {
    await this.runStep('Navigate to PIM module', async () => {
      await (await this.sidebarPimLink.resolve()).first().click();
      await expect(this.page, 'Should navigate to PIM Employee List page')
        .toHaveURL(/pim\/(viewEmployeeList|employeeList)/);
    });
  }

  async logout() {
    await this.runStep('Logout of application', async () => {
      await (await this.userDropdown.resolve()).first().click();
      await (await this.logoutMenuItem.resolve()).first().click();
      await expect(this.page, 'Should be redirected to login page after logout')
        .toHaveURL(/auth\/login/);
    });
  }
}

module.exports = { DashboardPage };
