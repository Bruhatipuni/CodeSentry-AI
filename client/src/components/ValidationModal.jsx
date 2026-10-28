import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  Terminal,
  Code2,
  Clock,
  ShieldAlert,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import apiClient from '../services/api';

export default function ValidationModal({
  finding,
  fix,
  isOpen,
  onClose,
  onValidated,
}) {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'execution'
  const [testSuite, setTestSuite] = useState(null);
  const [testCode, setTestCode] = useState('');
  const [loadingTests, setLoadingTests] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load or generate tests when modal opens
  React.useEffect(() => {
    if (isOpen && finding && !testSuite) {
      loadOrGenerateTests();
    }
  }, [isOpen, finding]);

  const loadOrGenerateTests = async () => {
    setLoadingTests(true);
    setError(null);
    try {
      const data = await apiClient.generateTests(finding.id);
      setTestSuite(data);
      setTestCode(data.testCode || '');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoadingTests(false);
    }
  };

  const runSandboxValidation = async () => {
    setExecuting(true);
    setError(null);
    setActiveTab('execution');
    try {
      const result = await apiClient.validateFix(finding.id, {
        testCode,
      });
      setValidationResult(result);
      if (onValidated) {
        onValidated(result);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyTests = () => {
    navigator.clipboard.writeText(testCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-nvidia-green/10 text-nvidia-green border border-nvidia-green/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Sandbox Test Validation
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Node.js Isolated Sandbox
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Target: {finding?.filePath} — {finding?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-border bg-slate-900/40">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === 'tests'
                ? 'border-nvidia-green text-nvidia-green'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" /> Generated Unit Tests
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === 'execution'
                ? 'border-nvidia-green text-nvidia-green'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" /> Execution Results & Terminal
            {validationResult && (
              <span
                className={`w-2 h-2 rounded-full ${
                  validationResult.verified ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Validation Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {activeTab === 'tests' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    {testSuite?.testTitle || 'Targeted Unit Test Suite'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Self-contained Node.js test runner suite. You can review or edit the test assertions before running.
                  </p>
                </div>
                <button
                  onClick={handleCopyTests}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-border"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Test'}
                </button>
              </div>

              {loadingTests ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3 border border-border rounded-xl bg-slate-900/30">
                  <Loader2 className="w-6 h-6 animate-spin text-nvidia-green" />
                  <p className="text-xs">Generating unit tests with NVIDIA Nemotron...</p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-border bg-[#070b12] overflow-hidden">
                  <textarea
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value)}
                    rows={14}
                    className="w-full p-4 font-mono text-xs text-slate-200 bg-transparent resize-y focus:outline-none"
                    spellCheck="false"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Outcome summary bar */}
              {executing ? (
                <div className="p-6 rounded-xl border border-border bg-slate-900/40 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-nvidia-green" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-200">
                      Executing in Isolated Sandbox...
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Running before/after tests inside restricted child process with memory and timeout constraints.
                    </p>
                  </div>
                </div>
              ) : validationResult ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      validationResult.verified
                        ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                        : 'bg-red-950/30 border-red-800 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {validationResult.verified ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                      )}
                      <div>
                        <h4 className="font-semibold text-sm">
                          {validationResult.verified
                            ? 'Fix Verified Successfully!'
                            : 'Validation Test Failed'}
                        </h4>
                        <p className="text-xs opacity-90">
                          {validationResult.verified
                            ? 'The proposed fix passed all tests and resolved the vulnerability in the isolated sandbox.'
                            : 'The test did not pass against the patched code or timed out.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <span className="block text-slate-400">Passed / Failed</span>
                        <span className="font-bold text-slate-200">
                          {validationResult.passedCount} / {validationResult.failedCount}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-slate-400">Duration</span>
                        <span className="font-bold text-slate-200 flex items-center gap-1 justify-end">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {validationResult.durationMs}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Terminal log output */}
                  <div className="rounded-xl border border-border bg-[#05080f] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-border text-slate-400 text-xs">
                      <span className="font-mono flex items-center gap-2 text-slate-300">
                        <Terminal className="w-3.5 h-3.5 text-nvidia-green" /> Sandbox Console Logs
                      </span>
                    </div>
                    <pre className="p-4 font-mono text-xs text-slate-300 whitespace-pre overflow-x-auto max-h-72 selection:bg-nvidia-green/30">
                      {validationResult.logs || '(no console output)'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-border rounded-xl bg-slate-900/20">
                  <Terminal className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-300">
                    No validation run yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Click "Run Validation" to execute the test suite against both the original and patched code.
                  </p>
                  <button
                    onClick={runSandboxValidation}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold text-xs shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" /> Execute in Sandbox
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-slate-900/90">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Isolated child process with 8s hard timeout & memory limits
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Close
            </button>
            <button
              onClick={runSandboxValidation}
              disabled={executing || loadingTests}
              className="flex items-center gap-2 px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold transition shadow disabled:opacity-50"
            >
              {executing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  Validating...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  Run Validation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
