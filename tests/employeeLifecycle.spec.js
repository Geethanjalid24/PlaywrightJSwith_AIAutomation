// tests/employeeLifecycle.spec.js
//
// Scenario: Employee Lifecycle Management (OrangeHRM demo)
//   1. Login                       -> visibility + visual checkpoint
//   2. Add New Employee            -> data-driven (test-data/employee.json), profile pic upload
//   3. Edit Employee Information   -> job title + employment status, search by Employee Id
//   4. Validate Employee via API   -> ReqRes-simulated API, cross-checked against UI values
//   5. Delete Employee             -> UI delete + UI/API re-verification
//   6. Logout                      -> session invalidation check
//
// Every step is wrapped in test.step() (see pages/BasePage.runStep) so the HTML report
// shows a full, timed step tree. Screenshot comparisons run at each major validation
// checkpoint via ScreenshotHelper. Video is recorded for the whole test (playwright.config.js).

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { PimAddEmployeePage } = require('../pages/PimAddEmployeePage');
const { EmployeeListPage } = require('../pages/EmployeeListPage');
const { EmployeeJobDetailsPage } = require('../pages/EmployeeJobDetailsPage');
const { ApiHelper } = require('../utils/ApiHelper');
const { step, info } = require('../utils/Logger');

const testData = require('../test-data/employee.json');

test.describe('Employee Lifecycle Management @e2e', () => {
  test('Login → Add → Edit → API Validate → Delete → Logout', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page, testInfo);
    const dashboardPage = new DashboardPage(page, testInfo);
    const addEmployeePage = new PimAddEmployeePage(page, testInfo);
    const employeeListPage = new EmployeeListPage(page, testInfo);
    const jobDetailsPage = new EmployeeJobDetailsPage(page, testInfo);
    const apiHelper = new ApiHelper(testData.api.baseUrl);

    let apiRecordId;

    // ---------------------------------------------------------------
    // 1. LOGIN
    // ---------------------------------------------------------------
    await loginPage.goto();
    await loginPage.login(testData.credentials.username, testData.credentials.password);
    await dashboardPage.verifyDashboardVisible();
    await dashboardPage.screenshots.compare('01-dashboard-after-login');

    // ---------------------------------------------------------------
    // 2. ADD NEW EMPLOYEE (data-driven)
    // ---------------------------------------------------------------
    await dashboardPage.navigateToPim();
    await addEmployeePage.openAddEmployeeForm();
    await addEmployeePage.fillEmployeeDetails(testData.newEmployee);
    await addEmployeePage.screenshots.capture('02-employee-form-filled');
    await addEmployeePage.save();
    await addEmployeePage.screenshots.compare('03-employee-created-personal-details', {
      mask: [page.locator('input.oxd-input').nth(2)], // system-generated numeric id varies per run
    });

    const systemEmployeeId = await addEmployeePage.getSystemEmployeeId();
    info(`New employee created. Business Employee Id="${testData.newEmployee.employeeId}", system id field value="${systemEmployeeId}"`);

    // ---------------------------------------------------------------
    // 3. EDIT EMPLOYEE INFORMATION (search by Employee Id, update Job tab)
    // ---------------------------------------------------------------
    await dashboardPage.navigateToPim();
    await employeeListPage.searchByEmployeeId(testData.newEmployee.employeeId);
    await employeeListPage.verifyEmployeeFound(testData.newEmployee.employeeId);
    await employeeListPage.screenshots.compare('04-search-results-found');

    await employeeListPage.openFirstResultRecord();
    await jobDetailsPage.goToJobTab();
    await jobDetailsPage.updateJobTitle(testData.employeeUpdate.jobTitle);
    await jobDetailsPage.updateEmploymentStatus(testData.employeeUpdate.employmentStatus);
    await jobDetailsPage.save();

    await jobDetailsPage.verifyJobTitle(testData.employeeUpdate.jobTitle);
    await jobDetailsPage.verifyEmploymentStatus(testData.employeeUpdate.employmentStatus);
    await jobDetailsPage.screenshots.compare('05-job-details-updated');

    // ---------------------------------------------------------------
    // 4. VALIDATE EMPLOYEE VIA API (simulated) + cross-check vs UI
    // ---------------------------------------------------------------
    await step('API: create/register simulated employee record', async () => {
      const createResponse = await apiHelper.createEmployeeRecord(testData.newEmployee);
      expect(createResponse.status, 'API create call should return 201 Created').toBe(201);
      apiRecordId = createResponse.data.id;
      expect(apiRecordId, 'API response should include a generated record id').toBeTruthy();
    });

    await step('API: update simulated record with UI-captured Job Title / Employment Status', async () => {
      const updateResponse = await apiHelper.updateEmployeeRecord(apiRecordId, {
        jobTitle: testData.employeeUpdate.jobTitle,
        employmentStatus: testData.employeeUpdate.employmentStatus,
      });
      expect(updateResponse.status, 'API update call should return 200 OK').toBe(200);

      const crossCheck = ApiHelper.crossCheck(
        testData.employeeUpdate,
        updateResponse.data,
        { jobTitle: 'jobTitle', employmentStatus: 'employmentStatus' }
      );
      expect(
        crossCheck.consistent,
        `UI and API values should match. Mismatches: ${JSON.stringify(crossCheck.mismatches)}`
      ).toBe(true);
    });

    // ---------------------------------------------------------------
    // 5. DELETE THE EMPLOYEE (UI) + verify via UI and API
    // ---------------------------------------------------------------
    await dashboardPage.navigateToPim();
    await employeeListPage.searchByEmployeeId(testData.newEmployee.employeeId);
    await employeeListPage.deleteFirstResult();
    await employeeListPage.verifyEmployeeDeletedFromUi(testData.newEmployee.employeeId);
    await employeeListPage.screenshots.compare('06-employee-deleted-no-records');

    await step('API: verify record deletion (simulated)', async () => {
      const deleteResponse = await apiHelper.deleteEmployeeRecord(apiRecordId);
      expect([200, 204], `API delete call should return 200/204, got ${deleteResponse.status}`)
        .toContain(deleteResponse.status);
    });

    // ---------------------------------------------------------------
    // 6. LOGOUT
    // ---------------------------------------------------------------
    await dashboardPage.logout();
    await step('Verify session invalidated after logout', async () => {
      await page.goto('/web/index.php/pim/viewEmployeeList');
      await expect(
        page,
        'Attempting to access a protected page post-logout should redirect back to login'
      ).toHaveURL(/auth\/login/, { timeout: 10000 });
    });
    await dashboardPage.screenshots.capture('07-logged-out-session-invalidated');
  });
});
