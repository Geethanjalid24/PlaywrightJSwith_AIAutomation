// utils/ApiHelper.js
//
// Encapsulates the API-layer validation step of the scenario:
//   "Validate Employee via API ... cross-check API data against UI data for consistency."
//
// See test-data/employee.json -> api.note and README "API Validation Strategy" for why
// ReqRes (https://reqres.in) is used to simulate the API layer against the OrangeHRM demo
// (which does not expose a public, unauthenticated employee CRUD API). The cross-check
// logic itself (comparing field-by-field, asserting presence/absence after delete) is real
// and is written so the ReqRes calls can be swapped for real OrangeHRM API calls by only
// changing this file, not the tests.

const axios = require('axios');

class ApiHelper {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'https://reqres.in/api';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'reqres-free-v1' },
      validateStatus: () => true, // let the caller assert on status codes explicitly
    });
  }

  /**
   * Simulates employee creation at the API layer and returns the created payload
   * (including the API-assigned id) for later cross-checking against the UI.
   */
  async createEmployeeRecord(employee) {
    const response = await this.client.post('/users', {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
    });
    return response;
  }

  /** Simulates fetching/verifying the employee record post-creation and post-edit. */
  async getEmployeeRecord(recordId) {
    const response = await this.client.get(`/users/${recordId}`);
    return response;
  }

  /** Simulates updating job title / employment status at the API layer. */
  async updateEmployeeRecord(recordId, updates) {
    const response = await this.client.put(`/users/${recordId}`, updates);
    return response;
  }

  /** Simulates deleting the employee record at the API layer. */
  async deleteEmployeeRecord(recordId) {
    const response = await this.client.delete(`/users/${recordId}`);
    return response;
  }

  /**
   * Cross-checks a set of UI-captured field values against the corresponding
   * API response payload. Returns a structured diff report; throws only when
   * the caller wants a hard assertion (tests decide how strict to be).
   */
  static crossCheck(uiValues, apiPayload, fieldMap) {
    const mismatches = [];
    for (const [uiKey, apiKey] of Object.entries(fieldMap)) {
      const uiVal = uiValues[uiKey];
      const apiVal = apiPayload?.[apiKey];
      if (uiVal !== undefined && apiVal !== undefined && String(uiVal) !== String(apiVal)) {
        mismatches.push({ field: uiKey, uiValue: uiVal, apiValue: apiVal });
      }
    }
    return { consistent: mismatches.length === 0, mismatches };
  }
}

module.exports = { ApiHelper };
