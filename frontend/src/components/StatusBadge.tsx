import { cn } from '../lib/utils';
import { CheckCircle2, Clock, Loader2, XCircle, AlertTriangle } from 'lucide-react';

const statusConfig: Record<string, { classes: string; icon: any }> = {
  PENDING: { classes: 'bg-slate-500/10 text-slate-400 ring-slate-500/20', icon: Clock },
  RUNNING: { classes: 'bg-blue-500/10 text-blue-400 ring-blue-500/20', icon: Loader2 },
  COMPLETED: { classes: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', icon: CheckCircle2 },
  FAILED: { classes: 'bg-red-500/10 text-red-400 ring-red-500/20', icon: XCircle },
  PARTIALLY_COMPLETED: { classes: 'bg-amber-500/10 text-amber-400 ring-amber-500/20', icon: AlertTriangle },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg ring-1 ring-inset', config.classes)}>
      <Icon className={cn('w-3 h-3', status === 'RUNNING' && 'animate-spin')} />
      {status.replace('_', ' ')}
    </span>
  );
}
