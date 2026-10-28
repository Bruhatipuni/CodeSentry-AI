import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Cpu,
  Layers,
  History,
  Settings,
  Github,
  Zap,
} from 'lucide-react';
import apiClient from '../services/api';

export default function Navbar() {
  const location = useLocation();
  const [configStatus, setConfigStatus] = useState(null);

  useEffect(() => {
    apiClient
      .getConfigStatus()
      .then((data) => setConfigStatus(data))
      .catch(() => {});
  }, []);

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: Layers },
    { label: 'Analyzer', path: '/analyzer', icon: Cpu },
    { label: 'History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-nvidia-green to-emerald-600 text-slate-950 font-bold shadow-md shadow-nvidia-green/20 group-hover:scale-105 transition">
              <Shield className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                CodeSentry <span className="text-nvidia-green">AI</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                Autonomous Code Agent
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    isActive
                      ? 'bg-slate-800 text-nvidia-green font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side status pill & CTA */}
        <div className="flex items-center gap-3">
          {/* Nebius connection status badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              configStatus?.configured
                ? 'bg-nvidia-green/10 text-nvidia-green border-nvidia-green/30'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
            }`}
            title={
              configStatus?.configured
                ? `Inference: ${configStatus?.model}`
                : 'Nebius API key not set in environment. Running static analysis and demo mode.'
            }
          >
            <Zap className={`w-3 h-3 ${configStatus?.configured ? 'fill-nvidia-green' : ''}`} />
            <span>
              {configStatus?.configured ? 'Nemotron Active' : 'Static Mode'}
            </span>
          </div>

          <Link
            to="/analyzer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 transition shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5 fill-slate-950" />
            <span>Scan Repo</span>
          </Link>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
