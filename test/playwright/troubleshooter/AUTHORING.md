# Authoring a New Web Test

Use this when adding a spec for a new page/feature. Match the existing suite conventions in
`tests/page-navigation/page-navigation.spec.js` (the reference example).

## Conventions

- **Target:** always use `testData.baseUrl` (points at `sandbox.hollaex.com`), never a hardcoded URL.
- **Auth + popup:** every `describe` needs a `beforeEach` that (1) installs the announcement
  auto-dismisser **before** navigating, (2) logs in, (3) clears the popup once. See template below.
- **Selectors, in order of preference:** `getByRole(...)` → `getByText(..., { exact: true })` →
  `getByPlaceholder(...)` → CSS class. Avoid brittle deep CSS paths.
- **Strict mode:** if a text/label can appear more than once, scope it (`.first()`, a role, or a
  container) — see `KNOWN_ISSUES.md` §3.
- **Clicks that may be covered** by loaders/overlays: use `safeClick` / `waitForClickableElement`
  from `tests/utils/login-helper.js` instead of a raw `.click()`.
- **Waits:** prefer `await expect(locator).toBeVisible({ timeout })`. Only use `page.waitForTimeout`
  for known slow async (charts, volume data), matching the suite's generous timeouts.
- **Long-running tests** (charts, big data): raise the per-test budget with
  `test.setTimeout(60000)`.

## Template

```js
const { test, expect } = require('@playwright/test');
const {
  loginUser,
  setupAnnouncementAutoDismiss,
  dismissAnnouncementPopup,
  safeClick,            // if you need overlay-safe clicks
} = require('../utils/login-helper');
const testData = require('../utils/test-data');

test.describe('<Feature> Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Announcement popup can appear on any load; register before navigating.
    await setupAnnouncementAutoDismiss(page);
    await loginUser(page, 'admin');
    await page.waitForTimeout(6000);
    await dismissAnnouncementPopup(page); // no-op if not shown
  });

  test('should load <Feature> page', async ({ page }) => {
    await page.goto(`${testData.baseUrl}/<route>`);
    await expect(page).toHaveURL(/.*\/<route>/);

    // Prefer role/text selectors; scope to avoid strict-mode violations.
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('<Unique label>', { exact: true }).first())
      .toBeVisible({ timeout: 10000 });
  });
});
```

## Available users

`test-data.js` defines: `admin` (default), `regular`, `frozen`, `twoFA`, `communicator`, `kyc`,
`support`, `supervisor`. Pass the key to `loginUser(page, '<key>')`.

## Before committing a new test

Run it in isolation and confirm it's stable across a couple of runs:

```bash
cd test/playwright
npx playwright test -g "<your test title>" --reporter=list --headed
```
