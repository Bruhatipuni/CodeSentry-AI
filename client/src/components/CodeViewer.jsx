import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeViewer({
  code = '',
  language = 'javascript',
  highlightStart = null,
  highlightEnd = null,
  startLineNumber = 1,
  maxHeight = '450px',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code ? code.split('\n') : [];

  return (
    <div className="relative rounded-lg border border-border bg-[#0b101b] font-mono text-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/70 border-b border-border text-slate-400">
        <span className="uppercase tracking-wider font-semibold text-[11px] text-slate-300">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div
        className="overflow-auto p-4 select-text font-mono"
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = startLineNumber + idx;
              const isHighlighted =
                highlightStart !== null &&
                lineNum >= highlightStart &&
                lineNum <= (highlightEnd || highlightStart);

              return (
                <tr
                  key={idx}
                  className={`${
                    isHighlighted
                      ? 'bg-red-500/15 border-l-2 border-red-500 text-red-100 font-medium'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="w-12 text-right pr-4 text-slate-600 select-none font-mono py-0.5">
                    {lineNum}
                  </td>
                  <td className="whitespace-pre text-slate-200 py-0.5 pl-2 font-mono">
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
