import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DataStore {
  constructor() {
    this.isMongo = Boolean(config.MONGODB_URI);
    this.cache = {
      scans: [],
      findings: [],
      fixes: [],
      validations: [],
      settings: {
        maxScanFiles: config.MAX_SCAN_FILES,
        maxFileSizeKb: config.MAX_FILE_SIZE_KB,
        nebiusModel: config.NEBIUS_MODEL,
        autoValidate: false,
      },
    };
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    if (this.isMongo) {
      console.log('[Storage] Configured with MongoDB URI. Initializing MongoDB adapter...');
      // In production with MONGODB_URI, a MongoClient can be attached here.
      // Fallback local store ensures zero-config execution.
    }

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        const content = await fs.readFile(DB_FILE, 'utf8');
        const parsed = JSON.parse(content);
        this.cache = { ...this.cache, ...parsed };
      } catch (err) {
        // File doesn't exist yet, save initial empty schema
        await this.persist();
      }
      this.initialized = true;
      console.log(`[Storage] Local JSON persistence initialized at ${DB_FILE}`);
    } catch (err) {
      console.error('[Storage] Error initializing local storage:', err);
      this.initialized = true;
    }
  }

  async persist() {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(this.cache, null, 2), 'utf8');
    } catch (err) {
      console.error('[Storage] Failed to persist DB:', err);
    }
  }

  // --- SCANS ---
  async saveScan(scan) {
    await this.init();
    const existingIndex = this.cache.scans.findIndex(s => s.id === scan.id);
    if (existingIndex >= 0) {
      this.cache.scans[existingIndex] = { ...this.cache.scans[existingIndex], ...scan, updatedAt: new Date().toISOString() };
    } else {
      this.cache.scans.unshift({
        ...scan,
        createdAt: scan.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await this.persist();
    return scan;
  }

  async getScan(id) {
    await this.init();
    return this.cache.scans.find(s => s.id === id) || null;
  }

  async updateScan(id, updates) {
    await this.init();
    const scan = this.cache.scans.find(s => s.id === id);
    if (!scan) return null;
    Object.assign(scan, updates, { updatedAt: new Date().toISOString() });
    await this.persist();
    return scan;
  }

  async listScans(filters = {}) {
    await this.init();
    let result = [...this.cache.scans];
    if (filters.repo) {
      result = result.filter(s => s.repoName?.toLowerCase().includes(filters.repo.toLowerCase()));
    }
    if (filters.status) {
      result = result.filter(s => s.status === filters.status);
    }
    return result;
  }

  // --- FINDINGS ---
  async saveFindings(findings) {
    await this.init();
    for (const finding of findings) {
      const idx = this.cache.findings.findIndex(f => f.id === finding.id);
      if (idx >= 0) {
        this.cache.findings[idx] = { ...this.cache.findings[idx], ...finding };
      } else {
        this.cache.findings.push({
          ...finding,
          createdAt: finding.createdAt || new Date().toISOString(),
        });
      }
    }
    await this.persist();
    return findings;
  }

  async getFinding(id) {
    await this.init();
    return this.cache.findings.find(f => f.id === id) || null;
  }

  async getFindingsByScan(scanId) {
    await this.init();
    return this.cache.findings.filter(f => f.scanId === scanId);
  }

  async updateFinding(id, updates) {
    await this.init();
    const finding = this.cache.findings.find(f => f.id === id);
    if (!finding) return null;
    Object.assign(finding, updates);
    await this.persist();
    return finding;
  }

  // --- FIXES ---
  async saveFix(fix) {
    await this.init();
    const idx = this.cache.fixes.findIndex(f => f.id === fix.id);
    if (idx >= 0) {
      this.cache.fixes[idx] = { ...this.cache.fixes[idx], ...fix };
    } else {
      this.cache.fixes.push({
        ...fix,
        createdAt: fix.createdAt || new Date().toISOString(),
      });
    }
    await this.persist();
    return fix;
  }

  async getFix(id) {
    await this.init();
    return this.cache.fixes.find(f => f.id === id) || null;
  }

  async getFixByFinding(findingId) {
    await this.init();
    return this.cache.fixes.find(f => f.findingId === findingId) || null;
  }

  // --- VALIDATIONS ---
  async saveValidation(validation) {
    await this.init();
    const idx = this.cache.validations.findIndex(v => v.id === validation.id);
    if (idx >= 0) {
      this.cache.validations[idx] = { ...this.cache.validations[idx], ...validation };
    } else {
      this.cache.validations.push({
        ...validation,
        createdAt: validation.createdAt || new Date().toISOString(),
      });
    }
    await this.persist();
    return validation;
  }

  async getValidationByFinding(findingId) {
    await this.init();
    return this.cache.validations.find(v => v.findingId === findingId) || null;
  }

  // --- OVERVIEW STATS ---
  async getOverviewStats() {
    await this.init();
    const totalScans = this.cache.scans.length;
    const totalFindings = this.cache.findings.length;
    const criticalIssues = this.cache.findings.filter(f => f.severity?.toLowerCase() === 'critical').length;
    const highIssues = this.cache.findings.filter(f => f.severity?.toLowerCase() === 'high').length;
    const mediumIssues = this.cache.findings.filter(f => f.severity?.toLowerCase() === 'medium').length;
    const lowIssues = this.cache.findings.filter(f => f.severity?.toLowerCase() === 'low').length;
    const fixesValidated = this.cache.validations.filter(v => v.status === 'passed').length;
    const fixesGenerated = this.cache.fixes.length;

    return {
      totalScans,
      totalFindings,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      fixesValidated,
      fixesGenerated,
      severityBreakdown: {
        critical: criticalIssues,
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues,
      },
    };
  }

  // --- SETTINGS ---
  async getSettings() {
    await this.init();
    return this.cache.settings;
  }

  async updateSettings(newSettings) {
    await this.init();
    this.cache.settings = { ...this.cache.settings, ...newSettings };
    await this.persist();
    return this.cache.settings;
  }
}

export const db = new DataStore();
