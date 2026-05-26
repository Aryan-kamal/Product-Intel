import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Upload, FileSpreadsheet, CheckCircle2, Loader2, BarChart3, X, TrendingDown, TrendingUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../lib/utils';

export default function CompetitorPricingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['all-competitor-prices'],
    queryFn: () => api.get('/competitor-prices/all') as any,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      const formData = new FormData();
      formData.append('csv', file);
      return api.post('/competitor-prices/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as any;
    },
    onSuccess: (res: any) => {
      setMessage({ type: 'success', text: res?.data?.message || 'Competitor prices uploaded!' });
      setFile(null);
      invalidateAll();
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message }),
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.post('/competitor-prices/refresh') as any,
    onSuccess: (res: any) => {
      setMessage({ type: 'success', text: res?.data?.message || 'Prices refreshed!' });
      invalidateAll();
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message }),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['all-competitor-prices'] });
    queryClient.invalidateQueries({ queryKey: ['competitors'] });
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    queryClient.invalidateQueries({ queryKey: ['alert-count'] });
  }

  const products: any[] = data?.data || [];
  const productsWithPrices = products.filter((p: any) => p.competitorPrices?.length > 0);

  return (
    <div>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 text-violet-400 text-xs font-semibold rounded-full mb-3 border border-violet-500/20">
          <BarChart3 className="w-3 h-3" />
          COMPETITOR PRICING
        </div>
        <p className="text-sm text-gray-500 mt-1">Upload competitor prices or generate mock data, then compare across all products.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 animate-slide-up ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <X className="w-5 h-5 text-red-400 shrink-0" />}
          <p className={`text-sm font-medium flex-1 ${message.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>{message.text}</p>
          <button onClick={() => setMessage(null)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-200 text-sm">Upload Competitor Price CSV</h3>
              <p className="text-[11px] text-gray-500">Format: sku_id, product_name, platform, competitor_url, competitor_price, currency, last_checked_at</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex-1 flex items-center gap-3 border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all ${
                file ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.08] hover:border-indigo-500/30 hover:bg-white/[0.02]'
              }`}
            >
              {file ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-200 truncate">{file.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-[10px] text-gray-500 hover:text-red-400">Remove</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-gray-600 shrink-0" />
                  <p className="text-xs text-gray-500">Drop CSV or <span className="text-indigo-400">browse</span></p>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <button
              onClick={() => uploadMutation.mutate()}
              disabled={!file || uploadMutation.isPending}
              className="shrink-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-xl hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </button>
          </div>
        </div>

        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-200 text-sm">Refresh Prices</h3>
              <p className="text-[11px] text-gray-500">Generate mock competitor data</p>
            </div>
          </div>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all"
          >
            {refreshMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><RefreshCw className="w-4 h-4" /> Generate Mock Prices</>}
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-200">All Products — Price Comparison</h2>
        <span className="text-xs text-gray-500">{productsWithPrices.length} of {products.length} products have competitor data</span>
      </div>

      {isLoading ? (
        <LoadingState message="Loading price comparisons..." />
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : productsWithPrices.length === 0 ? (
        <EmptyState
          title="No competitor prices yet"
          message="Upload a competitor price CSV or click 'Generate Mock Prices' above to get started."
        />
      ) : (
        <div className="space-y-3">
          {productsWithPrices.map((product: any) => (
            <ProductPriceCard key={product.skuId} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductPriceCard({ product }: { product: any }) {
  const [expanded, setExpanded] = useState(false);
  const c = product.comparison;
  const isOverpriced = c?.priceGap > 0 && c?.percentDiff > 10;
  const isCompetitive = c?.priceGap <= 0;

  return (
    <div className="card overflow-hidden hover:border-white/[0.1] transition-all animate-fade-in">
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isOverpriced ? 'bg-red-500/10' : isCompetitive ? 'bg-emerald-500/10' : 'bg-amber-500/10'
            }`}>
              {isOverpriced ? <TrendingUp className="w-5 h-5 text-red-400" /> : <TrendingDown className="w-5 h-5 text-emerald-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-200 truncate">{product.productTitle || product.skuId}</p>
                {product.brand && <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] rounded text-gray-400 shrink-0">{product.brand}</span>}
              </div>
              <p className="text-[11px] text-gray-500 font-mono">{product.skuId}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Our Price</p>
              <p className="text-sm font-bold text-gray-200">{formatCurrency(product.ourPrice)}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Lowest</p>
              <p className="text-sm font-bold text-emerald-400">{formatCurrency(c?.lowestPrice)}</p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Gap</p>
              <p className={`text-sm font-bold ${c?.priceGap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {c?.priceGap !== null ? `${c.priceGap > 0 ? '+' : ''}${c.percentDiff}%` : '—'}
              </p>
            </div>

            <div className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold hidden lg:block ${
              isOverpriced ? 'bg-red-500/10 text-red-400' : isCompetitive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {isOverpriced ? 'Overpriced' : isCompetitive ? 'Competitive' : 'Moderate'}
            </div>

            <Link
              to={`/products/${product.skuId}`}
              onClick={(e) => e.stopPropagation()}
              className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </div>

        <div className={`mt-3 p-2.5 rounded-xl text-xs font-medium ${
          isOverpriced ? 'bg-red-500/10 text-red-300' : isCompetitive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
        }`}>
          {c?.recommendation || 'No comparison data'}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.04] animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">vs Ours</th>
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Last Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {product.competitorPrices.map((cp: any) => {
                const diff = product.ourPrice ? cp.competitorPrice - product.ourPrice : 0;
                const pct = product.ourPrice ? Math.round((diff / product.ourPrice) * 100) : 0;
                return (
                  <tr key={cp.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5 font-medium text-gray-300">{cp.platform}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-gray-200">{formatCurrency(cp.competitorPrice)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <span className={`text-xs font-semibold ${diff < 0 ? 'text-red-400' : diff > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {diff !== 0 ? `${diff > 0 ? '+' : ''}${pct}% (${formatCurrency(diff)})` : 'Same'}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-500 text-xs">{new Date(cp.lastCheckedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
