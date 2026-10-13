'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DownloadGateProps {
  releaseId: string;
  downloadUrl?: string | null;
  trackTitle: string;
}

export default function DownloadGate({
  releaseId,
  downloadUrl,
  trackTitle,
}: DownloadGateProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.from('contacts').insert([
        {
          release_id: releaseId,
          email: email.trim().toLowerCase(),
        },
      ]);

      if (error && error.code !== '23505') {
        throw error;
      }

      setUnlocked(true);

      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error unlocking download link');
    } finally {
      setLoading(false);
    }
  };

  if (!downloadUrl) return null;

  return (
    <div className="mt-8 p-6 bg-[#0c1324] border border-blue-900/40 rounded-3xl shadow-xl max-w-md w-full mx-auto text-center">
      <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl border border-blue-500/30">
        ⬇
      </div>
      <h3 className="text-lg font-bold text-white mb-1">Free Download</h3>
      <p className="text-xs text-slate-400 mb-6">
        Enter your email to unlock the high-quality download of <span className="text-blue-300 font-semibold">{trackTitle}</span>.
      </p>

      {unlocked ? (
        <div className="space-y-4">
          <p className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 py-2.5 px-4 rounded-xl">
            ✓ Link Unlocked!
          </p>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block w-full py-3.5 bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all uppercase tracking-wider"
          >
            Download Now ↗
          </a>
        </div>
      ) : (
        <form onSubmit={handleUnlock} className="space-y-3">
          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50">
              {errorMsg}
            </p>
          )}
          <input
            type="email"
            placeholder="fan@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#141e36] border border-blue-900/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all uppercase tracking-wider cursor-pointer"
          >
            {loading ? 'Unlocking...' : 'Unlock Download'}
          </button>
        </form>
      )}
    </div>
  );
}