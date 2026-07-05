# Fix Web Tests — Troubleshooter Procedure

This is the workflow the AI follows when asked to fix the HollaEx Playwright web tests.
Follow it top to bottom. **Never rewrite a test just to make it green** — a red test can be
catching a real regression. Diagnose, propose, get confirmation, then fix.

All commands run from `test/playwright/` unless stated otherwise.

---

## 0. Ground truth

- The suite runs against the **remote** UI at `https://sandbox.hollaex.com` (see
  `playwright.config.js` → `baseURL` and `tests/utils/test-data.js` → `baseUrl`).
- Because it's remote, the deployed UI can differ from the local `web/src` source. **The live
  rendered DOM is the source of truth** (via the Playwright trace/screenshot). `web/src` is a
  *secondary* reference for the intended selector/text.
- Auth is done once in `tests/global-setup.js`, saved to `.auth/admin.json`, and reused via
  `storageState`. Default admin creds are in `test-data.js` (overridable with env vars
  `ADMIN_USER` / `ADMIN_PASS`).

## 1. Preflight

```bash
cd test/playwright
npm install                      # if node_modules is missing
npx playwright install chromium  # if the browser is missing
```

- Confirm you can reach the target: the suite is Chromium-only, `workers: 1` (to avoid HTTP 429).
- If you suspect a stale session, delete `.auth/admin.json` so global-setup re-authenticates.

## 2. Run the failing test(s) and capture evidence

Prefer running the **narrowest** scope that reproduces the failure.

```bash
# One spec:
npx playwright test tests/page-navigation/page-navigation.spec.js --reporter=list
# One test by title substring:
npx playwright test -g "should load Deposit page" --reporter=list
```

The config already writes a JSON report to `test-results/results.json` and captures
`screenshot: only-on-failure`, `trace: on-first-retry`, `video: retain-on-failure`.

Summarize failures instead of reading raw JSON:

```bash
node troubleshooter/scripts/summarize-failures.mjs
```

This prints each failing test's title, `file:line`, first error line, and the trace/screenshot
paths. (Traces only appear when a retry happened — locally `retries: 0`, so add `--retries=1` or
`--trace on` when you need a trace.)

## 3. Diagnose from the live DOM first

```bash
npx playwright show-trace <trace.zip>   # path from the summary output
```

Open the trace/screenshot and look at what actually rendered at the failing step. Classify the
failure into one of:

- **Stale selector / text** — the element exists but under a new text, role, or class.
- **Strict-mode violation** ("resolved to N elements") — selector matches multiple nodes.
- **Timing / wait** — element appears later than the test waited; or a loader/overlay intercepts.
- **Auth / session** — redirected to `/login`, or `storageState` expired.
- **Behavioral regression** — the feature genuinely broke or the page 404s / errors.

## 4. Cross-check `web/src` (secondary)

Map the failing selector to source to decide *intent*:

- Text assertions (`getByText('…')`) → grep the string in `web/src` JSX.
- Class selectors → find the class in `web/src/components/**` / `web/src/containers/**` and the
  matching `.scss`.
- Role selectors (`getByRole('table' | 'tab' | 'switch' …)`) → find the element/AntD component.

Representative locations: `web/src/components/AppBar` (top bar, announcement popup, theme toggle),
`web/src/containers/Wallet`, `.../Trade`, `.../UserSettings`, `.../Verification`, `.../P2P`,
`.../Stake`, `.../Announcement`.

**Decision rule:**
- UI legitimately changed (renamed label, restructured DOM) → the **test** selector is stale → fix the test.
- Feature/behavior broke (element gone, page errors, wrong data) → likely a **real regression** →
  do NOT edit the test to pass. Report it and recommend a developer review.

## 5. Consult KNOWN_ISSUES.md before writing new code

See `KNOWN_ISSUES.md` — most flakes map to an **existing helper** in
`tests/utils/login-helper.js` / `tests/utils/helpers.js` (announcement popup, loaders, strict-mode,
auth). Reuse them; don't reinvent.

## 6. Propose (stop here for confirmation)

Present to the user:
1. The failing test(s) and the **root cause** (with the trace/DOM evidence).
2. Whether it's a stale-selector fix or a suspected regression.
3. A **minimal diff** of the proposed change.

Then wait for the user's go-ahead. For suspected regressions, explicitly recommend human review
instead of a test edit.

## 7. Apply and verify

After approval:

```bash
# Re-run just the fixed test, with a trace so you can confirm visually if needed:
npx playwright test -g "<test title>" --reporter=list --trace on
```

- Confirm it passes.
- Re-run the **sibling tests in the same `describe` block** to catch collateral breakage.
- Keep edits minimal and consistent with existing patterns (prefer `.first()`, role/text selectors,
  and the shared helpers over ad-hoc `waitForTimeout`).

## Handy commands

```bash
npx playwright test <spec> --headed      # watch it run in a real browser
npx playwright test <spec> --ui          # interactive UI mode (timeline + re-run)
npx playwright test <spec> --debug       # step through with the Inspector
npx playwright show-report               # open the HTML report
```
