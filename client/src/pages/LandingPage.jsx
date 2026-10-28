import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Shield,
  Cpu,
  Terminal,
  CheckCircle2,
  FileCode,
  ArrowRight,
  Zap,
  Lock,
  GitBranch,
  Play,
  Loader2,
  Sparkles,
} from 'lucide-react';
import apiClient from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleExploreDemo = async () => {
    setLoadingDemo(true);
    try {
      // Trigger sample scan
      const res = await apiClient.startAnalysis({ sampleId: 'demo-ecommerce-api' });
      navigate(`/analysis/${res.scan.id}`);
    } catch (err) {
      console.error('Demo launch error:', err);
      navigate('/analyzer');
    } finally {
      setLoadingDemo(false);
    }
  };

  const workflowSteps = [
    {
      step: '01',
      title: 'Repository Ingestion',
      desc: 'Inspect public GitHub repositories or upload project archives with automated AST language detection and file filtering.',
      icon: GitBranch,
    },
    {
      step: '02',
      title: 'Static & AI Code Audit',
      desc: 'Runs ESLint security rules alongside NVIDIA Nemotron on Nebius Token Factory to detect subtle logic errors and OWASP risks.',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'AI Patch Generation',
      desc: 'Generates minimal, non-breaking code fixes with unified diffs. Changes remain proposals until reviewed by an engineer.',
      icon: FileCode,
    },
    {
      step: '04',
      title: 'Isolated Sandbox Validation',
      desc: 'Generates test suites and executes them inside an isolated, resource-constrained sandbox to verify the fix before merging.',
      icon: Terminal,
    },
  ];

  const features = [
    {
      title: 'NVIDIA Nemotron Inference',
      desc: 'Harnesses NVIDIA Nemotron open-source models hosted on Nebius Token Factory for deep contextual code reasoning.',
      icon: Sparkles,
      color: 'text-nvidia-green',
    },
    {
      title: 'Dual Engine Verification',
      desc: 'Blends deterministic AST/ESLint static analysis with generative AI reasoning to eliminate hallucinations.',
      icon: Shield,
      color: 'text-blue-400',
    },
    {
      title: 'Isolated Test Sandbox',
      desc: 'Runs generated tests inside restricted child processes with strict timeouts and memory constraints. Never executes untrusted code in main backend.',
      icon: Terminal,
      color: 'text-purple-400',
    },
    {
      title: 'Human-in-the-Loop',
      desc: 'No silent code overwrites. Every patch provides interactive diff inspection, side-by-side reviews, and approval buttons.',
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
    {
      title: 'SSRF & Input Guardrails',
      desc: 'Strict host validation prevents Server-Side Request Forgery. Built-in zip-slip protections keep host servers secure.',
      icon: Lock,
      color: 'text-amber-400',
    },
    {
      title: 'Audit Report Export',
      desc: 'Export comprehensive security and quality compliance audit files in JSON format for CI/CD integrations.',
      icon: FileCode,
      color: 'text-cyan-400',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-nvidia-green/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-nebius-blue/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Feature Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-nvidia-green/40 bg-nvidia-green/10 text-nvidia-green text-xs font-semibold shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-nvidia-green" />
            Autonomous AI Software Engineering Agent
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Find Bugs Before They Reach <span className="text-transparent bg-clip-text bg-gradient-to-r from-nvidia-green via-emerald-400 to-cyan-400">Production.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            CodeSentry AI is an autonomous software engineering agent that analyzes source code, detects vulnerabilities, generates minimal patches, and mathematically validates fixes in an isolated sandbox.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/analyzer"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold text-sm transition shadow-lg shadow-nvidia-green/20"
            >
              <Cpu className="w-4 h-4 fill-slate-950" />
              <span>Analyze Repository</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleExploreDemo}
              disabled={loadingDemo}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-card hover:bg-slate-800 text-slate-200 border border-border font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              {loadingDemo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-nvidia-green" />
                  <span>Loading Demo Fixture...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-300" />
                  <span>Explore Demo</span>
                </>
              )}
            </button>
          </div>

          {/* Quick stats banner */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-card/60 border border-border">
              <span className="block text-2xl font-bold font-mono text-white">100%</span>
              <span className="text-xs text-slate-400">Isolated Sandboxing</span>
            </div>
            <div className="p-4 rounded-xl bg-card/60 border border-border">
              <span className="block text-2xl font-bold font-mono text-nvidia-green">Nemotron-70B</span>
              <span className="text-xs text-slate-400">NVIDIA Open Model</span>
            </div>
            <div className="p-4 rounded-xl bg-card/60 border border-border">
              <span className="block text-2xl font-bold font-mono text-cyan-400">Token Factory</span>
              <span className="text-xs text-slate-400">Nebius Hyperscale API</span>
            </div>
            <div className="p-4 rounded-xl bg-card/60 border border-border">
              <span className="block text-2xl font-bold font-mono text-emerald-400">Zero Trust</span>
              <span className="text-xs text-slate-400">Human Approval Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Workflow Stepper */}
      <section className="py-20 border-t border-border bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-nvidia-green">
              Deterministic Agent Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              How CodeSentry AI Audits Code
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              A closed-loop, verifiable pipeline combining static analysis, LLM inference, and genuine unit test execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="relative p-6 rounded-2xl bg-card border border-border space-y-3 group hover:border-nvidia-green/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-nvidia-green transition">
                      {step.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-800/80 text-nvidia-green border border-border">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-cyan-400">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Built for Modern Software Engineering
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Engineered to meet real-world DevOps, security, and developer productivity demands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-card border border-border space-y-3 hover:border-slate-700 transition"
                >
                  <div className={`p-2.5 w-fit rounded-xl bg-slate-800 border border-border ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-100">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 border-t border-border bg-gradient-to-b from-card to-background">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Ready to audit your repository?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Scan public GitHub repositories or test our pre-packaged vulnerable microservice fixtures in one click.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/analyzer"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-nvidia-green to-emerald-600 hover:opacity-90 text-slate-950 font-bold text-xs transition shadow-md"
            >
              Start Free Analysis
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
