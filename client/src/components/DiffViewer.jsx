import React, { useState } from 'react';
import { Download, Check, X, ShieldCheck, FileCode, Split, AlignJustify } from 'lucide-react';

export default function DiffViewer({
  fix,
  onApprove,
  onReject,
  onValidate,
  isApproved = false,
  isValidating = false,
}) {
  const [viewMode, setViewMode] = useState('unified'); // 'unified' | 'side-by-side'

  if (!fix) return null;

  const handleDownloadPatch = () => {
    const patchContent = fix.unifiedDiff || `--- Original\n+++ Proposed\n-${fix.originalCode}\n+${fix.proposedCode}`;
    const blob = new Blob([patchContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codesentry-fix-${fix.id || 'patch'}.diff`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const diffLines = fix.unifiedDiff ? fix.unifiedDiff.split('\n') : [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
      {/* Diff Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/80 border-b border-border">
        <div className="flex items-center gap-2.5">
          <FileCode className="w-4 h-4 text-nvidia-green" />
          <span className="font-semibold text-sm text-slate-200">
            AI Proposed Patch
          </span>
          <span className="px-2 py-0.5 text-[11px] rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
            NVIDIA Nemotron Proposal
          </span>
          {isApproved && (
            <span className="px-2 py-0.5 text-[11px] rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <Check className="w-3 h-3" /> Approved by User
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-border text-xs">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
                viewMode === 'unified' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlignJustify className="w-3.5 h-3.5" /> Unified
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
                viewMode === 'side-by-side' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Split className="w-3.5 h-3.5" /> Side-by-Side
            </button>
          </div>

          <button
            onClick={handleDownloadPatch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-border transition"
            title="Download unified .diff file"
          >
            <Download className="w-3.5 h-3.5" /> Download .diff
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      {fix.explanation && (
        <div className="px-5 py-3 bg-indigo-950/20 border-b border-border text-xs text-indigo-200 leading-relaxed">
          <span className="font-semibold text-indigo-400">Rationale: </span>
          {fix.explanation}
        </div>
      )}

      {/* Diff Content View */}
      <div className="p-4 bg-[#080c14] font-mono text-xs overflow-x-auto max-h-[500px]">
        {viewMode === 'unified' ? (
          <div className="space-y-0.5">
            {diffLines.map((line, idx) => {
              let lineStyle = 'text-slate-300';
              let bg = '';
              let prefix = line[0] || ' ';

              if (line.startsWith('---') || line.startsWith('+++')) {
                lineStyle = 'text-slate-500 font-semibold';
              } else if (line.startsWith('@@')) {
                lineStyle = 'text-cyan-400 font-semibold bg-cyan-950/30';
              } else if (line.startsWith('+')) {
                lineStyle = 'text-emerald-300 bg-emerald-950/30 border-l-2 border-emerald-500 pl-2';
              } else if (line.startsWith('-')) {
                lineStyle = 'text-red-300 bg-red-950/30 border-l-2 border-red-500 pl-2';
              }

              return (
                <div key={idx} className={`py-0.5 px-2 rounded font-mono ${lineStyle} ${bg}`}>
                  <span className="whitespace-pre">{line}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>Original Code</span>
              </div>
              <div className="p-3 rounded bg-red-950/15 border border-red-900/40 text-red-200 whitespace-pre overflow-x-auto">
                {fix.originalCode || '(empty)'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>Proposed Fix</span>
              </div>
              <div className="p-3 rounded bg-emerald-950/15 border border-emerald-900/40 text-emerald-200 whitespace-pre overflow-x-auto">
                {fix.proposedCode || '(empty)'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Potential Side Effects Note */}
      {fix.potentialSideEffects && (
        <div className="px-5 py-2.5 bg-slate-900/40 border-t border-border text-[11px] text-slate-400">
          <span className="font-semibold text-amber-400">Considerations: </span>
          {fix.potentialSideEffects}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 border-t border-border">
        <div className="text-xs text-slate-400">
          Proposal status: <span className="text-slate-200 font-medium">{isApproved ? 'Approved by Engineer' : 'Pending Approval'}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {onReject && (
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-3.5 h-3.5 text-slate-400" /> Reject
            </button>
          )}

          {onApprove && !isApproved && (
            <button
              onClick={onApprove}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow"
            >
              <Check className="w-3.5 h-3.5" /> Approve Fix
            </button>
          )}

          {onValidate && (
            <button
              onClick={onValidate}
              disabled={isValidating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold transition shadow disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
              {isValidating ? 'Validating in Sandbox...' : 'Validate in Sandbox'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
