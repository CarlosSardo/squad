/**
 * TDD test for CI Hardening Phase 3 item A1:
 * Concurrency controls on all event-driven workflows.
 *
 * Validates that squad-ci, squad-heartbeat, squad-triage,
 * squad-label-enforce, and squad-issue-assign workflows all have
 * concurrency settings to prevent resource waste and race conditions.
 *
 * Refs: diberry/squad#122 (Phase 3 item A1)
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

// Workflows that must have concurrency controls (per issue #122 item A1)
const CONCURRENCY_REQUIRED_WORKFLOWS = [
  'squad-ci.yml',
  'squad-heartbeat.yml',
  'squad-triage.yml',
  'squad-label-enforce.yml',
  'squad-issue-assign.yml',
];

// All 3 locations where workflows are maintained
const WORKFLOW_LOCATIONS = [
  { label: '.github/workflows (active)', dir: path.join(REPO_ROOT, '.github', 'workflows') },
  { label: 'templates/workflows (source)', dir: path.join(REPO_ROOT, 'templates', 'workflows') },
  { label: 'packages/squad-cli/templates/workflows (CLI)', dir: path.join(REPO_ROOT, 'packages', 'squad-cli', 'templates', 'workflows') },
];

function readWorkflow(dir, filename) {
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

describe('CI Hardening A1: Concurrency controls on workflows', () => {
  for (const location of WORKFLOW_LOCATIONS) {
    describe(location.label, () => {
      for (const workflow of CONCURRENCY_REQUIRED_WORKFLOWS) {
        it(`${workflow} has a concurrency block`, () => {
          const content = readWorkflow(location.dir, workflow);
          if (!content) {
            // File doesn't exist in this location — skip
            return;
          }
          assert.ok(
            /^concurrency:/m.test(content),
            `${workflow} in ${location.label} must have a top-level concurrency: block`
          );
        });

        it(`${workflow} uses workflow+ref concurrency group`, () => {
          const content = readWorkflow(location.dir, workflow);
          if (!content) return;
          assert.ok(
            content.includes("github.workflow") && content.includes("github.ref"),
            `${workflow} concurrency group must use github.workflow and github.ref`
          );
        });

        it(`${workflow} has cancel-in-progress: true`, () => {
          const content = readWorkflow(location.dir, workflow);
          if (!content) return;
          assert.ok(
            /cancel-in-progress:\s*true/m.test(content),
            `${workflow} must have cancel-in-progress: true`
          );
        });
      }
    });
  }
});
