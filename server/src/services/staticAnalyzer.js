import { Linter } from 'eslint';

class StaticAnalyzer {
  constructor() {
    this.linter = new Linter();
    this.securityPatterns = [
      {
        id: 'SEC-SQLI',
        title: 'Potential SQL Injection via Unescaped String Concatenation',
        severity: 'Critical',
        category: 'Security',
        regex: /(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\s+[\s\S]*?\+\s*([a-zA-Z0-9_$.]+)/i,
        description: 'Raw SQL query string assembled using dynamic string concatenation instead of parameterized queries.',
        impact: 'Attacker could execute arbitrary SQL queries, bypass authentication, exfiltrate data, or tamper with database records.',
        recommendation: 'Use prepared statements or parameterized queries provided by your database driver or ORM.',
        suggestedFix: '// Use parameterized query instead of string concatenation\nawait db.query("SELECT * FROM users WHERE id = $1", [userId]);',
        confidence: 0.92,
      },
      {
        id: 'SEC-CMD-INJ',
        title: 'Command Injection via Unsanitized Child Process Execution',
        severity: 'Critical',
        category: 'Security',
        regex: /(exec|execSync|spawn|spawnSync)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`|\+\s*[a-zA-Z0-9_$.]+/i,
        description: 'Dynamic user-supplied arguments passed directly into a shell execution function without input sanitization or whitelist validation.',
        impact: 'Remote Code Execution (RCE) allowing attackers to run arbitrary system commands on the host server.',
        recommendation: 'Use `execFile` or `spawn` with an array of arguments, never passing unvalidated strings into a subshell.',
        suggestedFix: '// Use execFile with explicit argument array:\nexecFile("git", ["log", "--format=%H", commitId], callback);',
        confidence: 0.95,
      },
      {
        id: 'SEC-PROTO-POLLUTION',
        title: 'Prototype Pollution Vulnerability in Object Merge',
        severity: 'High',
        category: 'Security',
        regex: /__proto__|constructor\s*\[\s*['"]prototype['"]\s*\]|\[\s*key\s*\]\s*=\s*([a-zA-Z0-9_$.]+\[\s*key\s*\]|val|source)/i,
        description: 'Unsafe recursive object assignment or deep merge without filtering out __proto__, constructor, or prototype properties.',
        impact: 'Modification of Object.prototype leading to denial of service, logic bypasses, or potential remote code execution.',
        recommendation: 'Validate and reject keys such as "__proto__", "prototype", and "constructor", or use Object.create(null).',
        suggestedFix: 'if (key === "__proto__" || key === "constructor" || key === "prototype") continue;',
        confidence: 0.88,
      },
      {
        id: 'SEC-PATH-TRAVERSAL',
        title: 'Path Traversal Vulnerability in File System Access',
        severity: 'High',
        category: 'Security',
        regex: /fs\.(readFile|readFileSync|createReadStream|writeFile|unlink)\s*\(\s*(path\.join|path\.resolve|\+)[^)]*(req\.(query|body|params)|filename|userInput)/i,
        description: 'Directly concatenating user input into file paths without path normalization and root boundary checking.',
        impact: 'Arbitrary file disclosure (e.g. /etc/passwd or .env files) or arbitrary file overwrite.',
        recommendation: 'Resolve the target path and assert that it begins strictly with the allowed base directory path.',
        suggestedFix: 'const safePath = path.resolve(BASE_DIR, path.basename(userInput));\nif (!safePath.startsWith(BASE_DIR)) throw new Error("Invalid path");',
        confidence: 0.89,
      },
      {
        id: 'SEC-HARDCODED-SECRET',
        title: 'Hardcoded Secret / API Token in Source Code',
        severity: 'Critical',
        category: 'Security',
        regex: /(api_key|apikey|secret|password|token|private_key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
        description: 'Sensitive credentials or cryptographic keys hardcoded directly in application source code.',
        impact: 'Credential leakage when source is shared, committed to version control, or logged.',
        recommendation: 'Extract secrets to environment variables or a secret management service (e.g. HashiCorp Vault, AWS Secrets Manager).',
        suggestedFix: 'const apiKey = process.env.SERVICE_API_KEY;',
        confidence: 0.97,
      },
      {
        id: 'BUG-UNHANDLED-PROMISE',
        title: 'Unhandled Async Error or Missing Catch Handler',
        severity: 'Medium',
        category: 'Logic',
        regex: /async\s+function[^{]*\{(?![^}]*try\s*\{)|async\s*\([^)]*\)\s*=>\s*\{(?![^}]*try\s*\{)/i,
        description: 'Async function without a try/catch block or missing rejection handler, which can trigger unhandled rejection crashes.',
        impact: 'Unhandled promise rejections may terminate the Node.js process or leave client requests hanging indefinitely.',
        recommendation: 'Wrap asynchronous operations in try/catch blocks or attach an Express error-forwarding middleware.',
        suggestedFix: 'try {\n  await doSomething();\n} catch (err) {\n  next(err);\n}',
        confidence: 0.75,
      },
      {
        id: 'SEC-REDOS',
        title: 'Potentially Catastrophic Regular Expression Backtracking (ReDoS)',
        severity: 'Medium',
        category: 'Security',
        regex: /\/([a-zA-Z0-9_\-*+?^$|(){}[\]\\]*(\+|\*)\s*(\+|\*)[a-zA-Z0-9_\-*+?^$|(){}[\]\\]*)\/[gimuy]*/i,
        description: 'Nested quantifiers inside regular expressions can cause exponential backtracking on crafted input, causing denial of service.',
        impact: 'CPU starvation and complete freezing of the single-threaded Node.js event loop.',
        recommendation: 'Avoid nested quantifiers or use an atomic regex / non-backtracking regex engine.',
        suggestedFix: '// Use linear non-backtracking pattern or string validation methods\nconst isValid = !input.includes("..");',
        confidence: 0.82,
      },
    ];
  }

  /**
   * Run full static analysis on a given file's source code
   */
  async analyzeFile({ filename, content }) {
    const findings = [];
    const lines = content.split('\n');

    // 1. Run ESLint core rules
    try {
      const lintMessages = this.linter.verify(content, {
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
        rules: {
          'no-eval': 'error',
          'no-implied-eval': 'error',
          'no-constant-condition': 'warn',
          'no-unreachable': 'error',
          'no-unused-vars': 'warn',
          'eqeqeq': ['warn', 'always'],
          'no-debugger': 'error',
        },
      });

      for (const msg of lintMessages) {
        // Map ESLint message to CodeSentry finding
        const lineIdx = (msg.line || 1) - 1;
        const lineText = lines[lineIdx] || '';
        const isEval = msg.ruleId === 'no-eval' || msg.ruleId === 'no-implied-eval';

        findings.push({
          id: `eslint-${Math.random().toString(36).substring(2, 9)}`,
          title: isEval ? 'Dangerous Use of `eval` or Dynamic Code Execution' : `Static Lint Warning: ${msg.message}`,
          severity: isEval ? 'Critical' : msg.severity === 2 ? 'High' : 'Medium',
          category: isEval ? 'Security' : 'Maintainability',
          filePath: filename,
          lineStart: msg.line || 1,
          lineEnd: msg.endLine || msg.line || 1,
          codeExcerpt: lineText.trim(),
          description: isEval
            ? 'Execution of dynamic strings as code via eval() introduces severe arbitrary code execution risks.'
            : msg.message,
          impact: isEval ? 'Arbitrary code execution on client or server.' : 'Code quality defect or potential runtime issue.',
          recommendation: isEval ? 'Eliminate dynamic eval and use static parser methods or direct property access.' : 'Refactor according to standard JavaScript practices.',
          suggestedFix: isEval ? '// Refactor to eliminate eval():\nJSON.parse(data);' : lineText,
          confidence: 0.99,
          source: 'static-eslint',
        });
      }
    } catch (err) {
      console.warn(`[StaticAnalyzer] ESLint parser note for ${filename}:`, err.message);
    }

    // 2. Run AST/regex security patterns with precise line calculation
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      for (const pattern of this.securityPatterns) {
        if (pattern.regex.test(line)) {
          // Avoid duplicate report if already captured
          const exists = findings.some(f => f.filePath === filename && f.lineStart === lineNum && f.title === pattern.title);
          if (!exists) {
            findings.push({
              id: `sec-${Math.random().toString(36).substring(2, 9)}`,
              title: pattern.title,
              severity: pattern.severity,
              category: pattern.category,
              filePath: filename,
              lineStart: lineNum,
              lineEnd: lineNum,
              codeExcerpt: line.trim(),
              description: pattern.description,
              impact: pattern.impact,
              recommendation: pattern.recommendation,
              suggestedFix: pattern.suggestedFix,
              confidence: pattern.confidence,
              source: 'static-security-rule',
            });
          }
        }
      }
    });

    return findings;
  }
}

export const staticAnalyzer = new StaticAnalyzer();
