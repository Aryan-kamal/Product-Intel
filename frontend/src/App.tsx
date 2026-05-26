import { useState } from 'react';
import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Upload, ListChecks, Package, Bell, BarChart3,
  LogOut, Loader2, ChevronLeft, ChevronRight, Menu, Sun, Moon,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import UploadPage from './pages/UploadPage';
import JobsPage from './pages/JobsPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AlertsPage from './pages/AlertsPage';
import CompetitorPricingPage from './pages/CompetitorPricingPage';
import AuthPage from './pages/AuthPage';
import api from './lib/api';

const sidebarItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/competitor-pricing', icon: BarChart3, label: 'Pricing' },
];

const topNavItems = [
  { to: '/jobs', icon: ListChecks, label: 'Jobs' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
];

export default function App() {
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = theme === 'dark';

  const { data: alertData } = useQuery({
    queryKey: ['alert-count'],
    queryFn: () => api.get('/alerts', { params: { isRead: 'false' } }) as any,
    refetchInterval: 15000,
    enabled: !!user,
  });
  const unreadAlerts = alertData?.data?.unreadCount || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[220px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 ${collapsed ? 'justify-center' : 'gap-3'}`} style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <BarChart3 className="w-[18px] h-[18px] text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <span className="font-bold text-sm leading-tight block" style={{ color: 'var(--text-primary)' }}>Quantacus</span>
              <span className="text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>PRODUCT INTEL</span>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? `bg-indigo-500/10 text-indigo-${isDark ? '400' : '600'}`
                    : `hover:bg-[var(--bg-hover)]`
                } ${collapsed ? 'justify-center' : ''}`
              }
              style={({ isActive }) => ({ color: isActive ? undefined : 'var(--text-secondary)' })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />
                  )}
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span>{label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 pb-4 hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> <span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 h-16 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6"
          style={{ background: isDark ? 'rgba(22,25,33,0.8)' : 'rgba(255,255,255,0.8)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
              {sidebarItems.find(i => i.to === location.pathname)?.label
                || topNavItems.find(i => i.to === location.pathname)?.label
                || 'Product Detail'}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {topNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? isDark ? 'bg-white/[0.08] text-white' : 'bg-indigo-50 text-indigo-700'
                      : ''
                  }`
                }
                style={({ isActive }) => isActive ? {} : { color: 'var(--text-secondary)' }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                {to === '/alerts' && unreadAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center" style={{ boxShadow: `0 0 0 2px var(--bg-surface)` }}>
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </NavLink>
            ))}

            <div className="w-px h-6 mx-2" style={{ background: 'var(--border)' }} />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)' }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-400">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div key={location.pathname} className="animate-fade-in">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:skuId" element={<ProductDetailPage />} />
                <Route path="/competitor-pricing" element={<CompetitorPricingPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
