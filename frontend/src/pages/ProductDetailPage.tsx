import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw, ArrowLeft, Package, AlertTriangle, TrendingDown, Zap, CheckCircle2, Tag, Loader2, ShoppingBag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../lib/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import SeverityBadge from '../components/SeverityBadge';
import { formatCurrency } from '../lib/utils';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ProductDetailPage() {
  const { skuId } = useParams<{ skuId: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'title' | 'competitors'>('overview');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['product', skuId],
    queryFn: () => api.get(`/products/${skuId}`) as any,
  });

  const { data: competitorData, refetch: refetchCompetitors, isLoading: competitorsLoading } = useQuery({
    queryKey: ['competitors', skuId],
    queryFn: () => api.get(`/products/${skuId}/competitor-prices`) as any,
    enabled: activeTab === 'competitors',
  });

  const { data: priceHistoryData } = useQuery({
    queryKey: ['price-history', skuId],
    queryFn: () => api.get(`/products/${skuId}/price-history`) as any,
    enabled: activeTab === 'competitors',
  });

  const enhanceMutation = useMutation({
    mutationFn: () => api.post(`/products/${skuId}/enhance-title`) as any,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['product', skuId] }),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const product = data?.data;
  if (!product) return <ErrorState message="Product not found" />;

  const scoreColor = product.qualityScore >= 70 ? 'text-emerald-400' : product.qualityScore >= 40 ? 'text-amber-400' : 'text-red-400';
  const scoreRingColor = product.qualityScore >= 70 ? '#10b981' : product.qualityScore >= 40 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 38;
  const scoreOffset = circumference - (product.qualityScore / 100) * circumference;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'issues', label: `Issues`, count: product.issues?.length || 0, icon: AlertTriangle },
    { id: 'title', label: 'Title', icon: Sparkles },
    { id: 'competitors', label: 'Pricing', icon: TrendingDown },
  ] as const;

  return (
    <div>
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">{product.productTitle || 'Untitled Product'}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono text-gray-500 bg-white/[0.06] px-2 py-0.5 rounded">{product.skuId}</span>
                {product.brand && <span className="text-xs text-gray-400">{product.brand}</span>}
                {product.category && <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{product.category}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {product.price && (
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-100">{formatCurrency(product.price)}</p>
                {product.mrp && product.mrp !== product.price && (
                  <p className="text-xs text-gray-500 line-through">{formatCurrency(product.mrp)}</p>
                )}
              </div>
            )}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                <circle cx="50" cy="50" r="38" fill="none" stroke={scoreRingColor} strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={scoreOffset} className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-bold ${scoreColor}`}>{product.qualityScore}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 card p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {'count' in tab && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-red-500/20 text-red-400'
                }`}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card p-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Product Details</h3>
              <dl className="space-y-3">
                {([
                  ['Brand', product.brand, Tag],
                  ['Category', product.category, Package],
                  ['Price', formatCurrency(product.price), null],
                  ['MRP', formatCurrency(product.mrp), null],
                  ['Color', product.color, null],
                  ['Size', product.size, null],
                  ['Material', product.material, null],
                  ['Availability', product.availability, null],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-1">
                    <dt className="text-sm text-gray-500">{label}</dt>
                    <dd className="text-sm font-medium text-gray-300">
                      {value === 'in_stock' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> In Stock
                        </span>
                      ) : value === 'out_of_stock' ? (
                        <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md text-xs font-semibold">Out of Stock</span>
                      ) : (
                        value || <span className="text-gray-600">—</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="card p-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Description</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{product.description || 'No description available.'}</p>
              {product.imageUrl && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Image</h4>
                  <img src={product.imageUrl} alt={product.productTitle} className="w-full max-h-48 object-cover rounded-xl border border-white/[0.06]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-3">
            {!product.issues?.length ? (
              <div className="card p-12 text-center">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-gray-300">No issues found</p>
                <p className="text-xs text-gray-500 mt-1">This product listing looks good!</p>
              </div>
            ) : (
              product.issues.map((issue: any, i: number) => (
                <div key={issue.id} className="card p-5 hover:border-white/[0.1] transition-all animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${issue.severity === 'HIGH' ? 'text-red-400' : issue.severity === 'MEDIUM' ? 'text-amber-400' : 'text-sky-400'}`} />
                      <span className="text-sm font-semibold text-gray-200">{issue.issueType.replace(/_/g, ' ')}</span>
                    </div>
                    <SeverityBadge severity={issue.severity} showIcon />
                  </div>
                  <p className="text-sm text-gray-400 ml-6">{issue.message}</p>
                  {issue.suggestedFix && (
                    <div className="ml-6 mt-3 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      <p className="text-xs font-medium text-indigo-400">Suggested Fix</p>
                      <p className="text-xs text-indigo-300/70 mt-0.5">{issue.suggestedFix}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'title' && (
          <div className="card p-6">
            {product.enhancedTitle ? (
              <div className="space-y-5">
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Original Title</label>
                  <p className="text-sm text-gray-300 mt-1.5 font-medium">{product.productTitle}</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-xl border border-indigo-500/20">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Enhanced Title</label>
                  <p className="text-sm text-indigo-300 mt-1.5 font-semibold">{product.enhancedTitle}</p>
                </div>
                <button
                  onClick={() => enhanceMutation.mutate()}
                  disabled={enhanceMutation.isPending}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {enhanceMutation.isPending ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-gray-200 mb-1">Generate Enhanced Title</h3>
                <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">Improve your product title with brand, attributes, and trending keywords.</p>
                <button
                  onClick={() => enhanceMutation.mutate()}
                  disabled={enhanceMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-xl hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all"
                >
                  {enhanceMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Title</>}
                </button>
              </div>
            )}
            {enhanceMutation.data != null && <EnhancementDetails data={enhanceMutation.data as any} />}
          </div>
        )}

        {activeTab === 'competitors' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => refetchCompetitors()}
                disabled={competitorsLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${competitorsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {competitorData?.data?.comparison && competitorData.data.competitorPrices?.length > 0 && (
              <div className="card p-6 mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Price Comparison</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <PriceBox label="Our Price (Flipkart)" value={formatCurrency(competitorData.data.ourPrice)} accent="indigo" />
                  <PriceBox label="Lowest Competitor" value={formatCurrency(competitorData.data.comparison.lowestPrice)} accent="emerald" />
                  <PriceBox label="Highest Competitor" value={formatCurrency(competitorData.data.comparison.highestPrice)} accent="red" />
                  <PriceBox label="Average" value={formatCurrency(competitorData.data.comparison.averagePrice)} accent="amber" />
                  <PriceBox
                    label="Price Gap"
                    value={competitorData.data.comparison.priceGap !== null
                      ? `${competitorData.data.comparison.priceGap > 0 ? '+' : ''}${formatCurrency(competitorData.data.comparison.priceGap)}`
                      : '—'
                    }
                    accent={competitorData.data.comparison.priceGap > 0 ? 'red' : 'emerald'}
                  />
                </div>
                <div className={`mt-4 p-4 rounded-xl border ${
                  competitorData.data.comparison.priceGap > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  <p className={`text-sm font-semibold ${competitorData.data.comparison.priceGap > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                    {competitorData.data.comparison.recommendation}
                  </p>
                </div>
              </div>
            )}

            {priceHistoryData?.data?.history?.length > 0 && (
              <div className="card p-6 mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Price History Chart</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistoryData.data.history} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#374151' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#374151' }} tickFormatter={(v: number) => `₹${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
                        labelStyle={{ color: '#9ca3af' }}
                        formatter={(value: number) => [`₹${value}`, undefined]}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="ourPrice" name="Our Price" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
                      {priceHistoryData.data.platforms.map((platform: string, i: number) => (
                        <Line key={platform} type="monotone" dataKey={platform} name={platform} stroke={CHART_COLORS[(i + 1) % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {competitorData?.data?.competitorPrices?.length > 0 ? (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left px-5 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                      <th className="text-right px-5 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="text-right px-5 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                      <th className="text-left px-5 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Last Checked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {competitorData.data.competitorPrices.map((cp: any) => {
                      const diff = competitorData.data.ourPrice ? cp.competitorPrice - competitorData.data.ourPrice : 0;
                      return (
                        <tr key={cp.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5 font-medium text-gray-200">{cp.platform}</td>
                          <td className="px-5 py-3.5 text-right font-semibold text-gray-200">{formatCurrency(cp.competitorPrice)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`text-xs font-semibold ${diff < 0 ? 'text-red-400' : diff > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                              {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(cp.lastCheckedAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingDown className="w-7 h-7 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-300 mb-1">No competitor prices</p>
                <p className="text-xs text-gray-500 mb-4">Upload a competitor CSV or refresh prices to see comparisons.</p>
                <Link to="/competitor-pricing" className="text-sm text-indigo-400 font-medium hover:text-indigo-300">Go to Competitor Pricing</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PriceBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    red: 'bg-red-500/10 border-red-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
  };
  const textColors: Record<string, string> = {
    indigo: 'text-indigo-300',
    emerald: 'text-emerald-300',
    red: 'text-red-300',
    amber: 'text-amber-300',
  };
  return (
    <div className={`p-3 rounded-xl border ${colors[accent] || colors.indigo}`}>
      <p className="text-[10px] font-semibold text-gray-500 uppercase">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${textColors[accent] || 'text-gray-200'}`}>{value}</p>
    </div>
  );
}

function EnhancementDetails({ data }: { data: any }) {
  const d = data?.data || data;
  return (
    <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-4 animate-slide-up">
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Extracted Attributes</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(d?.attributes || {}).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.06] rounded-lg text-xs font-medium text-gray-300">
              <span className="text-gray-500">{k}:</span> {String(v)}
            </span>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Suggested Keywords</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {(d?.keywords || []).map((kw: string) => (
            <span key={kw} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-medium">{kw}</span>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reason</label>
        <p className="text-sm text-gray-400 mt-1">{d?.reason}</p>
      </div>
    </div>
  );
}
