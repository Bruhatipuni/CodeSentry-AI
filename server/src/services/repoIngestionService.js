import axios from 'axios';
import AdmZip from 'adm-zip';
import path from 'path';
import https from 'https';
import { config } from '../config/env.js';
import { SAMPLE_REPOSITORIES } from '../fixtures/sampleProject.js';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.json', '.py', '.html', '.css', '.env.example'
]);

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.cache', 'vendor'
]);

class RepoIngestionService {
  /**
   * Validates GitHub URL and extracts owner and repository name
   */
  parseGitHubUrl(inputUrl) {
    if (!inputUrl || typeof inputUrl !== 'string') {
      throw new Error('A valid repository URL string is required.');
    }

    let urlObj;
    try {
      urlObj = new URL(inputUrl.trim());
    } catch (e) {
      throw new Error('Invalid URL format.');
    }

    // SSRF Defense: Only permit github.com
    if (urlObj.hostname.toLowerCase() !== 'github.com') {
      throw new Error('Security policy: Only public repositories hosted on github.com are permitted.');
    }

    const segments = urlObj.pathname.split('/').filter(Boolean);
    if (segments.length < 2) {
      throw new Error('GitHub URL must include both owner and repository (e.g., https://github.com/owner/repo).');
    }

    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/i, '');

    // Strict alphanumeric / hyphen naming validation
    const nameRegex = /^[a-zA-Z0-9_\-\.]+$/;
    if (!nameRegex.test(owner) || !nameRegex.test(repo)) {
      throw new Error('Invalid owner or repository name.');
    }

