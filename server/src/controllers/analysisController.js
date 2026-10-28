import { v4 as uuidv4 } from 'uuid';
import { db } from '../storage/db.js';
import { agentPipeline } from '../services/agentPipeline.js';
import { repoIngestionService } from '../services/repoIngestionService.js';

export async function startAnalysis(req, res, next) {
  try {
    const { repoUrl, repoName, files, sampleId } = req.body;

    let targetFiles = files || [];
    let name = repoName || 'custom-analysis';

    // If a demo sample project was selected
    if (sampleId) {
      const sample = repoIngestionService.getSampleProject(sampleId);
      targetFiles = sample.files;
      name = sample.repoName;
    } else if (repoUrl && (!targetFiles || targetFiles.length === 0)) {
      // Ingest from GitHub URL directly
      const { owner, repo } = repoIngestionService.parseGitHubUrl(repoUrl);
      const inspection = await repoIngestionService.fetchGitHubRepo({ owner, repo });
      name = inspection.repoName;

      // Fetch file contents for the top eligible files
      targetFiles = [];
      for (const f of inspection.files.slice(0, 10)) {
        if (f.content) {
          targetFiles.push({ path: f.path, content: f.content, size: f.size || f.content.length });
          continue;
        }
        try {
          const content = await repoIngestionService.fetchFileContent({
            owner,
            repo,
            path: f.path,
            branch: inspection.defaultBranch,
          });
          targetFiles.push({ path: f.path, content, size: f.size });
        } catch (e) {
          console.warn(`Could not load ${f.path}:`, e.message);
        }
      }
    }

    if (!targetFiles || targetFiles.length === 0) {
      return res.status(400).json({ error: 'No files provided or found for analysis.' });
    }

    const scanId = `scan-${uuidv4()}`;

    // Start analysis asynchronously in background so client gets an immediate scanId to poll or view
    // Or await if files count is small (< 10)
    const scanPromise = agentPipeline.runAnalysis({
      scanId,
      repoName: name,
      repoUrl,
      files: targetFiles,
    });

    // For instant responsiveness, we await the first step or let it run
    // Let's await it so the response has the complete initial report
    await scanPromise;

    const completedScan = await db.getScan(scanId);
    const findings = await db.getFindingsByScan(scanId);

    res.json({
      scan: completedScan,
      findingsCount: findings.length,
      findings,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalysis(req, res, next) {
  try {
    const { id } = req.params;
    const scan = await db.getScan(id);
    if (!scan) {
      return res.status(404).json({ error: `Analysis with id "${id}" not found.` });
    }

    const findings = await db.getFindingsByScan(id);
    res.json({ scan, findings });
  } catch (err) {
    next(err);
  }
}

export async function getAnalysisHistory(req, res, next) {
  try {
    const { repo, status } = req.query;
    const scans = await db.listScans({ repo, status });
    res.json(scans);
  } catch (err) {
    next(err);
  }
}

export async function getFindings(req, res, next) {
  try {
    const { id } = req.params;
    const findings = await db.getFindingsByScan(id);
    res.json(findings);
  } catch (err) {
    next(err);
  }
}

export async function exportAnalysis(req, res, next) {
  try {
    const { id } = req.params;
    const scan = await db.getScan(id);
    if (!scan) {
      return res.status(404).json({ error: `Analysis with id "${id}" not found.` });
    }

    const findings = await db.getFindingsByScan(id);

    const report = {
      project: 'CodeSentry AI — Autonomous Security & Quality Audit',
      platform: 'CodeSentry AI Security Engine',
      modelUsed: scan.nebiusUsed ? 'NVIDIA Nemotron via Nebius Token Factory' : 'Static ESLint & Security Rule Engine',
      exportedAt: new Date().toISOString(),
      scan,
      findings,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="codesentry-audit-${id}.json"`);
    res.send(JSON.stringify(report, null, 2));
  } catch (err) {
    next(err);
  }
}
