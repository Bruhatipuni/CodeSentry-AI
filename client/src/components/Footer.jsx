import React from 'react';
import { Shield, ExternalLink, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-[#070b13] py-10 mt-20 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-nvidia-green/10 text-nvidia-green border border-nvidia-green/30">
              <Shield className="w-4 h-4 fill-nvidia-green/20" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">
                CodeSentry AI — Autonomous Coding Agent
              </p>
              <p className="text-[11px] text-slate-500">
                Automated code inspection, patch generation, and isolated sandbox validation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-nvidia-green" /> NVIDIA Nemotron-70B
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-nebius-blue" /> Nebius Token Factory
            </span>
            <span className="text-slate-500">
              Local Sandboxed Test Runner
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} CodeSentry AI. Open-source under MIT License.</p>
          <p>AI-assisted review tool. Code fixes require human approval before applying.</p>
        </div>
      </div>
    </footer>
  );
}
