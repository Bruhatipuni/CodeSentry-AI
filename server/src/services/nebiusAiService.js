import OpenAI from 'openai';
import { config, isNebiusConfigured } from '../config/env.js';

class NebiusAiService {
  constructor() {
    this.client = null;
    this.initClient();
  }

  initClient() {
    if (isNebiusConfigured()) {
      this.client = new OpenAI({
        apiKey: config.NEBIUS_API_KEY,
        baseURL: config.NEBIUS_BASE_URL,
        timeout: 45000,
        maxRetries: 2,
      });
    } else {
      this.client = null;
    }
  }

  getStatus() {
    return {
      configured: isNebiusConfigured(),
      baseUrl: config.NEBIUS_BASE_URL,
      model: config.NEBIUS_MODEL,
      provider: 'Nebius Token Factory (NVIDIA Nemotron)',
    };
  }

  async testConnection() {
    if (!isNebiusConfigured()) {
      return {
        success: false,
        message: 'NEBIUS_API_KEY is not configured in server environment variables.',
      };
    }

    try {
      this.initClient();
      const response = await this.client.chat.completions.create({
        model: config.NEBIUS_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are CodeSentry AI, an autonomous software engineering assistant powered by NVIDIA Nemotron.',
          },
          {
            role: 'user',
            content: 'Respond with a JSON object: {"status": "ok", "provider": "nebius", "model": "' + config.NEBIUS_MODEL + '"}',
          },
        ],
        temperature: 0.1,
        max_tokens: 100,
      });

