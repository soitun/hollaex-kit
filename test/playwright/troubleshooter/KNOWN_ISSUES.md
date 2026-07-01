# Known Flaky Patterns → Existing Fix

Before writing any new helper code, check whether the failure is one of these. Each maps to a
helper that already exists in `tests/utils/`. Reuse it.

---

## 1. Announcement popup blocks clicks

**Symptom:** clicks fail / time out with "intercepts pointer events"; a modal titled
`ANNOUNCEMENT` covers the page. It appears on `/summary` and can show on *any* page load.

**Why:** the popup (`web/src/components/AppBar/index.js`, class `.announcement-popup-wrapper`)
renders from API data and may or may not appear. Clicking **CLOSE** only flips React state — it does
**not** persist to `localStorage` — so a full `page.goto` reload re-shows it. (Only clicking
VIEW/READ MORE persists the dismissal, and that navigates away.)

**Fix — reuse:** `setupAnnouncementAutoDismiss(page)` and `dismissAnnouncementPopup(page)` in
`tests/utils/login-helper.js`.
- Call `setupAnnouncementAutoDismiss(page)` **before the first navigation** (e.g. at the top of
  `beforeEach`). It installs a `MutationObserver` via `addInitScript` that auto-clicks CLOSE on
  every page load.
- `dismissAnnouncementPopup(page)` closes it once on demand and is a no-op if absent.

## 2. Loaders intercept clicks

**Symptom:** element is visible but the click doesn't land; a spinner overlays it.

**Selectors:** `.ant-spin`, `.loader_background`, `.loader_wrapper`.

**Fix — reuse:** `waitForClickableElement(page, locator)` (waits for loaders to disappear) or
`safeClick(page, locator)` (waits, then clicks with force/parent fallbacks) — both in
`tests/utils/login-helper.js`.

## 3. Strict-mode violation ("resolved to N elements")

**Symptom:** `locator.…` matched multiple nodes (e.g. a label that appears in both a tab and a
heading).

**Fix:** scope the locator — `.first()`, `{ exact: true }`, a role (`getByRole('tab', {name})`),
or a container (`page.getByRole('table').getByText(...)`). This is the dominant pattern already used
throughout `page-navigation.spec.js`.

## 4. HTTP 429 (rate limiting)

**Symptom:** intermittent failures / redirects under load.

**Why/Fix:** the suite is intentionally pinned to `workers: 1` in `playwright.config.js`. Don't
parallelize the suite; add/keep waits. This is environmental, not a test bug.

## 5. Stale auth / session

**Symptom:** test lands on `/login`, or `loginUser` loops; `storageState` expired.

**Fix:** delete `test/playwright/.auth/admin.json` to force `tests/global-setup.js` to
re-authenticate. Verify creds in `tests/utils/test-data.js` (or env `ADMIN_USER`/`ADMIN_PASS`).

## 6. Element appears later than the wait

**Symptom:** first assertion after `page.goto` fails, but the page is fine a moment later.

**Fix:** prefer web-first assertions with a timeout (`await expect(locator).toBeVisible({ timeout })`)
or `waitForClickableElement` over bare `page.waitForTimeout(...)`. Only bump a fixed wait as a last
resort, matching the generous timeouts already in the suite.

---

**Rule of thumb:** if a failure is NOT explained by one of the above and the live DOM shows the
feature is genuinely broken, treat it as a **regression** — report it, don't silently green the test.
