import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, Image, MessageSquare, Heart, ShoppingBag, Lock,
  TrendingUp, Activity, Eye, RefreshCw, AlertCircle, CheckCircle2,
  Loader2, Shield, LogOut, Home, BarChart2,
  UserCheck, UserPlus, Palette, MessageCircle, Clock,
  DollarSign, Package, Zap, Tag, Check, X
} from 'lucide-react';
import { db } from '../services/db';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';
import { verificationDb, VerificationRequest } from '../services/verification';
import { VerifiedArtistBadge } from '../components/VerifiedArtistBadge';

interface AdminMetrics {
  total_users: number; new_users_7d: number; new_users_30d: number;
  artists_count: number; art_lovers_count: number;
  total_artworks: number; artworks_7d: number;
  artists_with_artwork: number; avg_artworks_per_artist: number;
  total_posts: number; posts_7d: number;
  total_likes: number; total_comments: number;
  total_conversations: number; conversations_7d: number;
  total_messages: number; messages_7d: number;
  artworks_with_price: number; artworks_price_visible: number;
  artworks_listed_for_sale: number; artworks_status_active: number; artworks_status_sold: number;
}

interface KpiCardProps {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string;
  trend?: { value: number; label: string };
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon, accent, trend }) => (
  <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow" style={{ borderTop: `3px solid ${accent}` }}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">{label}</span>
      <span style={{ color: accent }} className="opacity-70">{icon}</span>
    </div>
    <span className="text-3xl font-black text-gray-900 tabular-nums leading-none">{value}</span>
    <div className="flex items-center justify-between">
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
      {trend && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend.value > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
          {trend.value > 0 ? '↑' : '–'} {trend.label}
        </span>
      )}
    </div>
  </div>
);

const StatRow: React.FC<{ label: string; value: string | number; accent?: string }> = ({ label, value, accent }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="text-sm font-bold text-gray-900 tabular-nums" style={accent ? { color: accent } : {}}>{value}</span>
  </div>
);

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; description?: string }> = ({ title, icon, description }) => (
  <div className="flex items-start gap-2 mb-5">
    <span className="text-purple-500 mt-0.5">{icon}</span>
    <div>
      <h2 className="text-sm font-bold tracking-widest uppercase text-gray-500">{title}</h2>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
  </div>
);

