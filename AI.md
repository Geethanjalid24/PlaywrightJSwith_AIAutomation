# AI Generation Log

This document records how this framework was produced by an AI test engineer (Claude), per the assessment's expectation that "AI is generating the framework based on the JD and instructions" and that all such details be documented.

## 1. Inputs Given to the AI

- The Quality Engineer (Automation) technical assessment brief: target site (OrangeHRM demo), the 6-step Employee Lifecycle Management scenario, and the framework/implementation guidelines (Playwright + JS, POM, descriptive assertions, clean code, test runner, HTML report, video, README).
- A follow-up instruction set from the candidate specifying: use Playwright + JavaScript, use an MCP configuration, use screenshot comparison for each validation, implement self-healing locators, and document everything (including the AI-generation process) in Markdown.

## 2. What the AI Generated

| Artifact | Purpose |
|---|---|
| Full project scaffold (`package.json`, `playwright.config.js`, `.gitignore`, `.env.example`, CI workflow) | Runnable Playwright/JS project from a clean clone |
| `mcp.config.json` | Playwright MCP server config, scoped to the target site + simulated API host |
| `pages/*.js` (6 files) | Page Object Model for Login, Dashboard, Add Employee, Employee List/Search/Delete, Job Details edit |
| `utils/SelfHealingLocator.js` | Self-healing locator engine: ordered fallback strategies, healing-event logging, hard failure only when every strategy is exhausted |
| `utils/ScreenshotHelper.js` | Wraps `toHaveScreenshot()` for baseline visual comparison at each validation point, plus plain evidence capture and automatic failure screenshots |
| `utils/ApiHelper.js` | API-layer validation + a provider-agnostic UI/API field cross-check |
| `utils/TimingReporter.js` | Custom Playwright reporter computing/printing/persisting total execution time |
| `utils/Logger.js` | `test.step()` wrapper so every action shows up, timed, in the HTML report |
| `tests/employeeLifecycle.spec.js` | The 6-step scenario, wired to the above |
| `test-data/employee.json` + `test-data/assets/profile-picture.png` | Data-driven inputs (credentials, new employee, edit values, API config, sample upload file) |
| `README.md`, this file | Setup, architecture, framework design rationale |

## 3. Key Design Decisions and Why

**Self-healing locators as ordered strategy arrays, not a "smart" ML matcher.**
A lightweight, deterministic, explainable implementation was chosen over a fuzzy/heuristic DOM-matching approach: each element declares 2–3 concrete strategies (semantic role/placeholder first, attribute-based second, structural/positional last). This is auditable — every healing event is logged with exactly which strategy fired and why the earlier one failed — which matters more for a test framework than opaque ML-based healing would.

**Screenshot comparison scoped to validation checkpoints, not every single action.**
Comparing on every click would make the suite brittle to any pixel-level noise (fonts, animations, dynamic IDs) and slow to maintain. Checkpoints were placed at the 6 meaningful validation moments the assessment calls out (post-login, post-create, post-edit, post-search, post-delete, post-logout), with the one genuinely dynamic region (the system-generated employee ID) explicitly masked out of the diff rather than causing permanent flakiness.

**ReqRes as a declared, documented simulation of the API layer.**
The assessment explicitly permits this fallback because OrangeHRM's public demo doesn't expose an employee CRUD API without auth. Rather than silently faking it, `test-data/employee.json` and the README call this out directly, and the cross-check logic (`ApiHelper.crossCheck`) is written to be provider-agnostic so swapping in a real API later only touches `utils/ApiHelper.js`.

**MCP configuration as a maintenance/authoring tool, not a replacement for the Playwright Test runner.**
The suite itself runs on `@playwright/test` (deterministic, CI-friendly, produces the required HTML report). The MCP server (`mcp.config.json`, `npm run mcp:server`) is a separate, optional channel an AI agent can use to interactively inspect the live site — e.g. to verify a new locator strategy or investigate a healing-log entry — which is what "AI test engineer" tooling means in practice: the AI can go look at the real DOM instead of guessing.

**Video always on, not only-on-failure.**
`video: { mode: 'on' }` in `playwright.config.js` — the assessment asks for "video evidence" of the run generally, not only failure repro, so successful runs are recorded too.

## 4. Known Limitations / What a Human Should Verify Before Relying On This

- Locator strategies were written against the OrangeHRM demo's known DOM structure (OXD component library conventions) but have **not been executed against the live site by this AI**; run `npm test` once and use `npm run test:headed` / `test:ui` to confirm and adjust any strategy that doesn't resolve, then re-baseline screenshots with `npm run test:update-snapshots`.
- Employee Id field selectors on the Add Employee form and the search form both rely partly on positional fallbacks (`nth()`), which is the most brittle strategy tier — treat any healing-log entry pointing at these as a signal to add a more specific fallback (e.g. once the actual `name`/`data-*` attributes are confirmed from a live DOM inspection).
- Credentials in `test-data/employee.json` are the standard OrangeHRM public demo credentials (`Admin` / `admin123`), intentionally non-secret since this targets a public demo instance — do not reuse this pattern for a real environment; use `.env` / CI secrets instead.
