import React from 'react';
import { AlertCircle, AlertTriangle, Info, ShieldAlert, CheckCircle } from 'lucide-react';

export default function SeverityBadge({ severity, size = 'sm' }) {
  const s = severity?.toLowerCase();

  const configs = {
    critical: {
      bg: 'bg-red-950/60 text-red-400 border-red-800/80',
      icon: ShieldAlert,
      label: 'Critical',
    },
    high: {
      bg: 'bg-orange-950/60 text-orange-400 border-orange-800/80',
      icon: AlertTriangle,
      label: 'High',
    },
    medium: {
      bg: 'bg-amber-950/60 text-amber-400 border-amber-800/80',
      icon: AlertCircle,
      label: 'Medium',
    },
    low: {
      bg: 'bg-blue-950/60 text-blue-400 border-blue-800/80',
      icon: Info,
      label: 'Low',
    },
    validated: {
      bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80',
      icon: CheckCircle,
      label: 'Validated',
    },
  };

  const current = configs[s] || configs.medium;
  const IconComponent = current.icon;
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${current.bg} ${sizeClasses}`}
    >
      <IconComponent className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {current.label}
    </span>
  );
}
