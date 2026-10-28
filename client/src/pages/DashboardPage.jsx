import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
  Cpu,
  Upload,
  Play,
  FileCode,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import apiClient from '../services/api';
import { CardSkeleton } from '../components/LoadingSkeleton';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewData, historyData] = await Promise.all([
        apiClient.getOverviewStats(),
        apiClient.getAnalysisHistory(),
      ]);
      setStats(overviewData);
      setRecentScans(historyData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await apiClient.startAnalysis({ sampleId: 'demo-ecommerce-api' });
      navigate(`/analysis/${res.scan.id}`);
    } catch (err) {
      console.error('Demo launch error:', err);
      navigate('/analyzer');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-card via-slate-900 to-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Engineering Security Cockpit
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous vulnerability discovery, patch generation, and test validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLaunchDemo}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-border font-medium transition disabled:opacity-50"
          >
            {loadingDemo ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-nvidia-green" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-slate-300" />
            )}
            <span>Run Demo Scan</span>
          </button>

          <Link
            to="/analyzer"
            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold transition shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5 fill-slate-950" />
            <span>Analyze Repository</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Scans */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Repositories Scanned</span>
              <FileCode className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {stats?.totalScans ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Total audits completed</p>
          </div>

          {/* Card 2: Issues Detected */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Issues Detected</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {stats?.totalFindings ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Vulnerabilities & logic bugs</p>
          </div>

          {/* Card 3: Critical Issues */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Critical Severity</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-red-400">
              {stats?.criticalIssues ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Immediate action required</p>
          </div>

          {/* Card 4: Fixes Validated */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold text-slate-300">Fixes Validated</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {stats?.fixesValidated ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Verified in sandbox</p>
          </div>
        </div>
      )}

      {/* Severity Breakdown Bar */}
      {stats && stats.totalFindings > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-semibold text-slate-200">
              Issue Severity Distribution
            </h3>
            <span className="text-slate-400 font-mono text-[11px]">
              {stats.totalFindings} total findings
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            {stats.criticalIssues > 0 && (
              <div
                style={{ width: `${(stats.criticalIssues / stats.totalFindings) * 100}%` }}
                className="bg-red-500 hover:opacity-90 transition"
                title={`Critical: ${stats.criticalIssues}`}
              />
            )}
            {stats.highIssues > 0 && (
              <div
                style={{ width: `${(stats.highIssues / stats.totalFindings) * 100}%` }}
                className="bg-orange-500 hover:opacity-90 transition"
                title={`High: ${stats.highIssues}`}
              />
            )}
            {stats.mediumIssues > 0 && (
              <div
                style={{ width: `${(stats.mediumIssues / stats.totalFindings) * 100}%` }}
                className="bg-amber-500 hover:opacity-90 transition"
                title={`Medium: ${stats.mediumIssues}`}
              />
            )}
            {stats.lowIssues > 0 && (
              <div
                style={{ width: `${(stats.lowIssues / stats.totalFindings) * 100}%` }}
                className="bg-blue-500 hover:opacity-90 transition"
                title={`Low: ${stats.lowIssues}`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Critical ({stats.criticalIssues})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>High ({stats.highIssues})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Medium ({stats.mediumIssues})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Low ({stats.lowIssues})</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Analysis History Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-900/60">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Recent Repository Audits
            </h2>
            <p className="text-[11px] text-slate-400">
              History of analyzed source code packages and security audits.
            </p>
          </div>
          <Link
            to="/history"
            className="flex items-center gap-1 text-xs text-nvidia-green hover:underline font-medium"
          >
            View All History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <FileCode className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-medium text-slate-300">
              No audit scans recorded yet
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Scan a public GitHub repository or run our preloaded demo to generate your first audit.
            </p>
            <div className="pt-2">
              <Link
                to="/analyzer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold transition shadow"
              >
                Start First Scan
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/40 text-slate-400 border-b border-border font-mono text-[11px]">
                <tr>
                  <th className="px-6 py-3">Repository / Project</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Issues Found</th>
                  <th className="px-4 py-3">Severity Breakdown</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentScans.slice(0, 5).map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">
                        {scan.repoName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                        {scan.repoUrl}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-200">
                      {scan.stats?.total ?? 0}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        {scan.stats?.critical > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-900">
                            {scan.stats.critical} Crit
                          </span>
                        )}
                        {scan.stats?.high > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-900">
                            {scan.stats.high} High
                          </span>
                        )}
                        {scan.stats?.medium > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-900">
                            {scan.stats.medium} Med
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-[11px]">
                      {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/analysis/${scan.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs transition border border-border"
                      >
                        Inspect Findings
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