      const text = response.choices?.[0]?.message?.content || '';
      return {
        success: true,
        message: 'Successfully connected to Nebius Token Factory with NVIDIA Nemotron!',
        model: config.NEBIUS_MODEL,
        rawResponse: text,
      };
    } catch (error) {
      console.error('[Nebius AI] Connection test failed:', error.message);
      return {
        success: false,
        message: `Nebius API connection failed: ${error.message}`,
        status: error.status || 500,
      };
    }
  }

  /**
   * Helper to safely extract JSON from LLM output that might include markdown backticks or commentary
   */
  parseStructuredJson(text) {
    if (!text || typeof text !== 'string') return null;

    // Remove markdown code fences if present
    const cleaned = text.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const candidate = fenceMatch ? fenceMatch[1].trim() : cleaned;

    try {
      return JSON.parse(candidate);
    } catch (e1) {
      // Try to find the first '{' or '[' and the matching last '}' or ']'
      const startObj = candidate.indexOf('{');
      const endObj = candidate.lastIndexOf('}');
      if (startObj !== -1 && endObj > startObj) {
        try {
          return JSON.parse(candidate.slice(startObj, endObj + 1));
        } catch (e2) {}
      }

      const startArr = candidate.indexOf('[');
      const endArr = candidate.lastIndexOf(']');
      if (startArr !== -1 && endArr > startArr) {
        try {
          return JSON.parse(candidate.slice(startArr, endArr + 1));
        } catch (e3) {}
      }

      console.warn('[Nebius AI] Failed to parse JSON response from model:', text.slice(0, 200));
      return null;
    }
  }

  /**
   * AI Code Review for a single file using NVIDIA Nemotron
   */
  async analyzeFileCode({ filename, content, language = 'javascript' }) {
    if (!isNebiusConfigured()) {
      throw new Error('Nebius Token Factory credentials not configured. Please supply NEBIUS_API_KEY in server environment.');
    }

    this.initClient();

    // Limit content to prevent excessive token consumption
    const maxChars = 20000;
    const truncatedContent = content.length > maxChars ? content.slice(0, maxChars) + '\n\n// [Truncated for analysis length]' : content;

    const systemPrompt = `You are CodeSentry AI, an elite security auditor and software quality engineer powered by NVIDIA Nemotron on Nebius Token Factory.
Your mission is to perform rigorous source code review.
Inspect for:
1. Critical security vulnerabilities (OWASP Top 10, injection, prototype pollution, path traversal, ReDoS, hardcoded secrets, timing attacks).
2. Logic bugs and edge case failures (null pointers, off-by-one errors, unhandled promise rejections, state desync).
3. Code quality and maintainability anti-patterns.

CRITICAL INSTRUCTIONS:
- You must output strictly valid JSON with no conversational preamble or markdown commentary outside JSON.
- Only report genuine, actionable issues with evidence. Do not invent non-existent issues.
- Provide accurate line ranges based strictly on the provided code lines.
- Always classify severity as one of: "Critical", "High", "Medium", "Low".
- Provide an estimated confidence score between 0.0 and 1.0.

JSON SCHEMA:
{
  "findings": [
    {
      "title": "Short descriptive title of the issue",
      "severity": "Critical" | "High" | "Medium" | "Low",
      "category": "Security" | "Logic" | "Performance" | "Maintainability",
      "lineStart": number,
      "lineEnd": number,
      "codeExcerpt": "exact lines of problematic code",
      "description": "Clear explanation of why this is a bug or vulnerability",
      "impact": "Potential consequence if left unpatched",
      "recommendation": "Concrete steps to fix this problem",
      "suggestedFix": "Corrected code snippet drop-in replacement",
      "confidence": 0.95
    }
  ]
}`;

    const userPrompt = `File to review: "${filename}" (${language})

\`\`\`${language}
${truncatedContent}
\`\`\`

Analyze the code and output the JSON report matching the specified schema.`;

    const response = await this.client.chat.completions.create({
      model: config.NEBIUS_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    const rawText = response.choices?.[0]?.message?.content || '{}';
    const parsed = this.parseStructuredJson(rawText);

    if (!parsed || !Array.isArray(parsed.findings)) {
      console.warn(`[Nebius AI] Empty or invalid findings format for ${filename}`);
      return [];
    }

    return parsed.findings.map((f, i) => ({
      ...f,
      filePath: filename,
      source: 'nebius-nemotron',
      confidence: typeof f.confidence === 'number' ? f.confidence : 0.9,
    }));
  }

  /**
   * Generates a focused, minimal patch and unified diff for a finding
   */
  async generateFixForFinding({ finding, fileContent }) {
    if (!isNebiusConfigured()) {
      throw new Error('Nebius Token Factory credentials not configured. Please supply NEBIUS_API_KEY.');
    }

    this.initClient();

    const systemPrompt = `You are CodeSentry AI Fix Generator.
You generate minimal, precise, non-breaking code patches to resolve detected vulnerabilities or bugs.
Do NOT rewrite the entire file. Only change the lines necessary to resolve the issue safely.
Output strict JSON with this exact schema:
{
  "explanation": "Brief explanation of how the patch resolves the issue safely",
  "originalCode": "original snippet that needs replacement",
  "proposedCode": "the exact fixed replacement code snippet",
  "unifiedDiff": "unified diff syntax representation showing --- a/file and +++ b/file with @@ line offsets",
  "potentialSideEffects": "Any potential backward compatibility or runtime considerations"
}`;

    const userPrompt = `Target File: ${finding.filePath}
Issue: ${finding.title}
Severity: ${finding.severity}
Description: ${finding.description}
Problematic Code Excerpt:
\`\`\`
${finding.codeExcerpt || ''}
\`\`\`

Full File Content:
\`\`\`
${fileContent.slice(0, 15000)}
\`\`\`

Generate the minimal patch JSON according to the schema.`;

    const response = await this.client.chat.completions.create({
      model: config.NEBIUS_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2500,
    });

    const rawText = response.choices?.[0]?.message?.content || '{}';
    const parsed = this.parseStructuredJson(rawText);

    if (!parsed) {
      throw new Error('Model returned an unparseable fix response.');
    }

    return {
      explanation: parsed.explanation || 'Fix generated by NVIDIA Nemotron.',
      originalCode: parsed.originalCode || finding.codeExcerpt || '',
      proposedCode: parsed.proposedCode || finding.suggestedFix || '',
      unifiedDiff: parsed.unifiedDiff || `--- a/${finding.filePath}\n+++ b/${finding.filePath}\n@@ -1 +1 @@\n-${parsed.originalCode || ''}\n+${parsed.proposedCode || ''}`,
      potentialSideEffects: parsed.potentialSideEffects || 'None noted.',
    };
  }

  /**
   * Generates unit tests targeting the finding and verifying the fix
   */
  async generateTestsForFinding({ finding, proposedFix, fileContent }) {
    if (!isNebiusConfigured()) {
      throw new Error('Nebius Token Factory credentials not configured. Please supply NEBIUS_API_KEY.');
    }

    this.initClient();

    const systemPrompt = `You are CodeSentry AI Test Generator.
Generate focused, executable unit tests for Node.js using standard 'node:test' and 'node:assert' modules.
The tests MUST:
1. Explicitly verify the vulnerability or bug is prevented.
2. Confirm valid inputs still function properly.
3. Be fully self-contained or importable without external non-standard dependencies.
Output strict JSON:
{
  "testTitle": "Short title describing the test suite",
  "testCode": "complete executable test file string using import test from 'node:test' and import assert from 'node:assert'",
  "testCases": [
    { "name": "Test case description", "expectation": "Expected assertion outcome" }
  ],
  "instructions": "How this test verifies the fix"
}`;

    const userPrompt = `Issue: ${finding.title}
File: ${finding.filePath}
Problem: ${finding.description}

Original Code:
\`\`\`
${finding.codeExcerpt || ''}
\`\`\`

Proposed Fix:
\`\`\`
${proposedFix?.proposedCode || finding.suggestedFix || ''}
\`\`\`

Full File Context:
\`\`\`
${fileContent.slice(0, 10000)}
\`\`\`

Generate the self-contained Node.js unit test JSON.`;

    const response = await this.client.chat.completions.create({
      model: config.NEBIUS_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2500,
    });

    const rawText = response.choices?.[0]?.message?.content || '{}';
    const parsed = this.parseStructuredJson(rawText);

    if (!parsed || !parsed.testCode) {
      throw new Error('Failed to generate executable unit tests.');
    }

    return parsed;
  }
}

export const nebiusAiService = new NebiusAiService();
