import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

class SandboxRunner {
  constructor() {
    this.timeoutMs = 8000;
  }

  /**
   * Sanitizes output logs to prevent credential leakage and terminal escape attacks
   */
  sanitizeLogs(logStr) {
    if (!logStr) return '';
    // Strip ANSI color escape codes for clean web viewing
    const cleanAnsi = logStr.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    // Mask any accidental token patterns
    return cleanAnsi.replace(/(api[_-]?key|token|secret|password)["':\s=]+([a-zA-Z0-9_\-]{8,})/gi, '$1: [REDACTED]');
  }

  /**
   * Runs a Node.js test script inside an isolated process with resource caps
   */
  async executeProcess({ scriptPath, workingDir }) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Safe, stripped environment variables (never inherit backend process credentials!)
      const safeEnv = {
        NODE_ENV: 'test',
        PATH: process.env.PATH,
        TEMP: workingDir,
        TMP: workingDir,
      };

      const child = spawn(
        process.execPath,
        ['--test', '--max-old-space-size=128', scriptPath],
        {
          cwd: workingDir,
          env: safeEnv,
          timeout: this.timeoutMs,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          child.kill('SIGKILL');
        } catch (e) {}
      }, this.timeoutMs);

      child.stdout.on('data', (chunk) => {
        if (stdout.length < 50000) stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        if (stderr.length < 50000) stderr += chunk.toString();
      });

      child.on('close', (code, signal) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;

        // Parse Node test runner output for pass / fail counts
        // Standard TAP / node:test format: "# pass 3", "# fail 1", etc.
        let passed = 0;
        let failed = 0;

        const passMatch = stdout.match(/#\s+pass\s+(\d+)/i) || stdout.match(/✔\s*(\d+)/);
        const failMatch = stdout.match(/#\s+fail\s+(\d+)/i) || stdout.match(/✖\s*(\d+)/);

        if (passMatch) passed = parseInt(passMatch[1], 10);
        if (failMatch) failed = parseInt(failMatch[1], 10);

        if (!passMatch && !failMatch) {
          if (code === 0) passed = 1;
          else failed = 1;
        }

        resolve({
          exitCode: code,
          timedOut,
          passed,
          failed,
          durationMs,
          stdout: this.sanitizeLogs(stdout),
          stderr: this.sanitizeLogs(stderr),
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          exitCode: -1,
          timedOut: false,
          passed: 0,
          failed: 1,
          durationMs: Date.now() - startTime,
          stdout: '',
          stderr: err.message,
        });
      });
    });
  }

  /**
   * Main validation workflow:
   * 1. Creates isolated temporary workspace
   * 2. Runs generated tests against original code (demonstrating failure)
   * 3. Runs generated tests against patched code (demonstrating resolution)
   * 4. Reports genuine test results
   */
  async validateFix({ originalFileContent, patchedFileContent, testScriptCode, relativePath = 'target.mjs' }) {
    const sandboxId = uuidv4();
    const sandboxDir = path.join(os.tmpdir(), `codesentry-sandbox-${sandboxId}`);

    try {
      await fs.mkdir(sandboxDir, { recursive: true });

      // Save package.json in sandbox so ESM modules ('import') work cleanly
      await fs.writeFile(
        path.join(sandboxDir, 'package.json'),
        JSON.stringify({ type: 'module' }),
        'utf8'
      );

      const targetFileName = relativePath.endsWith('.mjs') || relativePath.endsWith('.js')
        ? path.basename(relativePath)
        : 'target.mjs';

      const targetFilePath = path.join(sandboxDir, targetFileName);
      const testFilePath = path.join(sandboxDir, 'test.mjs');

      // Ensure test code imports from local target file
      let executableTestCode = testScriptCode;
      if (!executableTestCode.includes(targetFileName)) {
        // Ensure standard import
        executableTestCode = `import * as target from './${targetFileName}';\n` + executableTestCode;
      }

      await fs.writeFile(testFilePath, executableTestCode, 'utf8');

      // Step A: Run test against original code (before fix)
      await fs.writeFile(targetFilePath, originalFileContent, 'utf8');
      const beforeResult = await this.executeProcess({
        scriptPath: testFilePath,
        workingDir: sandboxDir,
      });

      // Step B: Run test against patched code (after fix)
      await fs.writeFile(targetFilePath, patchedFileContent, 'utf8');
      const afterResult = await this.executeProcess({
        scriptPath: testFilePath,
        workingDir: sandboxDir,
      });

      // Genuine validation evaluation
      const verified = afterResult.exitCode === 0 && afterResult.failed === 0;
      const status = afterResult.timedOut
        ? 'timeout'
        : verified
        ? 'passed'
        : 'failed';

      const combinedLogs = [
        `=== CODESENTRY SECURE SANDBOX EXECUTION ===`,
        `Sandbox ID: ${sandboxId}`,
        `Environment: Isolated Node.js Sandbox (Memory: 128MB, Timeout: ${this.timeoutMs}ms)`,
        ``,
        `--- TEST EXECUTION: BEFORE FIX (Original Code) ---`,
        beforeResult.stdout || '(no stdout)',
        beforeResult.stderr ? `Errors:\n${beforeResult.stderr}` : '',
        `Exit Code: ${beforeResult.exitCode} | Result: ${beforeResult.exitCode === 0 ? 'Passed' : 'Failed as expected'}`,
        ``,
        `--- TEST EXECUTION: AFTER FIX (Patched Code) ---`,
        afterResult.stdout || '(no stdout)',
        afterResult.stderr ? `Errors:\n${afterResult.stderr}` : '',
        `Exit Code: ${afterResult.exitCode} | Result: ${verified ? 'PASS (Fix verified!)' : 'FAIL'}`,
        `Duration: ${afterResult.durationMs}ms`,
      ]
        .filter(Boolean)
        .join('\n');

      return {
        success: true,
        status,
        verified,
        passedCount: afterResult.passed,
        failedCount: afterResult.failed,
        durationMs: afterResult.durationMs,
        beforeFixOutcome: {
          exitCode: beforeResult.exitCode,
          passed: beforeResult.passed,
          failed: beforeResult.failed,
          output: beforeResult.stdout + '\n' + beforeResult.stderr,
        },
        afterFixOutcome: {
          exitCode: afterResult.exitCode,
          passed: afterResult.passed,
          failed: afterResult.failed,
          output: afterResult.stdout + '\n' + afterResult.stderr,
        },
        logs: combinedLogs,
      };
    } catch (err) {
      console.error('[SandboxRunner] Execution error:', err);
      return {
        success: false,
        status: 'error',
        verified: false,
        passedCount: 0,
        failedCount: 1,
        durationMs: 0,
        logs: `Sandbox execution encountered an error: ${err.message}`,
        error: err.message,
      };
    } finally {
      // Clean up isolated directory
      try {
        await fs.rm(sandboxDir, { recursive: true, force: true });
      } catch (e) {}
    }
  }
}

export const sandboxRunner = new SandboxRunner();
