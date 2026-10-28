import { Router } from 'express';
import multer from 'multer';
import {
  getHealth,
  getConfigStatus,
  testNebiusConnection,
  getOverviewStats,
  updateSettings,
} from '../controllers/configController.js';
import {
  inspectRepository,
  fetchFile,
  uploadZip,
  getSampleRepositories,
  getSampleProject,
} from '../controllers/repoController.js';
import {
  startAnalysis,
  getAnalysis,
  getAnalysisHistory,
  getFindings,
  exportAnalysis,
} from '../controllers/analysisController.js';
import {
  generateFix,
  generateTests,
  validateFix,
} from '../controllers/findingsController.js';
import { apiLimiter, strictLimiter } from '../middleware/rateLimiter.js';
import { config } from '../config/env.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_ZIP_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are supported.'));
    }
  },
});

const router = Router();

// Health & System Configuration
router.get('/health', getHealth);
router.get('/config/status', getConfigStatus);
router.post('/config/test-nebius', testNebiusConnection);
router.post('/config/settings', updateSettings);
router.get('/stats/overview', getOverviewStats);

// Repository Ingestion
router.post('/repositories/inspect', strictLimiter, inspectRepository);
router.get('/repositories/file', fetchFile);
router.post('/repositories/upload-zip', upload.single('file'), uploadZip);
router.get('/repositories/samples', getSampleRepositories);
router.get('/repositories/samples/:id', getSampleProject);

// Analysis Engine & History
router.post('/analysis/start', strictLimiter, startAnalysis);
router.get('/analysis/history', getAnalysisHistory);
router.get('/analysis/:id', getAnalysis);
router.get('/analysis/:id/findings', getFindings);
router.get('/analysis/:id/export', exportAnalysis);

// Finding Remediation & Sandbox Validation
router.post('/findings/:id/generate-fix', generateFix);
router.post('/findings/:id/generate-tests', generateTests);
router.post('/findings/:id/validate', validateFix);

export default router;
