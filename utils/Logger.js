// utils/Logger.js
// Thin wrapper around Playwright's `test.step()` so every meaningful action/assertion
// shows up as a named, collapsible, timed step inside the HTML report — this is what
// gives the report per-step timing in addition to total execution time.

const { test } = require('@playwright/test');

async function step(title, fn) {
  return test.step(title, fn);
}

function info(message) {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
}

function warn(message) {
  console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
}

module.exports = { step, info, warn, error };
