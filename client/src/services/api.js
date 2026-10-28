import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

export const apiClient = {
  // Config & Health
  getHealth: () => api.get('/health').then(res => res.data),
  getConfigStatus: () => api.get('/config/status').then(res => res.data),
  testNebiusConnection: () => api.post('/config/test-nebius').then(res => res.data),
  getOverviewStats: () => api.get('/stats/overview').then(res => res.data),
  updateSettings: (settings) => api.post('/config/settings', settings).then(res => res.data),

  // Repositories
  inspectRepository: (url) => api.post('/repositories/inspect', { url }).then(res => res.data),
  fetchFile: (owner, repo, path, branch) =>
    api.get('/repositories/file', { params: { owner, repo, path, branch } }).then(res => res.data),
  uploadZip: (formData) =>
    api.post('/repositories/upload-zip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),
  getSampleRepositories: () => api.get('/repositories/samples').then(res => res.data),
  getSampleProject: (id) => api.get(`/repositories/samples/${id}`).then(res => res.data),

  // Analysis Engine
  startAnalysis: (payload) => api.post('/analysis/start', payload).then(res => res.data),
  getAnalysis: (id) => api.get(`/analysis/${id}`).then(res => res.data),
  getAnalysisHistory: (params) => api.get('/analysis/history', { params }).then(res => res.data),
  getFindings: (id) => api.get(`/analysis/${id}/findings`).then(res => res.data),
  exportAnalysisUrl: (id) => `/api/analysis/${id}/export`,

  // Finding Remediation & Validation
  generateFix: (findingId) => api.post(`/findings/${findingId}/generate-fix`).then(res => res.data),
  generateTests: (findingId) => api.post(`/findings/${findingId}/generate-tests`).then(res => res.data),
  validateFix: (findingId, payload = {}) =>
    api.post(`/findings/${findingId}/validate`, payload).then(res => res.data),
};

export default apiClient;
