import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter, ExternalLink } from 'lucide-react';
import api from '../lib/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import SeverityBadge from '../components/SeverityBadge';
import { formatCurrency } from '../lib/utils';

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState(searchParams.get('severity') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const limit = 10;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', page, search, severity, sortBy, sortOrder],
    queryFn: () => api.get('/products', { params: { page, limit, search, severity: severity || undefined, sortBy, sortOrder } }) as any,
  });

  if (isLoading) return <LoadingState message="Loading products..." />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || { total: 0, totalPages: 0 };

  function getScoreBar(score: number) {
    const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
    return (
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-xs font-bold ${score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
          {score}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{pagination.total} product(s) total</p>
        <Link to="/upload" className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
          Upload More
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by title, SKU, or brand..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-600" />
            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">All Severities</option>
              <option value="HIGH">High Issues</option>
              <option value="MEDIUM">Medium Issues</option>
              <option value="LOW">Low Issues</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-600" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="qualityScore-asc">Lowest Score</option>
              <option value="qualityScore-desc">Highest Score</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title="No products found"
            message={search || severity ? 'Try adjusting your filters.' : 'Upload a video or CSV to get started.'}
            action={<Link to="/upload" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Upload Products</Link>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Product</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Brand</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Category</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Price</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Quality</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-[10px] uppercase tracking-wider">Issues</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {products.map((p: any) => {
                    const highSeverity = p.issues?.find((i: any) => i.severity === 'HIGH');
                    const issueCount = p.issues?.length || 0;
                    return (
                      <tr key={p.skuId} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-4">
                          <Link to={`/products/${p.skuId}`} className="font-medium text-gray-200 hover:text-indigo-400 transition-colors">
                            {p.productTitle || 'Untitled'}
                          </Link>
                          <p className="text-[11px] text-gray-600 mt-0.5 font-mono">{p.skuId}</p>
                        </td>
                        <td className="px-5 py-4">
                          {p.brand ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] text-xs font-medium text-gray-400">{p.brand}</span>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{p.category || '—'}</td>
                        <td className="px-5 py-4 text-right font-medium text-gray-200">{formatCurrency(p.price)}</td>
                        <td className="px-5 py-4">{getScoreBar(p.qualityScore)}</td>
                        <td className="px-5 py-4">
                          {issueCount > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <SeverityBadge severity={highSeverity?.severity || p.issues?.[0]?.severity || 'LOW'} />
                              {issueCount > 1 && <span className="text-[10px] text-gray-500">+{issueCount - 1}</span>}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-medium">Clean</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            to={`/products/${p.skuId}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs text-indigo-400 font-medium"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
              <p className="text-xs text-gray-500">
                Showing <span className="font-medium text-gray-400">{(page - 1) * limit + 1}</span> to <span className="font-medium text-gray-400">{Math.min(page * limit, pagination.total)}</span> of <span className="font-medium text-gray-400">{pagination.total}</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 border border-white/[0.06] rounded-lg disabled:opacity-30 hover:bg-white/[0.04] transition-colors text-gray-400">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                      p === page ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/[0.04] border border-white/[0.06]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="p-2 border border-white/[0.06] rounded-lg disabled:opacity-30 hover:bg-white/[0.04] transition-colors text-gray-400">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
