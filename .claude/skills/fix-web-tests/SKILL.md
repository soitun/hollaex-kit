---
name: fix-web-tests
description: >-
  Diagnose and fix the HollaEx Playwright web/E2E tests under test/playwright
  (page-navigation and other specs that run against sandbox.hollaex.com). Use
  when a web/UI/E2E/Playwright test is failing, flaky, or broken after a UI
  change, or when authoring a new spec. Triggers on requests like "fix the web
  tests", "the e2e tests are failing", "the playwright test is broken", "update
  the test selectors", "the UI changed and the tests broke", "write a new web
  test".
---

# Fix Web Tests

Troubleshooter for the HollaEx Playwright suite in `test/playwright/`. It runs the failing
spec, reads the failure from the **live rendered DOM** (Playwright trace/screenshot — the tests
hit the remote `sandbox.hollaex.com`, so that is the source of truth, with `web/src` as a
secondary reference), then **proposes a fix and waits for confirmation before editing**. A red
test may be catching a real regression — never blindly rewrite a test to make it pass.

Follow these files (paths relative to the repo root):

1. **`test/playwright/troubleshooter/PROCEDURE.md`** — the step-by-step workflow. Start here.
2. **`test/playwright/troubleshooter/KNOWN_ISSUES.md`** — common flaky patterns and the existing
   helper in `test/playwright/tests/utils/` that fixes each (announcement popup, loaders,
   strict-mode, auth). Reuse helpers; don't reinvent.
3. **`test/playwright/troubleshooter/AUTHORING.md`** — how to write a new spec following repo
   conventions (only when adding tests).

Helper to summarize failures instead of parsing raw JSON:
`node test/playwright/troubleshooter/scripts/summarize-failures.mjs`
