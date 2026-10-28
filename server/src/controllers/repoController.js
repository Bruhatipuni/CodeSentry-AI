import { repoIngestionService } from '../services/repoIngestionService.js';
import { SAMPLE_REPOSITORIES } from '../fixtures/sampleProject.js';

export async function inspectRepository(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required.' });
    }

    const { owner, repo } = repoIngestionService.parseGitHubUrl(url);
    const inspectResult = await repoIngestionService.fetchGitHubRepo({ owner, repo });

    res.json(inspectResult);
  } catch (err) {
    next(err);
  }
}

export async function fetchFile(req, res, next) {
  try {
    const { owner, repo, path, branch } = req.query;
    if (!owner || !repo || !path) {
      return res.status(400).json({ error: 'owner, repo, and path query parameters are required.' });
    }

    const content = await repoIngestionService.fetchFileContent({
      owner,
      repo,
      path,
      branch: branch || 'main',
    });

    res.json({ path, content });
  } catch (err) {
    next(err);
  }
}

export async function uploadZip(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a valid .zip file.' });
    }

    const result = await repoIngestionService.processZipBuffer(
      req.file.buffer,
      req.file.originalname
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSampleRepositories(req, res) {
  res.json(SAMPLE_REPOSITORIES);
}

export async function getSampleProject(req, res) {
  const { id } = req.params;
  const sample = repoIngestionService.getSampleProject(id);
  res.json(sample);
}
