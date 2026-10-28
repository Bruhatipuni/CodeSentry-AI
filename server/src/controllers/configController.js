import { nebiusAiService } from '../services/nebiusAiService.js';
import { db } from '../storage/db.js';
import { config } from '../config/env.js';

export async function getHealth(req, res) {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    platform: 'CodeSentry AI Platform',
  });
}

export async function getConfigStatus(req, res) {
  const status = nebiusAiService.getStatus();
  const settings = await db.getSettings();

  res.json({
    ...status,
    settings,
    githubTokenConfigured: Boolean(config.GITHUB_TOKEN),
    mongoConfigured: Boolean(config.MONGODB_URI),
    limits: {
      maxScanFiles: config.MAX_SCAN_FILES,
      maxFileSizeKb: config.MAX_FILE_SIZE_KB,
      maxZipSizeMb: config.MAX_ZIP_SIZE_MB,
    },
  });
}

export async function testNebiusConnection(req, res) {
  const result = await nebiusAiService.testConnection();
  res.status(result.success ? 200 : 400).json(result);
}

export async function getOverviewStats(req, res) {
  const stats = await db.getOverviewStats();
  res.json(stats);
}

export async function updateSettings(req, res) {
  if (req.body.githubToken !== undefined) {
    config.GITHUB_TOKEN = req.body.githubToken.trim();
  }
  const updated = await db.updateSettings(req.body);
  res.json(updated);
}
