import test from 'node:test';
import assert from 'node:assert';
import { nebiusAiService } from '../src/services/nebiusAiService.js';

test('Nebius AI Service - NVIDIA Nemotron Integration', async (t) => {
  await t.test('reports status and provider without leaking credentials', () => {
    const status = nebiusAiService.getStatus();
    assert.ok(status);
    assert.strictEqual(status.provider, 'Nebius Token Factory (NVIDIA Nemotron)');
    assert.ok(status.model);
    assert.strictEqual(typeof status.configured, 'boolean');
    assert.strictEqual(status.apiKey, undefined, 'API Key must never be returned');
  });

  await t.test('handles missing credentials cleanly without throwing uncaught errors', async () => {
    // When no key is configured
    const conn = await nebiusAiService.testConnection();
    assert.strictEqual(conn.success, false);
    assert.ok(conn.message.includes('not configured') || conn.message.includes('failed'));
  });

  await t.test('safely parses JSON from model responses containing markdown backticks', () => {
    const markdownResponse = '```json\n{\n  "findings": [\n    {"title": "Test Bug", "severity": "High"}\n  ]\n}\n```';
    const parsed = nebiusAiService.parseStructuredJson(markdownResponse);
    assert.ok(parsed);
    assert.strictEqual(parsed.findings.length, 1);
    assert.strictEqual(parsed.findings[0].title, 'Test Bug');
  });
});