    return { owner, repo, fullName: `${owner}/${repo}` };
  }

  /**
   * Fetches metadata and file list from public GitHub repository
   */
  async fetchGitHubRepo({ owner, repo }) {
    const headers = {
      'User-Agent': 'CodeSentry-AI-Agent',
      Accept: 'application/vnd.github.v3+json',
    };

    if (config.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${config.GITHUB_TOKEN}`;
    }

    // 1. Fetch repo metadata
    let repoMeta;
    try {
      const metaRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
        timeout: 10000,
        httpsAgent,
      });
      repoMeta = metaRes.data;
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error(`Repository "${owner}/${repo}" was not found or is private.`);
      }
      if (err.response?.status === 403 || err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || err.message?.includes('certificate')) {
        // Automatically fall back to direct archive download to bypass rate limits & SSL proxy issues
        return this.fetchViaDirectArchive({ owner, repo });
      }
      throw new Error(`Failed to inspect repository: ${err.message}`);
    }

    // 2. Fetch git tree (recursive)
    const defaultBranch = repoMeta.default_branch || 'main';
    let treeRes;
    try {
      treeRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
        { headers, timeout: 15000, httpsAgent }
      );
    } catch (err) {
      if (err.response?.status === 403 || err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || err.message?.includes('certificate')) {
        return this.fetchViaDirectArchive({ owner, repo });
      }
      throw new Error(`Failed to retrieve file tree for branch "${defaultBranch}": ${err.message}`);
    }

    const rawTree = treeRes.data.tree || [];
    const eligibleFiles = [];

    for (const item of rawTree) {
      if (item.type !== 'blob') continue;

      const ext = path.extname(item.path).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;

      const pathSegments = item.path.split('/');
      if (pathSegments.some(seg => IGNORED_DIRS.has(seg))) continue;

      // Check file size (filter out huge bundles)
      if (item.size && item.size > config.MAX_FILE_SIZE_KB * 1024) continue;

      eligibleFiles.push({
        path: item.path,
        size: item.size || 0,
        sha: item.sha,
        url: item.url,
      });

      if (eligibleFiles.length >= config.MAX_SCAN_FILES) break;
    }

    return {
      repoName: repoMeta.name,
      owner: repoMeta.owner?.login,
      description: repoMeta.description,
      stars: repoMeta.stargazers_count,
      language: repoMeta.language,
      defaultBranch,
      totalEligibleFiles: eligibleFiles.length,
      files: eligibleFiles,
    };
  }

  /**
   * Bypasses GitHub API rate limits by downloading the public repository archive directly
   */
  async fetchViaDirectArchive({ owner, repo }) {
    console.log(`[RepoIngestion] GitHub API rate limit active. Falling back to direct public archive for ${owner}/${repo}...`);
    const candidateUrls = [
      `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`,
      `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`,
      `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/main`,
      `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/master`,
      `https://github.com/${owner}/${repo}/archive/HEAD.zip`,
    ];

    let zipBuffer = null;
    let lastError = null;

    for (const archiveUrl of candidateUrls) {
      try {
        const res = await axios.get(archiveUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: { 'User-Agent': 'CodeSentry-AI-Agent' },
          httpsAgent,
          maxContentLength: config.MAX_ZIP_SIZE_MB * 1024 * 1024,
        });
        if (res.data && res.data.length > 0) {
          zipBuffer = Buffer.from(res.data);
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!zipBuffer) {
      throw new Error(`GitHub API rate limit exceeded and archive download failed: ${lastError?.message || 'Archive not found'}. You can configure a personal GITHUB_TOKEN in Settings, or upload a ZIP file.`);
    }

    try {
      const zipResult = await this.processZipBuffer(zipBuffer, `${repo}.zip`);

      // Strip top-level zip directory prefix (e.g. "repo-HEAD/src/..." -> "src/...")
      const cleanedFiles = zipResult.files.map(f => {
        const parts = f.path.split('/');
        const cleanPath = parts.length > 1 ? parts.slice(1).join('/') : f.path;
        return {
          ...f,
          path: cleanPath,
        };
      }).filter(f => f.path && f.path.length > 0);

      return {
        repoName: repo,
        owner,
        description: `Direct archive ingestion for ${owner}/${repo} (Bypassing GitHub API rate limits)`,
        stars: 'Public Repo',
        language: cleanedFiles.find(f => f.path.endsWith('.js') || f.path.endsWith('.py'))?.language || 'JavaScript',
        defaultBranch: 'main',
        totalEligibleFiles: cleanedFiles.length,
        files: cleanedFiles,
        isDirectArchive: true,
      };
    } catch (archiveErr) {
      console.error(`[RepoIngestion] Direct archive fallback failed:`, archiveErr.message);
      throw new Error(`GitHub API rate limit exceeded and direct archive download failed: ${archiveErr.message}. You can configure a personal GITHUB_TOKEN in Settings to increase limits to 5,000 req/hr, or upload a ZIP.`);
    }
  }

  /**
   * Fetches the raw content of a specific file from GitHub
   */
  async fetchFileContent({ owner, repo, path: filePath, branch = 'main' }) {
    const headers = { 'User-Agent': 'CodeSentry-AI-Agent' };
    if (config.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${config.GITHUB_TOKEN}`;
    }

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    try {
      const res = await axios.get(rawUrl, { headers, timeout: 10000, responseType: 'text', httpsAgent });
      return res.data;
    } catch (err) {
      throw new Error(`Could not fetch file content for "${filePath}": ${err.message}`);
    }
  }

  /**
   * Inspects and extracts an uploaded ZIP file safely
   */
  async processZipBuffer(buffer, originalFilename = 'archive.zip') {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const files = [];

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      // Zip-slip security guard: ensure target path doesn't escape
      const normalizedPath = path.normalize(entry.entryName).replace(/^(\.\.[\/\\])+/, '');
      if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
        continue;
      }

      const ext = path.extname(normalizedPath).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;

      const pathSegments = normalizedPath.split(path.sep);
      if (pathSegments.some(seg => IGNORED_DIRS.has(seg))) continue;

      if (entry.header.size > config.MAX_FILE_SIZE_KB * 1024) continue;

      const content = entry.getData().toString('utf8');
      files.push({
        path: normalizedPath.replace(/\\/g, '/'),
        size: entry.header.size,
        content,
        language: ext === '.py' ? 'python' : 'javascript',
      });

      if (files.length >= config.MAX_SCAN_FILES) break;
    }

    return {
      repoName: path.basename(originalFilename, path.extname(originalFilename)),
      source: 'zip-upload',
      files,
    };
  }

  /**
   * Retrieves a safe demo project
   */
  getSampleProject(id = 'demo-ecommerce-api') {
    const sample = SAMPLE_REPOSITORIES.find(s => s.id === id) || SAMPLE_REPOSITORIES[0];
    return {
      repoName: sample.name,
      description: sample.description,
      source: 'demo-sample',
      files: sample.files,
    };
  }
}

export const repoIngestionService = new RepoIngestionService();
