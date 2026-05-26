import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, AlertTriangle, Info, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import SeverityBadge from '../components/SeverityBadge';
import { formatDate } from '../lib/utils';

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts', severityFilter],
    queryFn: () => api.get('/alerts', { params: { severity: severityFilter || undefined } }) as any,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/alerts/mark-all-read') as any,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-count'] });
    },
  });

  const markRead = useMutation({
    mutationFn: (alertId: string) => api.patch(`/alerts/${alertId}/read`) as any,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-count'] });
    },
  });

  if (isLoading) return <LoadingState message="Loading alerts..." />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const alerts = data?.data?.alerts || [];
  const unreadCount = data?.data?.unreadCount || 0;

  const severityIcon = (severity: string) => {
    if (severity === 'HIGH') return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (severity === 'MEDIUM') return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    return <Info className="w-5 h-5 text-sky-400" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {unreadCount > 0 ? `${unreadCount} unread alert(s)` : 'All caught up!'}
        </p>
        <div className="flex gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">All Severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/[0.04] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          title="No alerts"
          message="All clear! Your products are looking good."
          icon={<Bell className="w-8 h-8 text-emerald-400" />}
        />
      ) : (
        <div className="space-y-2">
          {alerts.map((alert: any, i: number) => (
            <div
              key={alert.id}
              className={`card p-5 transition-all duration-200 hover:border-white/[0.1] animate-slide-up ${
                !alert.isRead ? 'border-indigo-500/20' : ''
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.severity === 'HIGH' ? 'bg-red-500/10' : alert.severity === 'MEDIUM' ? 'bg-amber-500/10' : 'bg-sky-500/10'
                }`}>
                  {severityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${alert.isRead ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>
                    {alert.message}
                  </p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-[11px] text-gray-600">{formatDate(alert.createdAt)}</span>
                    {alert.product && (
                      <Link to={`/products/${alert.product.skuId}`} className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-medium hover:text-indigo-300">
                        <LinkIcon className="w-3 h-3" />
                        {alert.product.skuId}
                      </Link>
                    )}
                  </div>
                </div>
                {!alert.isRead && (
                  <button
                    onClick={() => markRead.mutate(alert.id)}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
