'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const OWNER_EMAIL = 'niknesvet@gmail.com';
const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB
const WARNING_THRESHOLD_PERCENT = 80;

export default function MasterDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const [totalReleases, setTotalReleases] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [allReleases, setAllReleases] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    checkOwnerAuth();
  }, []);

  const checkOwnerAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      router.push('/admin');
      return;
    }

    setIsAuthorized(true);
    await loadMasterStats();
    setLoading(false);
  };

  const loadMasterStats = async () => {
    const { data: bytesData } = await supabase.rpc('get_storage_usage');
    const bytes = Number(bytesData || 0);
    setStorageUsedBytes(bytes);

    const percentUsed = (bytes / STORAGE_LIMIT_BYTES) * 100;
    if (percentUsed >= WARNING_THRESHOLD_PERCENT) {
      setShowWarningModal(true);
    }

    const { data: rels } = await supabase
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false });

    const releasesList = rels || [];
    setAllReleases(releasesList);
    setTotalReleases(releasesList.length);

    const viewsSum = releasesList.reduce((acc, r) => acc + (r.views_count || 0), 0);
    setTotalViews(viewsSum);

    const { data: conts } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    const contactsList = conts || [];
    setAllContacts(contactsList);
    setTotalContacts(contactsList.length);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const exportAllPlatformCSV = () => {
    if (allContacts.length === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Email,Date,ReleaseID'].concat(
        allContacts.map((c) => `${c.email},${new Date(c.created_at).toISOString()},${c.release_id}`)
      ).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dropper_master_contacts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !isAuthorized) {
    return (
      <main className="min-h-screen bg-[#060913] flex items-center justify-center text-blue-400 font-mono text-xs uppercase tracking-widest">
        Verifying Master Access...
      </main>
    );
  }

  const percentUsed = Math.min(100, Math.round((storageUsedBytes / STORAGE_LIMIT_BYTES) * 100));
  const isCritical = percentUsed >= 90;
  const isWarning = percentUsed >= WARNING_THRESHOLD_PERCENT;
  const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : '0';

  return (
    <main className="min-h-screen bg-[#060913] text-slate-100 p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-[#111827] border border-rose-500/50 p-6 rounded-3xl shadow-2xl shadow-rose-950/60 text-center">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold border border-rose-500/40">
              ⚠️
            </div>
            <h3 className="text-xl font-black text-white mb-2">Storage Alert!</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Your storage bucket is at <span className="text-rose-400 font-bold">{percentUsed}%</span> capacity (
              {formatBytes(storageUsedBytes)} / 1 GB).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
              >
                Acknowledge
              </button>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all flex items-center justify-center"
              >
                Supabase Clean ↗
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500"></span>
              <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">
                DROPPER CREATOR SYSTEM
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mt-1">Master Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">Global metrics & platform health for Andrew Jester</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportAllPlatformCSV}
              className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              Export Global DB (.CSV)
            </button>
            <Link
              href="/admin"
              className="px-4 py-2.5 text-xs font-bold bg-[#141e36] hover:bg-blue-950 border border-blue-800/40 rounded-xl transition-all text-blue-200"
            >
              ← Back to Portal
            </Link>
          </div>
        </div>

        {/* Шкала памяти */}
        <div className="mb-8 p-6 bg-[#0c1324] border border-blue-900/40 rounded-3xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Storage Capacity (Covers Bucket)</span>
                {isWarning && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-950 border border-rose-800/60 text-rose-400">
                    High Usage
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {formatBytes(storageUsedBytes)} of 1 GB used ({percentUsed}%)
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-white">{percentUsed}%</span>
            </div>
          </div>

          <div className="w-full h-3 bg-[#141e36] rounded-full overflow-hidden border border-blue-950 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCritical
                  ? 'bg-rose-500 shadow-md shadow-rose-500'
                  : isWarning
                  ? 'bg-amber-500 shadow-md shadow-amber-500'
                  : 'bg-blue-500 shadow-md shadow-blue-500'
              }`}
              style={{ width: `${Math.max(4, percentUsed)}%` }}
            />
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-[#0c1324] border border-blue-900/30 rounded-2xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Traffic
            </span>
            <p className="text-3xl font-black text-white font-mono">{totalViews}</p>
            <span className="text-[11px] text-blue-400 mt-1 block">👁 page views</span>
          </div>

          <div className="p-5 bg-[#0c1324] border border-blue-900/30 rounded-2xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Global Leads
            </span>
            <p className="text-3xl font-black text-white font-mono">{totalContacts}</p>
            <span className="text-[11px] text-blue-400 mt-1 block">⚡ fan emails</span>
          </div>

          <div className="p-5 bg-[#0c1324] border border-blue-900/30 rounded-2xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Conversion
            </span>
            <p className="text-3xl font-black text-white font-mono">{conversionRate}%</p>
            <span className="text-[11px] text-blue-400 mt-1 block">views to email</span>
          </div>

          <div className="p-5 bg-[#0c1324] border border-blue-900/30 rounded-2xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Releases
            </span>
            <p className="text-3xl font-black text-white font-mono">{totalReleases}</p>
            <span className="text-[11px] text-blue-400 mt-1 block">active links</span>
          </div>
        </div>

        {/* Таблица треков */}
        <div className="bg-[#0c1324] border border-blue-900/40 rounded-3xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4">All Live Releases & Performance</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-blue-950 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Track</th>
                  <th className="pb-3 font-semibold">Artist</th>
                  <th className="pb-3 font-semibold text-center">Views</th>
                  <th className="pb-3 font-semibold text-right">Created</th>
                  <th className="pb-3 font-semibold text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-950/60">
                {allReleases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No releases created yet.
                    </td>
                  </tr>
                ) : (
                  allReleases.map((rel) => (
                    <tr key={rel.id} className="hover:bg-blue-950/20 transition-all">
                      <td className="py-3.5 font-bold text-white pr-4">{rel.title}</td>
                      <td className="py-3.5 text-blue-300 pr-4">{rel.artist}</td>
                      <td className="py-3.5 text-center font-mono font-bold text-slate-200">
                        {rel.views_count || 0}
                      </td>
                      <td className="py-3.5 text-right text-slate-500">
                        {new Date(rel.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <a
                          href={`/${rel.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-2"
                        >
                          /{rel.slug} ↗
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}