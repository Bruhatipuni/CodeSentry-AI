import test from 'node:test';
import assert from 'node:assert';
import { staticAnalyzer } from '../src/services/staticAnalyzer.js';

test('Static Analyzer - Security Rule Engine', async (t) => {
  await t.test('detects SQL injection via string concatenation', async () => {
    const code = `
      function getUser(id) {
        const query = "SELECT * FROM users WHERE id = " + id;
        return db.query(query);
      }
    `;
    const findings = await staticAnalyzer.analyzeFile({
      filename: 'db.js',
      content: code,
    });

    const sqli = findings.find(f => f.title.includes('SQL Injection'));
    assert.ok(sqli, 'Should detect SQL injection');
    assert.strictEqual(sqli.severity, 'Critical');
    assert.strictEqual(sqli.lineStart, 3);
  });

  await t.test('detects prototype pollution vulnerability', async () => {
    const code = `
      function merge(target, source) {
        for (let key in source) {
          target[key] = source[key];
        }
      }
    `;
    const findings = await staticAnalyzer.analyzeFile({
      filename: 'utils.js',
      content: code,
    });

    const proto = findings.find(f => f.title.includes('Prototype Pollution'));
    assert.ok(proto, 'Should detect prototype pollution');
    assert.strictEqual(proto.severity, 'High');
  });

  await t.test('detects dangerous eval execution via ESLint', async () => {
    const code = `
      function calculate(expression) {
        return eval(expression);
      }
    `;
    const findings = await staticAnalyzer.analyzeFile({
      filename: 'calculator.js',
      content: code,
    });

    const evalFinding = findings.find(f => f.title.includes('eval'));
    assert.ok(evalFinding, 'Should detect eval usage');
    assert.strictEqual(evalFinding.severity, 'Critical');
  });
});
