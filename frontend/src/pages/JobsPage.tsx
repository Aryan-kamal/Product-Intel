import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, FileVideo, FileSpreadsheet, XCircle, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../lib/utils';

export default function JobsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs') as any,
    refetchInterval: 5000,
  });

  if (isLoading) return <LoadingState message="Loading jobs..." />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const jobs = data?.data || [];

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No jobs yet"
        message="Upload a product video or CSV to start processing."
        action={
          <Link to="/upload" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all">
            Go to Upload <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 mt-1">{jobs.length} job(s) total</p>
        </div>
        <Link to="/upload" className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all">
          New Upload
        </Link>
      </div>

      <div className="space-y-3">
        {jobs.map((job: any, i: number) => (
          <div
            key={job.id}
            className="card p-5 hover:border-white/[0.1] transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  job.type === 'VIDEO' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'
                }`}>
                  {job.type === 'VIDEO' ? <FileVideo className="w-5 h-5 text-purple-400" /> : <FileSpreadsheet className="w-5 h-5 text-emerald-400" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-200">{job.fileName || `${job.type} Job`}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(job.createdAt)}
                  </p>
                </div>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="relative w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  job.status === 'FAILED' ? 'bg-red-500' :
                  job.status === 'COMPLETED' ? 'bg-emerald-500' :
                  job.status === 'RUNNING' ? 'bg-indigo-500 progress-striped' :
                  'bg-gray-600'
                }`}
                style={{ width: `${job.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 font-medium">{job.progress}% complete</span>
              <div className="flex items-center gap-3">
                {job._count?.products > 0 && (
                  <span className="text-xs text-gray-500">{job._count.products} product(s)</span>
                )}
                {job.status === 'COMPLETED' && (
                  <Link to="/products" className="text-xs text-indigo-400 font-medium hover:text-indigo-300 flex items-center gap-1">
                    View products <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {job.errorMessage && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{job.errorMessage}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
