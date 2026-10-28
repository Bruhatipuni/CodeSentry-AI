import test from 'node:test';
import assert from 'node:assert';
import { sandboxRunner } from '../src/services/sandboxRunner.js';

test('Sandbox Runner - Secure Test Execution', async (t) => {
  await t.test('executes unit tests and detects passing code', async () => {
    const originalCode = `export function add(a, b) { return a - b; }`; // Buggy
    const patchedCode = `export function add(a, b) { return a + b; }`;  // Fixed

    const testScript = `
import test from 'node:test';
import assert from 'node:assert';
import { add } from './target.mjs';

test('add function unit test', () => {
  assert.strictEqual(add(2, 3), 5);
});
`;

    const result = await sandboxRunner.validateFix({
      originalFileContent: originalCode,
      patchedFileContent: patchedCode,
      testScriptCode: testScript,
      relativePath: 'target.mjs',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.verified, true);
    assert.strictEqual(result.status, 'passed');
    assert.strictEqual(result.beforeFixOutcome.exitCode !== 0, true, 'Original buggy code should fail test');
    assert.strictEqual(result.afterFixOutcome.exitCode === 0, true, 'Patched code should pass test');
  });

  await t.test('enforces execution timeout on infinite loops', async () => {
    const code = `export function loop() { while(true){} }`;
    const testScript = `
import test from 'node:test';
import { loop } from './target.mjs';

test('hang test', () => {
  loop();
});
`;

    // Override timeout for quick test
    sandboxRunner.timeoutMs = 1500;

    const result = await sandboxRunner.validateFix({
      originalFileContent: code,
      patchedFileContent: code,
      testScriptCode: testScript,
      relativePath: 'target.mjs',
    });

    // Reset timeout
    sandboxRunner.timeoutMs = 8000;

    assert.strictEqual(result.verified, false);
    assert.ok(result.status === 'timeout' || result.status === 'failed');
  });
});
