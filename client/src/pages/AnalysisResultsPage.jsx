import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  FileCode,
  Download,
  Filter,
  Wrench,
  Terminal,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import apiClient from '../services/api';
import SeverityBadge from '../components/SeverityBadge';
import CodeViewer from '../components/CodeViewer';
import DiffViewer from '../components/DiffViewer';
import ValidationModal from '../components/ValidationModal';
import { CardSkeleton } from '../components/LoadingSkeleton';

export default function AnalysisResultsPage() {
  const { id } = useParams();

  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedFile, setSelectedFile] = useState('ALL');

  // Fix & Validation UI state
  const [activeFixes, setActiveFixes] = useState({}); // findingId -> fix object
  const [generatingFixId, setGeneratingFixId] = useState(null);
  const [approvedFixes, setApprovedFixes] = useState({}); // findingId -> boolean
  const [validationModalData, setValidationModalData] = useState(null); // { finding, fix }

  // Expanded finding cards
  const [expandedFindings, setExpandedFindings] = useState({});

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAnalysis(id);
      setScan(data.scan);
      setFindings(data.findings || []);

      // Auto-expand the first 2 findings
      const initialExpanded = {};
      (data.findings || []).slice(0, 2).forEach((f) => {
        initialExpanded[f.id] = true;
      });
      setExpandedFindings(initialExpanded);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (findingId) => {
    setExpandedFindings((prev) => ({
      ...prev,
      [findingId]: !prev[findingId],
    }));
  };

  const handleGenerateFix = async (finding) => {
    setGeneratingFixId(finding.id);
    try {
      const fix = await apiClient.generateFix(finding.id);
      setActiveFixes((prev) => ({ ...prev, [finding.id]: fix }));
      setExpandedFindings((prev) => ({ ...prev, [finding.id]: true }));
    } catch (err) {
      alert(`Fix generation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setGeneratingFixId(null);
    }
  };

  const handleOpenValidation = (finding) => {
    const fix = activeFixes[finding.id];
    setValidationModalData({ finding, fix });
  };

  const handleApproveFix = (findingId) => {
    setApprovedFixes((prev) => ({ ...prev, [findingId]: true }));
  };

  const handleRejectFix = (findingId) => {
    setActiveFixes((prev) => {
      const copy = { ...prev };
      delete copy[findingId];
      return copy;
    });
    setApprovedFixes((prev) => ({ ...prev, [findingId]: false }));
  };

  const handleValidationComplete = (result) => {
    if (result.verified && validationModalData?.finding) {
      // Update local findings status to validated
      setFindings((prev) =>
        prev.map((f) =>
          f.id === validationModalData.finding.id ? { ...f, status: 'validated' } : f
        )
      );
    }
  };

  // Filter list
  const filteredFindings = findings.filter((f) => {
    const matchSev =
      selectedSeverity === 'ALL' ||
      f.severity?.toUpperCase() === selectedSeverity.toUpperCase();
    const matchFile = selectedFile === 'ALL' || f.filePath === selectedFile;
    return matchSev && matchFile;
  });

  const uniqueFiles = Array.from(new Set(findings.map((f) => f.filePath)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-800 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Analysis Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'Could not locate scan record.'}</p>
        <Link
          to="/analyzer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Analyzer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                to="/history"
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{scan.repoName}</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                  Audit Completed
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Target: {scan.repoUrl} • Scanned on {new Date(scan.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={apiClient.exportAnalysisUrl(scan.id)}
              download
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-border font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit JSON</span>
            </a>
          </div>
        </div>

        {/* Severity Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
            <span className="text-[11px] text-slate-400">Total Findings</span>
            <span className="block text-xl font-bold font-mono text-white">
              {findings.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/40">
            <span className="text-[11px] text-red-400">Critical</span>
            <span className="block text-xl font-bold font-mono text-red-300">
              {scan.stats?.critical ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-orange-950/30 border border-orange-900/40">
            <span className="text-[11px] text-orange-400">High</span>
            <span className="block text-xl font-bold font-mono text-orange-300">
              {scan.stats?.high ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40">
            <span className="text-[11px] text-amber-400">Medium</span>
            <span className="block text-xl font-bold font-mono text-amber-300">
              {scan.stats?.medium ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40">
            <span className="text-[11px] text-blue-400">Low</span>
            <span className="block text-xl font-bold font-mono text-blue-300">
              {scan.stats?.low ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border text-xs">
        {/* Severity filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedSeverity === sev
                  ? 'bg-slate-800 text-nvidia-green border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* File selector dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">File:</span>
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="px-3 py-1 bg-slate-900 border border-border rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-nvidia-green"
          >
            <option value="ALL">All Files ({findings.length})</option>
            {uniqueFiles.map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-card border border-border space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-200">
              No Issues Match Selected Filters
            </h3>
            <p className="text-xs text-slate-400">
              Try adjusting the severity or file filter above.
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isExpanded = Boolean(expandedFindings[finding.id]);
            const fix = activeFixes[finding.id];
            const isApproved = approvedFixes[finding.id];
            const isGeneratingFix = generatingFixId === finding.id;
            const isValidated = finding.status === 'validated';

            return (
              <div
                key={finding.id}
                className="rounded-2xl bg-card border border-border overflow-hidden transition shadow-sm hover:border-slate-700"
              >
                {/* Finding Header Card */}
                <div
                  onClick={() => toggleExpand(finding.id)}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 transition select-none"
                >
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <SeverityBadge severity={finding.severity} />
                      {isValidated && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Validated Fix
                        </span>
                      )}
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {finding.category || 'Security'}
                      </span>
                      {finding.confidence && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Confidence: {Math.round(finding.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      {finding.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono truncate max-w-xl">
                      {finding.filePath}
                      {finding.lineStart ? ` (Line ${finding.lineStart}${finding.lineEnd && finding.lineEnd !== finding.lineStart ? `-${finding.lineEnd}` : ''})` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(finding.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-border/70 space-y-5 bg-slate-950/20">
                    {/* Description & Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-border space-y-1">
                        <span className="font-semibold text-slate-300">Problem Explanation</span>
                        <p className="text-slate-400 leading-relaxed">
                          {finding.description}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-border space-y-1">
                        <span className="font-semibold text-amber-400">Potential Impact</span>
                        <p className="text-slate-400 leading-relaxed">
                          {finding.impact || 'May cause security compromise, denial of service, or runtime exceptions.'}
                        </p>
                      </div>
                    </div>

                    {/* Problematic Code Excerpt */}
                    {finding.codeExcerpt && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-300">
                          Identified Vulnerable Excerpt
                        </span>
                        <CodeViewer
                          code={finding.codeExcerpt}
                          highlightStart={finding.lineStart}
                          highlightEnd={finding.lineEnd}
                          startLineNumber={finding.lineStart || 1}
                          maxHeight="200px"
                        />
                      </div>
                    )}

                    {/* Recommendation note */}
                    {finding.recommendation && (
                      <div className="p-3 rounded-xl bg-emerald-950/15 border border-emerald-900/30 text-xs text-emerald-200">
                        <span className="font-semibold text-emerald-400">Remediation Guideline: </span>
                        {finding.recommendation}
                      </div>
                    )}

                    {/* AI Fix Section */}
                    {fix && (
                      <div className="space-y-2 pt-2">
                        <DiffViewer
                          fix={fix}
                          isApproved={isApproved}
                          onApprove={() => handleApproveFix(finding.id)}
                          onReject={() => handleRejectFix(finding.id)}
                          onValidate={() => handleOpenValidation(finding)}
                        />
                      </div>
                    )}

                    {/* Action Buttons Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-[11px] text-slate-500 font-mono">
                        Source Engine: {finding.source || 'AI + Static Audit'}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {!fix && (
                          <button
                            onClick={() => handleGenerateFix(finding)}
                            disabled={isGeneratingFix}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow disabled:opacity-50"
                          >
                            {isGeneratingFix ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                Generating Fix...
                              </>
                            ) : (
                              <>
                                <Wrench className="w-3.5 h-3.5" />
                                Generate Fix
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenValidation(finding)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-border font-medium transition"
                        >
                          <Terminal className="w-3.5 h-3.5 text-nvidia-green" />
                          <span>Generate & Run Tests</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Validation Modal */}
      {validationModalData && (
        <ValidationModal
          finding={validationModalData.finding}
          fix={validationModalData.fix}
          isOpen={Boolean(validationModalData)}
          onClose={() => setValidationModalData(null)}
          onValidated={handleValidationComplete}
        />
      )}
    </div>
  );
}