const LiveDot: React.FC<{ live: boolean }> = ({ live }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${live ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
    {live ? 'Live' : 'Connecting…'}
  </span>
);

export default function Admin() {
  const { currentUser, setCurrentUser } = useUser();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  // Verification requests
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [verifTab, setVerifTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [verifLoading, setVerifLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadVerifications = useCallback(async (status: 'pending' | 'approved' | 'rejected') => {
    setVerifLoading(true);
    try {
      const reqs = await verificationDb.getAll(status);
      setVerificationRequests(reqs);
    } catch (e: any) {
      console.error('loadVerifications error:', e?.message || e);
      setVerificationRequests([]);
    } finally {
      setVerifLoading(false);
    }
  }, []);

  useEffect(() => { loadVerifications(verifTab); }, [verifTab, loadVerifications]);

  const loadMetrics = useCallback(async (silent = false) => {
    if (!silent) setMetricsLoading(true);
    setMetricsError('');
    try {
      const data = await db.admin.getMetrics();
      setMetrics(data as AdminMetrics);
      setLastUpdated(new Date());
    } catch (e: any) {
      setMetricsError(e.message || 'Failed to load metrics.');
    } finally {
      if (!silent) setMetricsLoading(false);
    }
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  // Real-time subscriptions
  useEffect(() => {
    const tables = ['profiles', 'artworks', 'social_posts', 'likes', 'social_comments', 'conversations', 'messages'];
    let liveCount = 0;

    const channels = tables.map(table =>
      supabase
        .channel(`admin_rt_${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => loadMetrics(true))
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') { liveCount++; if (liveCount >= tables.length) setIsLive(true); }
        })
    );

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
      setIsLive(false);
    };
  }, [loadMetrics]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);
    if (!currentUser?.email) { setPwError('Cannot determine your email.'); return; }
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match.'); return; }
    if (newPassword.length < 10) { setPwError('New password must be at least 10 characters.'); return; }
    if (newPassword === currentPassword) { setPwError('New password must differ from current password.'); return; }
    setPwLoading(true);
    try {
      await db.admin.changePasswordWithReauth(currentPassword, newPassword, currentUser.email);
      setPwSuccess(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(async () => { await setCurrentUser(null); navigate('/login'); }, 1500);
    } catch (e: any) {
      setPwError(e.message || 'Password change failed.');
    } finally { setPwLoading(false); }
  };

  const handleSignOut = async () => { await setCurrentUser(null); navigate('/'); };

  const artistActivationRate = metrics && metrics.artists_count > 0
    ? Math.round((metrics.artists_with_artwork / metrics.artists_count) * 100) : 0;

  const marketplaceConversionRate = metrics && metrics.total_artworks > 0
    ? Math.round((metrics.artworks_status_sold / metrics.total_artworks) * 100) : 0;

  const engagementRate = metrics && metrics.total_artworks > 0
    ? ((metrics.total_likes + metrics.total_comments) / metrics.total_artworks).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              <Shield className="w-3 h-3" /> Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LiveDot live={isLive} />
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
                <Home className="w-4 h-4" /> Home
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden rounded-full">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Title bar */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Platform Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Signed in as <span className="font-semibold text-gray-700">{currentUser?.email}</span>
              {lastUpdated && <span className="ml-2 text-gray-400">· Updated {lastUpdated.toLocaleTimeString()}</span>}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadMetrics()} disabled={metricsLoading} className="gap-2 shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {metricsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-sm text-gray-400">Loading metrics…</p>
          </div>
        ) : metricsError ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Failed to load metrics</p>
              <p className="text-sm text-red-600 mt-1">{metricsError}</p>
            </div>
          </div>
        ) : metrics ? (
          <div className="space-y-12">

            {/* Platform Health */}
            <section>
              <SectionHeader title="Platform Health" icon={<Zap className="w-4 h-4" />} description="Key health indicators at a glance" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl p-5 text-white col-span-2 sm:col-span-1">
                  <p className="text-xs font-bold tracking-widest uppercase opacity-70 mb-3">Total Users</p>
                  <p className="text-4xl font-black tabular-nums">{metrics.total_users}</p>
                  <p className="text-xs opacity-70 mt-2">+{metrics.new_users_7d} this week</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">Artist Activation</p>
                  <p className="text-4xl font-black tabular-nums text-gray-900">{artistActivationRate}%</p>
                  <p className="text-xs text-gray-400 mt-2">Artists with artwork</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">Engagement</p>
                  <p className="text-4xl font-black tabular-nums text-gray-900">{engagementRate}</p>
                  <p className="text-xs text-gray-400 mt-2">Likes + comments / artwork</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">Sales Rate</p>
                  <p className="text-4xl font-black tabular-nums text-gray-900">{marketplaceConversionRate}%</p>
                  <p className="text-xs text-gray-400 mt-2">Artworks sold</p>
                </div>
              </div>
            </section>

            {/* Users */}
            <section>
              <SectionHeader title="Users" icon={<Users className="w-4 h-4" />} description="Growth and composition of the user base" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <KpiCard label="Total Users"    value={metrics.total_users}          icon={<Users className="w-4 h-4" />}     accent="#7c3aed" />
                  <KpiCard label="New (7d)"       value={metrics.new_users_7d}         icon={<UserPlus className="w-4 h-4" />}  accent="#6d28d9" sub="Last 7 days" trend={{ value: metrics.new_users_7d, label: `${metrics.new_users_7d} joined` }} />
                  <KpiCard label="New (30d)"      value={metrics.new_users_30d}        icon={<TrendingUp className="w-4 h-4" />} accent="#5b21b6" sub="Last 30 days" />
                  <KpiCard label="Artists"        value={metrics.artists_count}        icon={<Palette className="w-4 h-4" />}   accent="#4f46e5" />
                  <KpiCard label="Art Lovers"     value={metrics.art_lovers_count}     icon={<Heart className="w-4 h-4" />}     accent="#4338ca" />
                  <KpiCard label="Active Artists" value={metrics.artists_with_artwork} icon={<UserCheck className="w-4 h-4" />} accent="#3730a3" sub="With artwork" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">User Split</p>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Artists</span>
                      <span className="font-bold">{metrics.total_users > 0 ? Math.round((metrics.artists_count / metrics.total_users) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${metrics.total_users > 0 ? Math.round((metrics.artists_count / metrics.total_users) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Art Lovers</span>
                      <span className="font-bold">{metrics.total_users > 0 ? Math.round((metrics.art_lovers_count / metrics.total_users) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${metrics.total_users > 0 ? Math.round((metrics.art_lovers_count / metrics.total_users) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <StatRow label="Activation rate" value={`${artistActivationRate}%`} accent="#7c3aed" />
                  <StatRow label="Avg artworks / artist" value={metrics.avg_artworks_per_artist} />
                </div>
              </div>
            </section>

            {/* Content */}
            <section>
              <SectionHeader title="Activation & Content" icon={<Image className="w-4 h-4" />} description="Artwork uploads and creator activity" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard label="Total Artworks"   value={metrics.total_artworks}         icon={<Image className="w-4 h-4" />}      accent="#0ea5e9" />
                <KpiCard label="Artworks (7d)"    value={metrics.artworks_7d}            icon={<TrendingUp className="w-4 h-4" />} accent="#0284c7" sub="Last 7 days" trend={{ value: metrics.artworks_7d, label: `${metrics.artworks_7d} uploaded` }} />
                <KpiCard label="Active Artists"   value={metrics.artists_with_artwork}   icon={<UserCheck className="w-4 h-4" />}  accent="#0369a1" sub="With ≥1 artwork" />
                <KpiCard label="Avg / Artist"     value={metrics.avg_artworks_per_artist} icon={<BarChart2 className="w-4 h-4" />} accent="#075985" sub="Per active artist" />
              </div>
            </section>

            {/* Social */}
            <section>
              <SectionHeader title="Social & Engagement" icon={<MessageCircle className="w-4 h-4" />} description="Community interaction and activity" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KpiCard label="Total Posts"    value={metrics.total_posts}    icon={<MessageSquare className="w-4 h-4" />} accent="#10b981" />
                  <KpiCard label="Posts (7d)"     value={metrics.posts_7d}       icon={<TrendingUp className="w-4 h-4" />}    accent="#059669" sub="Last 7 days" trend={{ value: metrics.posts_7d, label: `${metrics.posts_7d} new` }} />
                  <KpiCard label="Total Likes"    value={metrics.total_likes}    icon={<Heart className="w-4 h-4" />}         accent="#047857" />
                  <KpiCard label="Total Comments" value={metrics.total_comments} icon={<MessageSquare className="w-4 h-4" />} accent="#065f46" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">Engagement Summary</p>
                  <StatRow label="Total interactions" value={metrics.total_likes + metrics.total_comments} accent="#10b981" />
                  <StatRow label="Likes" value={metrics.total_likes} />
                  <StatRow label="Comments" value={metrics.total_comments} />
                  <StatRow label="Avg interactions / artwork" value={engagementRate} />
                  <StatRow label="Posts this week" value={metrics.posts_7d} />
                </div>
              </div>
            </section>

            {/* Messaging */}
            <section>
              <SectionHeader title="Messaging" icon={<MessageSquare className="w-4 h-4" />} description="Direct conversations and message volume" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard label="Conversations"  value={metrics.total_conversations} icon={<MessageSquare className="w-4 h-4" />} accent="#f59e0b" />
                <KpiCard label="Convos (7d)"    value={metrics.conversations_7d}   icon={<TrendingUp className="w-4 h-4" />}    accent="#d97706" sub="Last 7 days" trend={{ value: metrics.conversations_7d, label: `${metrics.conversations_7d} started` }} />
                <KpiCard label="Total Messages" value={metrics.total_messages}     icon={<MessageCircle className="w-4 h-4" />} accent="#b45309" />
                <KpiCard label="Messages (7d)"  value={metrics.messages_7d}        icon={<Clock className="w-4 h-4" />}         accent="#92400e" sub="Last 7 days" />
              </div>
            </section>

            {/* Marketplace */}
            <section>
              <SectionHeader title="Marketplace" icon={<ShoppingBag className="w-4 h-4" />} description="Pricing, listings, and sales activity" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <KpiCard label="With Price"      value={metrics.artworks_with_price}      icon={<Tag className="w-4 h-4" />}         accent="#ec4899" />
                  <KpiCard label="Price Visible"   value={metrics.artworks_price_visible}   icon={<Eye className="w-4 h-4" />}         accent="#db2777" />
                  <KpiCard label="Listed for Sale" value={metrics.artworks_listed_for_sale} icon={<ShoppingBag className="w-4 h-4" />} accent="#be185d" />
                  <KpiCard label="Active Listings" value={metrics.artworks_status_active}   icon={<Activity className="w-4 h-4" />}    accent="#9d174d" />
                  <KpiCard label="Sold"            value={metrics.artworks_status_sold}     icon={<DollarSign className="w-4 h-4" />}  accent="#831843" trend={{ value: metrics.artworks_status_sold, label: 'sold' }} />
                  <KpiCard label="Sales Rate"      value={`${marketplaceConversionRate}%`}  icon={<Package className="w-4 h-4" />}     accent="#500724" sub="Of all artworks" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">Marketplace Summary</p>
                  <StatRow label="Total artworks" value={metrics.total_artworks} />
                  <StatRow label="With price set" value={metrics.artworks_with_price} />
                  <StatRow label="Price visible" value={metrics.artworks_price_visible} />
                  <StatRow label="Listed for sale" value={metrics.artworks_listed_for_sale} />
                  <StatRow label="Active listings" value={metrics.artworks_status_active} accent="#ec4899" />
                  <StatRow label="Sold" value={metrics.artworks_status_sold} accent="#831843" />
                  <StatRow label="Conversion rate" value={`${marketplaceConversionRate}%`} accent={marketplaceConversionRate > 0 ? '#10b981' : undefined} />
                </div>
              </div>
            </section>

            {/* Full Summary Table */}
            <section>
              <SectionHeader title="Full Summary" icon={<BarChart2 className="w-4 h-4" />} description="All platform metrics in one view" />
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-bold tracking-widest uppercase text-gray-400">Metric</th>
                      <th className="text-right px-6 py-3 text-xs font-bold tracking-widest uppercase text-gray-400">Total</th>
                      <th className="text-right px-6 py-3 text-xs font-bold tracking-widest uppercase text-gray-400 hidden sm:table-cell">Last 7 Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Users',            total: metrics.total_users,            weekly: metrics.new_users_7d },
                      { label: 'Artworks',         total: metrics.total_artworks,         weekly: metrics.artworks_7d },
                      { label: 'Social Posts',     total: metrics.total_posts,            weekly: metrics.posts_7d },
                      { label: 'Likes',            total: metrics.total_likes,            weekly: null },
                      { label: 'Comments',         total: metrics.total_comments,         weekly: null },
                      { label: 'Conversations',    total: metrics.total_conversations,    weekly: metrics.conversations_7d },
                      { label: 'Messages',         total: metrics.total_messages,         weekly: metrics.messages_7d },
                      { label: 'Active Listings',  total: metrics.artworks_status_active, weekly: null },
                      { label: 'Sold Artworks',    total: metrics.artworks_status_sold,   weekly: null },
                    ].map((row, i) => (
                      <tr key={row.label} className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-3 text-gray-700 font-medium">{row.label}</td>
                        <td className="px-6 py-3 text-right font-bold text-gray-900 tabular-nums">{row.total.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right tabular-nums hidden sm:table-cell">
                          {row.weekly !== null
                            ? <span className={`font-semibold ${row.weekly > 0 ? 'text-green-600' : 'text-gray-400'}`}>{row.weekly > 0 ? `+${row.weekly}` : '–'}</span>
                            : <span className="text-gray-300">–</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        ) : null}

        {/* ── Verifications ── */}
        <section>
          <SectionHeader title="Artist Verifications" icon={<Shield className="w-4 h-4" />} description="Review and manage artist verification requests" />
          
          {/* Tabs */}
          <div style={{ display:'flex', gap:4, background:'#f3f4f6', borderRadius:12, padding:4, marginBottom:20, width:'fit-content' }}>
            {(['pending','approved','rejected'] as const).map(tab => (
              <button key={tab} onClick={() => setVerifTab(tab)} style={{
                padding:'7px 16px', borderRadius:8, border:'none',
                background: verifTab === tab ? '#fff' : 'transparent',
                color: verifTab === tab ? '#7c3aed' : '#6b7280',
                fontWeight:700, fontSize:'0.82rem', cursor:'pointer',
                boxShadow: verifTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                textTransform:'capitalize',
              }}>
                {tab}
              </button>
            ))}
          </div>

          {verifLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
              <Loader2 size={24} style={{ animation:'spin 0.8s linear infinite', color:'#7c3aed' }} />
            </div>
          ) : verificationRequests.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 24px', background:'#fff', borderRadius:16, border:'1.5px dashed #e5e7eb' }}>
              <Shield size={32} style={{ color:'#d1d5db', margin:'0 auto 12px' }} />
              <div style={{ fontWeight:700, color:'#6b7280', fontSize:'0.9rem' }}>No {verifTab} requests</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {verificationRequests.map(req => (
                <div key={req.id} style={{ background:'#fff', borderRadius:16, border:'1.5px solid #f0ebff', padding:'20px 22px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {(req as any).profiles?.avatar_url ? (
                        <img src={(req as any).profiles.avatar_url} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                      ) : (
                        <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg, #7c3aed, #0d9488)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'1rem', color:'#fff', fontWeight:800 }}>
                          {((req as any).profiles?.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight:800, color:'#1a1729', fontSize:'0.95rem' }}>
                          {(req as any).profiles?.full_name || 'Unknown'}
                        </div>
                        <div style={{ fontSize:'0.75rem', color:'#7c3aed', marginTop:1 }}>
                          @{(req as any).profiles?.username}
                        </div>
                        <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:1 }}>
                          Submitted {new Date(req.submitted_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                        </div>
                      </div>
                    </div>
                    {verifTab === 'approved' && <VerifiedArtistBadge size="sm" showLabel={true} />}
                    {verifTab === 'rejected' && (
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#ef4444', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:99, padding:'3px 10px' }}>Rejected</span>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                    <div style={{ background:'#f9f8ff', borderRadius:10, padding:'10px 12px' }}>
                      <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Legal name</div>
                      <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#1a1729' }}>{req.full_legal_name}</div>
                    </div>
                    {req.website_url && (
                      <div style={{ background:'#f9f8ff', borderRadius:10, padding:'10px 12px' }}>
                        <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Website</div>
                        <a href={req.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.82rem', color:'#7c3aed', fontWeight:600, textDecoration:'none', wordBreak:'break-all' }}>
                          {req.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {req.instagram_url && (
                      <div style={{ background:'#f9f8ff', borderRadius:10, padding:'10px 12px' }}>
                        <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Instagram</div>
                        <a href={req.instagram_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.82rem', color:'#7c3aed', fontWeight:600, textDecoration:'none' }}>
                          {req.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')}
                        </a>
                      </div>
                    )}
                    {req.portfolio_url && (
                      <div style={{ background:'#f9f8ff', borderRadius:10, padding:'10px 12px' }}>
                        <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Portfolio</div>
                        <a href={req.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.82rem', color:'#7c3aed', fontWeight:600, textDecoration:'none', wordBreak:'break-all' }}>
                          {req.portfolio_url.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Statement */}
                  <div style={{ background:'#f9f8ff', borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
                    <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Statement</div>
                    <p style={{ fontSize:'0.85rem', color:'#374151', lineHeight:1.6, margin:0 }}>{req.statement}</p>
                  </div>

                  {/* Rejection reason if rejected */}
                  {req.rejection_reason && (
                    <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
                      <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Rejection reason</div>
                      <p style={{ fontSize:'0.82rem', color:'#dc2626', margin:0 }}>{req.rejection_reason}</p>
                    </div>
                  )}

                  {/* Actions — only for pending */}
                  {verifTab === 'pending' && (
                    rejectingId === req.id ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <textarea
                          placeholder="Reason for rejection (shown to artist)..."
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          rows={2}
                          style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #fca5a5', borderRadius:10, fontSize:'0.85rem', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }}
                        />
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={async () => {
                            if (!rejectReason.trim()) return;
                            setActionLoading(req.id);
                            try {
                              const { data: { session } } = await supabase.auth.getSession();
                              await verificationDb.reject(req.id, session?.user?.email || 'admin', rejectReason.trim());
                              setRejectingId(null); setRejectReason('');
                              loadVerifications('pending');
                            } catch { /* ignore */ }
                            finally { setActionLoading(null); }
                          }} disabled={!rejectReason.trim() || actionLoading === req.id} style={{
                            flex:1, padding:'9px', borderRadius:10, border:'none',
                            background:'#ef4444', color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer',
                            opacity: !rejectReason.trim() ? 0.5 : 1,
                          }}>
                            {actionLoading === req.id ? <Loader2 size={14} style={{ animation:'spin 0.8s linear infinite' }} /> : 'Confirm Rejection'}
                          </button>
                          <button onClick={() => { setRejectingId(null); setRejectReason(''); }} style={{
                            padding:'9px 16px', borderRadius:10, border:'1.5px solid #e5e7eb',
                            background:'#fff', color:'#6b7280', fontWeight:700, fontSize:'0.82rem', cursor:'pointer',
                          }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={async () => {
                          setActionLoading(req.id);
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            await verificationDb.approve(req.id, session?.user?.email || 'admin');
                            loadVerifications('pending');
                          } catch { /* ignore */ }
                          finally { setActionLoading(null); }
                        }} disabled={actionLoading === req.id} style={{
                          flex:1, padding:'10px', borderRadius:10, border:'none',
                          background:'linear-gradient(135deg, #7c3aed, #0d9488)',
                          color:'#fff', fontWeight:700, fontSize:'0.85rem', cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        }}>
                          {actionLoading === req.id
                            ? <Loader2 size={14} style={{ animation:'spin 0.8s linear infinite' }} />
                            : <><Check size={14} /> Approve & Verify</>
                          }
                        </button>
                        <button onClick={() => { setRejectingId(req.id); setRejectReason(''); }} style={{
                          flex:1, padding:'10px', borderRadius:10,
                          border:'1.5px solid #fca5a5', background:'#fff',
                          color:'#ef4444', fontWeight:700, fontSize:'0.85rem', cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        }}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Security / Password */}
        <section>
          <SectionHeader title="Security" icon={<Lock className="w-4 h-4" />} description="Change your admin account password" />
          <div className="max-w-md">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-6">Re-authentication is required. After a successful change you will be signed out automatically.</p>
              {pwSuccess ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <p className="text-sm font-semibold text-green-800">Password updated. Signing you out…</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-pw">Current password</Label>
                    <Input id="current-pw" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-pw">New password</Label>
                    <Input id="new-pw" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required />
                    <p className="text-xs text-gray-400">Minimum 10 characters</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pw">Confirm new password</Label>
                    <Input id="confirm-pw" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
                  </div>
                  {pwError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700">{pwError}</p>
                    </div>
                  )}
                  <Button type="submit" disabled={pwLoading} className="w-full gap-2">
                    {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {pwLoading ? 'Updating…' : 'Update password'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
