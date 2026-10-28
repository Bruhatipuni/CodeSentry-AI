import { v4 as uuidv4 } from 'uuid';
import { db } from '../storage/db.js';
import { staticAnalyzer } from './staticAnalyzer.js';
import { nebiusAiService } from './nebiusAiService.js';
import { isNebiusConfigured } from '../config/env.js';

class AgentPipeline {
  /**
   * Orchestrates full end-to-end repository code review
   */
  async runAnalysis({ scanId, repoName, repoUrl, files }) {
    console.log(`[AgentPipeline] Starting scan ${scanId} for "${repoName}" (${files.length} files)`);

    const scanRecord = {
      id: scanId,
      repoName,
      repoUrl: repoUrl || 'Direct / Demo Upload',
      status: 'analyzing',
      stage: 'static_analysis',
      filesCount: files.length,
      createdAt: new Date().toISOString(),
      stats: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      files: files.map(f => ({ path: f.path, size: f.size || f.content?.length || 0 })),
    };

    await db.saveScan(scanRecord);

    const allFindings = [];

    try {
      // Step 1: Static Analysis using real ESLint & AST rules
      console.log(`[AgentPipeline] Phase 1: Static Analysis on ${files.length} files`);
      await db.updateScan(scanId, { stage: 'static_analysis' });

      for (const file of files) {
        if (!file.content) continue;
        const staticResults = await staticAnalyzer.analyzeFile({
          filename: file.path,
          content: file.content,
        });

        for (const finding of staticResults) {
          allFindings.push({
            ...finding,
            id: `fnd-${uuidv4()}`,
            scanId,
            fileContent: file.content,
          });
        }
      }

      // Step 2: AI Code Review with Nebius Token Factory (NVIDIA Nemotron)
      if (isNebiusConfigured()) {
        console.log(`[AgentPipeline] Phase 2: Nebius AI Review with NVIDIA Nemotron`);
        await db.updateScan(scanId, { stage: 'ai_review' });

        // Limit the number of files analyzed by AI to prevent rate-limit flooding
        const aiTargetFiles = files.slice(0, 5);

        for (const file of aiTargetFiles) {
          if (!file.content) continue;
          try {
            const aiResults = await nebiusAiService.analyzeFileCode({
              filename: file.path,
              content: file.content,
              language: file.language || 'javascript',
            });

            for (const finding of aiResults) {
              // Deduplicate against static findings with similar line and title
              const isDuplicate = allFindings.some(
                f => f.filePath === file.path && Math.abs(f.lineStart - finding.lineStart) <= 2
              );

              if (!isDuplicate) {
                allFindings.push({
                  ...finding,
                  id: `fnd-${uuidv4()}`,
                  scanId,
                  fileContent: file.content,
                });
              }
            }
          } catch (aiErr) {
            console.error(`[AgentPipeline] Nebius AI review error on ${file.path}:`, aiErr.message);
          }
        }
      } else {
        console.log(`[AgentPipeline] Nebius API key not set - Static analysis completed without external AI.`);
      }

      // Step 3: Normalize and aggregate findings
      console.log(`[AgentPipeline] Phase 3: Aggregating findings (${allFindings.length} total)`);
      await db.updateScan(scanId, { stage: 'normalizing_results' });

      const stats = {
        total: allFindings.length,
        critical: allFindings.filter(f => f.severity?.toLowerCase() === 'critical').length,
        high: allFindings.filter(f => f.severity?.toLowerCase() === 'high').length,
        medium: allFindings.filter(f => f.severity?.toLowerCase() === 'medium').length,
        low: allFindings.filter(f => f.severity?.toLowerCase() === 'low').length,
      };

      // Persist findings
      await db.saveFindings(allFindings);

      // Finalize scan record
      await db.updateScan(scanId, {
        status: 'completed',
        stage: 'completed',
        stats,
        nebiusUsed: isNebiusConfigured(),
        completedAt: new Date().toISOString(),
      });

      console.log(`[AgentPipeline] Scan ${scanId} completed successfully.`);
      return {
        scanId,
        stats,
        findingsCount: allFindings.length,
      };
    } catch (err) {
      console.error(`[AgentPipeline] Scan ${scanId} failed:`, err);
      await db.updateScan(scanId, {
        status: 'failed',
        error: err.message,
        stage: 'failed',
      });
      throw err;
    }
  }
}

export const agentPipeline = new AgentPipeline();
