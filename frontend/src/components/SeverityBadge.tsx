import { cn } from '../lib/utils';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

const severityConfig = {
  HIGH: { bg: 'bg-red-500/10 text-red-400 ring-red-500/20', icon: AlertCircle },
  MEDIUM: { bg: 'bg-amber-500/10 text-amber-400 ring-amber-500/20', icon: AlertTriangle },
  LOW: { bg: 'bg-sky-500/10 text-sky-400 ring-sky-500/20', icon: Info },
};

export default function SeverityBadge({ severity, showIcon = false }: { severity: 'HIGH' | 'MEDIUM' | 'LOW'; showIcon?: boolean }) {
  const config = severityConfig[severity];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md ring-1 ring-inset', config.bg)}>
      {showIcon && <Icon className="w-3 h-3" />}
      {severity}
    </span>
  );
}
