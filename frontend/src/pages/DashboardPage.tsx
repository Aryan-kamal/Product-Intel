import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Package, AlertTriangle, TrendingUp, ImageOff, ShieldAlert, DollarSign, ArrowRight, Download } from 'lucide-react';
import api from '../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { Link } from 'react-router-dom';

const SEVERITY_COLORS: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#3b82f6' };

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/quality-summary') as any,
  });

  if (isLoading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  const d = data?.data;
  if (!d || d.totalProducts === 0) {
    return (
      <EmptyState
        title="No products to analyze"
        message="Upload product data to see quality metrics and insights."
        action={
          <Link to="/upload" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">
            Upload Products <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />
    );
  }

  const severityData = [
    { name: 'High', value: d.issuesBySeverity.HIGH, color: SEVERITY_COLORS.HIGH },
    { name: 'Medium', value: d.issuesBySeverity.MEDIUM, color: SEVERITY_COLORS.MEDIUM },
    { name: 'Low', value: d.issuesBySeverity.LOW, color: SEVERITY_COLORS.LOW },
  ].filter(s => s.value > 0);

  const issueChartData = (d.issuesByType || []).slice(0, 8).map((i: any) => ({
    name: i.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    count: i.count,
  }));

  const scoreColor = d.averageQualityScore >= 70 ? 'text-emerald-400' : d.averageQualityScore >= 40 ? 'text-amber-400' : 'text-red-400';
  const scoreRingColor = d.averageQualityScore >= 70 ? '#10b981' : d.averageQualityScore >= 40 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 42;
  const scoreOffset = circumference - (d.averageQualityScore / 100) * circumference;

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`${API_BASE}/dashboard/quality-report`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quality-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Download className="w-4 h-4" />
          Download Quality Report
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        <StatCard icon={Package} label="Total Products" value={d.totalProducts} gradient="from-indigo-500 to-indigo-600" />
        <StatCard icon={AlertTriangle} label="Weak Listings" value={d.weakListings} gradient="from-red-500 to-rose-600" subtitle="Score ≤ 50" />
        <StatCard icon={ImageOff} label="Missing Images" value={d.missingImageCount} gradient="from-amber-500 to-orange-500" />
        <StatCard icon={DollarSign} label="Invalid Prices" value={d.invalidPriceCount} gradient="from-purple-500 to-purple-600" />
        <StatCard icon={ShieldAlert} label="High Issues" value={d.issuesBySeverity.HIGH} gradient="from-red-600 to-red-700" />
        <StatCard icon={Package} label="Out of Stock" value={d.outOfStockCount} gradient="from-slate-500 to-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="card p-6 flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 self-start">Avg Quality Score</h3>
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={scoreRingColor} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={scoreOffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${scoreColor}`}>{d.averageQualityScore}</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">out of 100</p>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Issues by Type</h3>
          {issueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={issueChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis type="category" dataKey="name" width={130} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#e5e7eb' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 6, 6, 0]} barSize={18}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-600 text-center py-12">No issues detected</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Severity Distribution</h3>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#e5e7eb' }} />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value: string) => <span className="text-xs text-gray-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-600 text-center py-12">No issues detected</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="space-y-2.5">
            <Link to="/products?severity=HIGH" className="flex items-center justify-between p-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-300">Fix High-Severity Issues</p>
                  <p className="text-xs text-red-400/70">{d.issuesBySeverity.HIGH} issue(s) need attention</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-red-500/50 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/products" className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-300">View All Products</p>
                  <p className="text-xs text-indigo-400/70">{d.totalProducts} product(s) processed</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-500/50 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/competitor-pricing" className="flex items-center justify-between p-3.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/15 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-violet-300">Competitor Pricing</p>
                  <p className="text-xs text-violet-400/70">Compare and analyze market prices</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-violet-500/50 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient, subtitle }: any) {
  return (
    <div className="card p-4 hover:border-white/[0.1] transition-colors">
      <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {subtitle && <p className="text-[10px] text-gray-600">{subtitle}</p>}
    </div>
  );
}
