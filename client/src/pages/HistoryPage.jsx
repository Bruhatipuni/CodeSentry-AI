import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  FileCode,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Loader2,
} from 'lucide-react';
import apiClient from '../services/api';
import { TableRowSkeleton } from '../components/LoadingSkeleton';

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAnalysisHistory();
      setScans(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = scans.filter((scan) => {
    const matchSearch =
      !searchTerm ||
      scan.repoName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.repoUrl?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === 'ALL' || scan.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          Repository Scan Archive
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review historical vulnerability audits, severity distributions, and validated patches.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by repository name or URL..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-border rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-nvidia-green"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-border rounded-xl text-slate-200 text-xs focus:outline-none focus:border-nvidia-green"
          >
            <option value="ALL">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="analyzing">In Progress</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-border">
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <History className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-200">
              No Historical Scans Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Run your first repository scan or adjust your search filters to view archives.
            </p>
            <div className="pt-2">
              <Link
                to="/analyzer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold transition shadow"
              >
                Start New Analysis
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-border font-mono text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Repository / Project</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Total Issues</th>
                  <th className="px-4 py-3.5">Severity Breakdown</th>
                  <th className="px-4 py-3.5">Scanned Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-nvidia-green" />
                        <span>{scan.repoName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs mt-0.5">
                        {scan.repoUrl}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> {scan.status}
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
                        {scan.stats?.low > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">
                            {scan.stats.low} Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-[11px] font-mono">
                      {scan.createdAt ? new Date(scan.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/analysis/${scan.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-border transition"
                      >
                        <span>Reopen Audit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
