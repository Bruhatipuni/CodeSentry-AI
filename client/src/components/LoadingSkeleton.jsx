import React from 'react';

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-6 w-6 bg-slate-800 rounded-full" />
      </div>
      <div className="h-8 bg-slate-800 rounded w-1/2" />
      <div className="h-3 bg-slate-800 rounded w-3/4" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border animate-pulse space-x-4">
      <div className="h-4 bg-slate-800 rounded w-1/4" />
      <div className="h-4 bg-slate-800 rounded w-1/6" />
      <div className="h-4 bg-slate-800 rounded w-1/6" />
      <div className="h-6 bg-slate-800 rounded-full w-16" />
    </div>
  );
}

export function CodeSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-[#0b101b] p-4 animate-pulse space-y-2">
      <div className="h-3 bg-slate-800 rounded w-full" />
      <div className="h-3 bg-slate-800 rounded w-5/6" />
      <div className="h-3 bg-slate-800 rounded w-4/6" />
      <div className="h-3 bg-slate-800 rounded w-full" />
      <div className="h-3 bg-slate-800 rounded w-2/3" />
    </div>
  );
}
