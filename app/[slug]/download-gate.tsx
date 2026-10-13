'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SocialStep {
  id: string;
  label: string;
  url: string;
  icon?: string;
}

interface DownloadGateProps {
  releaseId: string;
  downloadUrl: string;
  trackTitle: string;
  socialSteps?: SocialStep[];
}

export default function DownloadGate({
  releaseId,
  downloadUrl,
  trackTitle,
  socialSteps = [],
}: DownloadGateProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalSteps = socialSteps.length;
  const isAllFollowed = completedSteps.length >= totalSteps;
  const canUnlock = isAllFollowed && email.trim().length > 0;

  const handleStepClick = (step: SocialStep) => {
    window.open(step.url, '_blank', 'noopener,noreferrer');
    if (!completedSteps.includes(step.id)) {
      setCompletedSteps((prev) => [...prev, step.id]);
    }
  };

  const handleUnlockAndDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUnlock) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.from('contacts').insert([
        {
          release_id: releaseId,
          email: email.trim(),
        },
      ]);

      if (error) {
        console.error('Supabase contact insert error:', error);
      }

      setIsUnlocked(true);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#101930] border border-blue-900/60 rounded-3xl p-5 md:p-6 text-left shadow-xl">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3 shadow-lg shadow-blue-900/30">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <h3 className="text-lg font-black text-white uppercase tracking-wider">Download Gate</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Complete the steps below to download <span className="text-blue-300 font-semibold">{trackTitle}</span>:
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Step 1: Follow Channels */}
      {totalSteps > 0 && (
        <div className="mb-5">
          <div className="flex justify-between items-center text-[11px] font-bold tracking-wider text-blue-400 uppercase mb-2">
            <span>Step 1: Follow ({completedSteps.length}/{totalSteps})</span>
          </div>

          <div className="space-y-2">
            {socialSteps.map((step) => {
              const done = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3 bg-[#141e36] border border-blue-900/40 rounded-xl gap-2"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${done ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'}`} />
                    <span className="text-xs font-semibold text-slate-200 truncate">{step.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStepClick(step)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                      done
                        ? 'bg-blue-950 text-blue-300 border border-blue-800/50 hover:bg-blue-900'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/30'
                    }`}
                  >
                    {done ? 'Followed ✓' : 'Follow ↗'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Email & Download */}
      <form onSubmit={handleUnlockAndDownload} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold tracking-wider text-blue-400 uppercase mb-2">
            Step 2: Enter Email to Unlock
          </label>
          <input
            type="email"
            required
            placeholder="fan@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#141e36] border border-blue-900/60 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          disabled={!canUnlock || loading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 font-bold text-xs uppercase tracking-wider text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {loading
            ? 'Unlocking...'
            : isUnlocked
            ? 'Download Link Opened ✓'
            : isAllFollowed
            ? 'Get Download Link'
            : 'Follow All Channels Above'}
        </button>
      </form>
    </div>
  );
}