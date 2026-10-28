import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  LayoutDashboard,
  Cpu,
  History,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import apiClient from '../services/api';

export default function DashboardLayout() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiClient
      .getOverviewStats()
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analyzer', label: 'Analyze Repo', icon: Cpu },
    { to: '/history', label: 'Scan History', icon: History },
    { to: '/settings', label: 'Settings & Model', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar */}
        <aside className="w-full md:w-60 shrink-0 space-y-6">
          <nav className="p-3 bg-card border border-border rounded-2xl space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Agent Cockpit
            </div>
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? 'bg-slate-800/90 text-nvidia-green font-semibold border border-slate-700/60 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Metrics Widget */}
          {stats && (
            <div className="p-4 bg-card/60 border border-border rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-nvidia-green" /> Total Audited
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {stats.totalScans}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/60">
                <div className="p-2 rounded-lg bg-red-950/20 border border-red-900/30">
                  <span className="block text-red-400 text-[10px]">Critical</span>
                  <span className="font-bold text-red-300 font-mono text-sm">
                    {stats.criticalIssues}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                  <span className="block text-emerald-400 text-[10px]">Validated</span>
                  <span className="font-bold text-emerald-300 font-mono text-sm">
                    {stats.fixesValidated}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Infrastructure attribution card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-border/80 text-[11px] space-y-2">
            <div className="flex items-center gap-2 text-nvidia-green font-semibold">
              <Zap className="w-3.5 h-3.5 fill-nvidia-green" /> Accelerated AI
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Powered by NVIDIA Nemotron open-source LLMs hosted on Nebius Token Factory hyperscale cloud.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}
