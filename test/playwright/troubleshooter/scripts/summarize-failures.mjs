#!/usr/bin/env node
// Summarize failures from a Playwright JSON report into a compact, readable list.
//
// Usage:
//   node troubleshooter/scripts/summarize-failures.mjs [path-to-results.json]
//
// Default path: test-results/results.json (relative to the playwright dir).
// Prints one block per failing test: full title, file:line, first error line,
// and the paths to any captured screenshot / trace / video so the agent can open
// the live DOM instead of parsing the raw JSON.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const inputPath = resolve(process.argv[2] || 'test-results/results.json');

let report;
try {
  report = JSON.parse(readFileSync(inputPath, 'utf8'));
} catch (err) {
  console.error(`Could not read Playwright JSON report at: ${inputPath}`);
  console.error(`Reason: ${err.message}`);
  console.error(
    'Run the tests first, e.g. `npx playwright test <spec> --reporter=list` ' +
      '(the config also writes JSON to test-results/results.json).'
  );
  process.exit(2);
}

const FAIL_STATUSES = new Set(['failed', 'timedOut', 'interrupted']);
const failures = [];

// Walk the nested suites -> specs -> tests -> results tree.
function walkSuite(suite, titleTrail) {
  const trail = suite.title ? [...titleTrail, suite.title] : [...titleTrail];
  for (const spec of suite.specs || []) {
    walkSpec(spec, trail);
  }
  for (const child of suite.suites || []) {
    walkSuite(child, trail);
  }
}

function walkSpec(spec, titleTrail) {
  const fullTitle = [...titleTrail, spec.title].filter(Boolean).join(' › ');
  for (const test of spec.tests || []) {
    // Only the last result matters (Playwright records one per retry).
    const results = test.results || [];
    const last = results[results.length - 1];
    if (!last || !FAIL_STATUSES.has(last.status)) continue;

    const errorMessages = (last.errors || [])
      .map((e) => e.message)
      .filter(Boolean);
    if (last.error?.message) errorMessages.unshift(last.error.message);

    const attachments = {};
    for (const att of last.attachments || []) {
      if (att.path) attachments[att.name] = att.path;
    }

    failures.push({
      title: fullTitle,
      project: test.projectName || '',
      location: spec.file ? `${spec.file}:${spec.line ?? '?'}` : '',
      status: last.status,
      retries: results.length - 1,
      error: (errorMessages[0] || 'No error message captured').split('\n')[0],
      attachments,
    });
  }
}

for (const suite of report.suites || []) {
  walkSuite(suite, []);
}

const stats = report.stats || {};
console.log('Playwright failure summary');
console.log('==========================');
console.log(`Report: ${inputPath}`);
if (Object.keys(stats).length) {
  console.log(
    `Totals: ${stats.expected ?? '?'} passed, ${stats.unexpected ?? '?'} failed, ` +
      `${stats.flaky ?? 0} flaky, ${stats.skipped ?? 0} skipped ` +
      `(${Math.round((stats.duration || 0) / 1000)}s)`
  );
}
console.log('');

if (failures.length === 0) {
  console.log('No failing tests found. ✅');
  process.exit(0);
}

failures.forEach((f, i) => {
  console.log(`[${i + 1}] ${f.title}`);
  if (f.project) console.log(`    project: ${f.project}`);
  if (f.location) console.log(`    where:   ${f.location}`);
  console.log(`    status:  ${f.status}${f.retries ? ` (after ${f.retries} retr${f.retries === 1 ? 'y' : 'ies'})` : ''}`);
  console.log(`    error:   ${f.error}`);
  if (f.attachments.trace) console.log(`    trace:   npx playwright show-trace ${f.attachments.trace}`);
  if (f.attachments.screenshot) console.log(`    screen:  ${f.attachments.screenshot}`);
  if (f.attachments.video) console.log(`    video:   ${f.attachments.video}`);
  console.log('');
});

console.log(`${failures.length} failing test(s). Open the trace to see the live DOM before editing selectors.`);
