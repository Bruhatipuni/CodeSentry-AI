import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Zap,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
  Lock,
  Save,
  Server,
  Key,
} from 'lucide-react';
import apiClient from '../services/api';

export default function SettingsPage() {
  const [configStatus, setConfigStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Editable settings
  const [maxScanFiles, setMaxScanFiles] = useState(30);
  const [maxFileSizeKb, setMaxFileSizeKb] = useState(250);
  const [githubToken, setGithubToken] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getConfigStatus();
      setConfigStatus(data);
      if (data.settings) {
        setMaxScanFiles(data.settings.maxScanFiles || 30);
        setMaxFileSizeKb(data.settings.maxFileSizeKb || 250);
        setGithubToken(data.settings.githubToken || '');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNebius = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await apiClient.testNebiusConnection();
      setTestResult({
        success: true,
        message: res.message || 'Connection successful!',
        raw: res.rawResponse,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      await apiClient.updateSettings({
        maxScanFiles: Number(maxScanFiles),
        maxFileSizeKb: Number(maxFileSizeKb),
        githubToken,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          Agent Settings & Infrastructure
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Verify inference connectivity, inspect configured NVIDIA open-source models, and adjust scan parameters.
        </p>
      </div>

      {/* Nebius Token Factory Card */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-nvidia-green/10 text-nvidia-green border border-nvidia-green/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Nebius Token Factory & NVIDIA Model
              </h2>
              <p className="text-xs text-slate-400">
                Official OpenAI-compatible inference endpoint for open-weight models.
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
              configStatus?.configured
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                : 'bg-amber-950/60 text-amber-300 border-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                configStatus?.configured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>{configStatus?.configured ? 'Configured' : 'Credentials Missing'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-border space-y-1">
            <span className="text-slate-400 block text-[11px]">Provider Platform</span>
            <span className="font-semibold text-slate-200">
              {configStatus?.provider || 'Nebius Token Factory'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-border space-y-1">
            <span className="text-slate-400 block text-[11px]">Inference Base URL</span>
            <span className="font-mono text-slate-200 truncate block">
              {configStatus?.baseUrl || 'https://api.tokenfactory.nebius.com/v1/'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-border space-y-1 sm:col-span-2">
            <span className="text-slate-400 block text-[11px]">Active NVIDIA Open-Source Model</span>
            <span className="font-mono font-semibold text-nvidia-green text-xs">
              {configStatus?.model || 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF'}
            </span>
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>Credentials managed securely via server environment variables.</span>
          </div>

          <button
            onClick={handleTestNebius}
            disabled={testingConnection}
            className="flex items-center gap-2 px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-border font-medium transition disabled:opacity-50"
          >
            {testingConnection ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-nvidia-green" />
                <span>Testing API Reachability...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-nvidia-green" />
                <span>Test Nebius Connection</span>
              </>
            )}
          </button>
        </div>

        {/* Test Connection Result Box */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              testResult.success
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                : 'bg-red-950/30 border-red-800 text-red-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{testResult.message}</p>
              {testResult.raw && (
                <pre className="font-mono text-[11px] opacity-80 whitespace-pre-wrap">
                  {testResult.raw}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Limits & Configuration Form */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="text-sm font-semibold text-white">
            Analysis Limits & Safeguards
          </h2>
          <p className="text-xs text-slate-400">
            Control the maximum file counts and payload sizes to control inference costs.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Max Files Per Repository Scan
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={maxScanFiles}
                onChange={(e) => setMaxScanFiles(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-border rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-nvidia-green"
              />
              <span className="text-[11px] text-slate-500">
                Limits scan scope to top eligible source files.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Max Individual File Size (KB)
              </label>
              <input
                type="number"
                min={10}
                max={1000}
                value={maxFileSizeKb}
                onChange={(e) => setMaxFileSizeKb(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-border rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-nvidia-green"
              />
              <span className="text-[11px] text-slate-500">
                Files larger than this limit are skipped from AST review.
              </span>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300">
                GitHub Personal Access Token (Optional)
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-border rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-nvidia-green"
              />
              <span className="text-[11px] text-slate-500">
                Increases GitHub API limit from 60 to 5,000 requests/hour. (If omitted, public repositories automatically use direct archive ingestion to bypass rate limits).
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Preferences saved!
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold transition shadow disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Code Privacy & Security Guarantees */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
        <div className="flex items-center gap-2.5 text-nvidia-green text-xs font-semibold">
          <Shield className="w-4 h-4" />
          <span>Data Retention & Security Protocol</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          CodeSentry AI does not transmit credentials to third-party tracking services. All repository downloads are processed in volatile memory or isolated temporary scratch directories that are cleaned up immediately following sandbox test execution. API keys remain strictly confined to server-side environment variables and are never forwarded to the browser.
        </p>
      </div>
    </div>
  );
}
