import test from 'node:test';
import assert from 'node:assert';
import { repoIngestionService } from '../src/services/repoIngestionService.js';

test('Repository Ingestion & Security Validation', async (t) => {
  await t.test('parses valid GitHub repository URL', () => {
    const parsed = repoIngestionService.parseGitHubUrl('https://github.com/facebook/react');
    assert.strictEqual(parsed.owner, 'facebook');
    assert.strictEqual(parsed.repo, 'react');
    assert.strictEqual(parsed.fullName, 'facebook/react');
  });

  await t.test('rejects SSRF attempts targeting localhost or private IPs', () => {
    assert.throws(() => {
      repoIngestionService.parseGitHubUrl('http://localhost:8080/evil/repo');
    }, /Security policy: Only public repositories hosted on github.com are permitted/);

    assert.throws(() => {
      repoIngestionService.parseGitHubUrl('http://169.254.169.254/latest/meta-data');
    }, /Security policy: Only public repositories hosted on github.com are permitted/);

    assert.throws(() => {
      repoIngestionService.parseGitHubUrl('https://evil-hacker.com/malicious/repo');
    }, /Security policy: Only public repositories hosted on github.com are permitted/);
  });

  await t.test('loads safe sample demonstration repository', () => {
    const sample = repoIngestionService.getSampleProject('demo-ecommerce-api');
    assert.ok(sample);
    assert.ok(sample.files.length >= 3);
    const authFile = sample.files.find(f => f.path.includes('authService.js'));
    assert.ok(authFile);
    assert.ok(authFile.content.includes('SELECT'));
  });
});
