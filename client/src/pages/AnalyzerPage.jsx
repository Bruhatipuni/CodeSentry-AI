import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Github,
  Upload,
  Cpu,
  FileCode,
  FolderTree,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  ArrowRight,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import apiClient from '../services/api';
import CodeViewer from '../components/CodeViewer';

export default function AnalyzerPage() {
  const navigate = useNavigate();

  // Mode: 'github' | 'upload' | 'demo'
  const [inputMode, setInputMode] = useState('github');
  const [repoUrl, setRepoUrl] = useState('https://github.com/expressjs/express');
  const [zipFile, setZipFile] = useState(null);

  // Inspection states
  const [inspecting, setInspecting] = useState(false);
  const [repoMeta, setRepoMeta] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);

  // Pipeline Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0); // 0 to 4
  const [error, setError] = useState(null);

  // Quick select sample
  const handleSelectDemo = async () => {
    setInputMode('demo');
    setError(null);
    setInspecting(true);
    try {
      const sample = await apiClient.getSampleProject('demo-ecommerce-api');
      setRepoMeta({
        repoName: sample.repoName,
        description: sample.description,
        totalEligibleFiles: sample.files.length,
        files: sample.files,
        isDemo: true,
      });
      if (sample.files.length > 0) {
        setSelectedFile(sample.files[0]);
        setFileContent(sample.files[0].content || '');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setInspecting(false);
    }
  };

  const handleInspectGitHub = async (e) => {
    e?.preventDefault();
    if (!repoUrl) return;
    setError(null);
    setInspecting(true);
    setRepoMeta(null);
    setSelectedFile(null);
    setFileContent('');

    try {
      const meta = await apiClient.inspectRepository(repoUrl);
      setRepoMeta(meta);
      if (meta.files?.length > 0) {
        handleSelectFile(meta.files[0], meta);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setInspecting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Please select a valid .zip file archive.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('ZIP file exceeds maximum limit of 15MB.');
      return;
    }

    setZipFile(file);
    setError(null);
    setInspecting(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await apiClient.uploadZip(formData);
      setRepoMeta({
        repoName: result.repoName,
        totalEligibleFiles: result.files.length,
        files: result.files,
        isZip: true,
      });
      if (result.files.length > 0) {
        setSelectedFile(result.files[0]);
        setFileContent(result.files[0].content || '');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setInspecting(false);
    }
  };

  const handleSelectFile = async (file, metaOverride) => {
    const currentMeta = metaOverride || repoMeta;
    setSelectedFile(file);

    // If content is already embedded (ZIP or Demo)
    if (file.content) {
      setFileContent(file.content);
      return;
    }

    // Otherwise fetch via GitHub API
    setLoadingFile(true);
    try {
      const res = await apiClient.fetchFile(
        currentMeta.owner,
        currentMeta.repoName,
        file.path,
        currentMeta.defaultBranch
      );
      setFileContent(res.content || '');
    } catch (err) {
      setFileContent(`// Error loading file: ${err.message}`);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!repoMeta) return;

    setAnalyzing(true);
    setError(null);
    setAnalysisStage(1);

    try {
      // Simulate real step updates for UX
      setTimeout(() => setAnalysisStage(2), 700);
      setTimeout(() => setAnalysisStage(3), 1600);

      let payload = {};
      if (repoMeta.isDemo) {
        payload = { sampleId: 'demo-ecommerce-api' };
      } else if (repoMeta.isZip) {
        payload = {
          repoName: repoMeta.repoName,
          files: repoMeta.files,
        };
      } else {
        payload = {
          repoUrl,
          repoName: repoMeta.repoName,
          files: repoMeta.files,
        };
      }

      const response = await apiClient.startAnalysis(payload);
      setAnalysisStage(4);

      setTimeout(() => {
        navigate(`/analysis/${response.scan.id}`);
      }, 600);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setAnalyzing(false);
      setAnalysisStage(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          Repository Security & Quality Analyzer
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect public GitHub repositories, upload project archives, or audit our pre-packaged vulnerable sample fixtures.
        </p>
      </div>

      {/* Input Selector Card */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-border text-xs">
            <button
              onClick={() => {
                setInputMode('github');
                setRepoMeta(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                inputMode === 'github'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-3.5 h-3.5" /> Public GitHub
            </button>
            <button
              onClick={() => {
                setInputMode('upload');
                setRepoMeta(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                inputMode === 'upload'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload ZIP
            </button>
          </div>

          <button
            onClick={handleSelectDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-800 transition"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-300" />
            <span>Load Demo Vulnerable Project</span>
          </button>
        </div>

        {/* Input Forms */}
        {inputMode === 'github' && (
          <form onSubmit={handleInspectGitHub} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-border rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-nvidia-green font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={inspecting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-border transition disabled:opacity-50"
            >
              {inspecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-nvidia-green" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Inspect Repo</span>
                </>
              )}
            </button>
          </form>
        )}

        {inputMode === 'upload' && (
          <div className="border-2 border-dashed border-border hover:border-nvidia-green/60 rounded-xl p-8 text-center bg-slate-900/30 transition">
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">
              Drag & Drop your ZIP repository archive, or click to browse
            </p>
            <p className="text-[11px] text-slate-400 mt-1 mb-3">
              Supported files: .js, .jsx, .ts, .tsx, .json, .py (Max 15MB)
            </p>
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
              id="zip-upload-input"
            />
            <label
              htmlFor="zip-upload-input"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-border transition"
            >
              Browse Files
            </label>
            {zipFile && (
              <p className="mt-3 text-xs text-nvidia-green font-mono font-medium">
                Selected: {zipFile.name} ({(zipFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        )}

        {inputMode === 'demo' && repoMeta && (
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-indigo-300">Active Fixture: </span>
              <span className="text-slate-200">{repoMeta.repoName}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{repoMeta.description}</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-indigo-900/40 text-indigo-200 text-[11px] font-mono">
              Pre-loaded
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/80 text-red-300 text-xs flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Repository Inspection Preview */}
      {repoMeta && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{repoMeta.repoName}</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({repoMeta.totalEligibleFiles} eligible files)
                </span>
              </h2>
              {repoMeta.description && (
                <p className="text-xs text-slate-400 mt-0.5">{repoMeta.description}</p>
              )}
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold text-xs transition shadow-md disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Agent Running...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 fill-slate-950" />
                  <span>Start AI & Static Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Analysis Progress Stepper (Active while analyzing) */}
          {analyzing && (
            <div className="p-6 rounded-2xl bg-card border border-nvidia-green/40 shadow-lg shadow-nvidia-green/10 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-nvidia-green" />
                  CodeSentry AI Agent Workflow
                </span>
                <span className="font-mono text-nvidia-green text-[11px]">
                  Step {analysisStage} of 4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div
                  className={`p-2.5 rounded-lg border text-center transition ${
                    analysisStage >= 1
                      ? 'bg-nvidia-green/10 text-nvidia-green border-nvidia-green/30 font-semibold'
                      : 'bg-slate-900 text-slate-500 border-border'
                  }`}
                >
                  1. Ingestion & Filtering
                </div>
                <div
                  className={`p-2.5 rounded-lg border text-center transition ${
                    analysisStage >= 2
                      ? 'bg-nvidia-green/10 text-nvidia-green border-nvidia-green/30 font-semibold'
                      : 'bg-slate-900 text-slate-500 border-border'
                  }`}
                >
                  2. ESLint Static Rules
                </div>
                <div
                  className={`p-2.5 rounded-lg border text-center transition ${
                    analysisStage >= 3
                      ? 'bg-nvidia-green/10 text-nvidia-green border-nvidia-green/30 font-semibold'
                      : 'bg-slate-900 text-slate-500 border-border'
                  }`}
                >
                  3. NVIDIA Nemotron AI
                </div>
                <div
                  className={`p-2.5 rounded-lg border text-center transition ${
                    analysisStage >= 4
                      ? 'bg-nvidia-green/10 text-nvidia-green border-nvidia-green/30 font-semibold'
                      : 'bg-slate-900 text-slate-500 border-border'
                  }`}
                >
                  4. Normalization
                </div>
              </div>
            </div>
          )}

          {/* Split File Explorer and Source Viewer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File List */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3 md:col-span-1 max-h-[500px] flex flex-col">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pb-2 border-b border-border">
                <FolderTree className="w-4 h-4 text-nvidia-green" />
                <span>Source Files ({repoMeta.files?.length})</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {repoMeta.files?.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 transition ${
                      selectedFile?.path === file.path
                        ? 'bg-slate-800 text-nvidia-green font-semibold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate font-mono text-[11px]">
                      {file.path}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Source Code Viewer */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span className="font-mono text-slate-300 font-medium">
                  {selectedFile ? selectedFile.path : 'Select a file to inspect'}
                </span>
              </div>

              {loadingFile ? (
                <div className="h-[450px] rounded-xl border border-border bg-[#0b101b] flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-nvidia-green" />
                  Loading source code...
                </div>
              ) : (
                <CodeViewer
                  code={fileContent}
                  language={selectedFile?.path?.endsWith('.py') ? 'python' : 'javascript'}
                  maxHeight="450px"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
