'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ReleaseGatePage({ params }: PageProps) {
  const [slug, setSlug] = useState<string>('');
  const [release, setRelease] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Разрешаем параметры страницы
  useEffect(() => {
    Promise.resolve(params).then((resolvedParams) => {
      if (resolvedParams?.slug) {
        setSlug(resolvedParams.slug);
      }
    });
  }, [params]);

  // Загружаем релиз и фиксируем просмотр
  useEffect(() => {
    if (!slug) return;

    const loadData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('releases')
        .select('*')
        .eq('slug', slug)
        .single();

      setRelease(data);
      setLoading(false);

      // Фиксируем просмотр в базе данных для Master Dashboard
      await supabase.rpc('increment_release_views', { target_slug: slug });
    };

    loadData();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !release) return;

    setSubmitting(true);
    try {
      await supabase.from('contacts').insert([
        {
          release_id: release.id,
          email: email,
        },
      ]);

      setDownloaded(true);
      if (release.download_url) {
        window.open(release.download_url, '_blank');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#060913] flex items-center justify-center text-blue-400 font-mono text-xs uppercase tracking-widest">
        Loading release...
      </main>
    );
  }

  if (!release) {
    return (
      <main className="min-h-screen bg-[#060913] flex items-center justify-center text-slate-400 text-sm">
        Release not found
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Neon Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0c1324]/90 backdrop-blur-2xl border border-blue-900/40 p-6 md:p-8 rounded-3xl shadow-2xl shadow-blue-950/80 relative z-10 flex flex-col items-center text-center">
        {/* Cover Art */}
        <div className="w-56 h-56 rounded-2xl overflow-hidden mb-6 shadow-2xl shadow-black/80 bg-[#141e36] border border-blue-800/40 flex items-center justify-center">
          {release.cover_url ? (
            <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-950 to-[#0c1324] flex items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <p className="text-xs uppercase tracking-widest text-blue-400 font-black mb-1">New Release</p>
        <h1 className="text-2xl font-black text-white mb-1 tracking-tight">{release.title}</h1>
        <p className="text-blue-300/80 text-sm mb-6">{release.artist}</p>

        {/* Streaming Links */}
        <div className="w-full space-y-2.5 mb-6">
          {release.spotify_url && (
            <a
              href={release.spotify_url}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#141e36] hover:bg-blue-900/40 border border-blue-900/50 flex items-center justify-between text-xs font-bold transition-all hover:border-blue-400"
            >
              <span>Spotify</span>
              <span className="text-blue-400">Listen →</span>
            </a>
          )}
          {release.apple_music_url && (
            <a
              href={release.apple_music_url}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#141e36] hover:bg-blue-900/40 border border-blue-900/50 flex items-center justify-between text-xs font-bold transition-all hover:border-blue-400"
            >
              <span>Apple Music</span>
              <span className="text-blue-400">Listen →</span>
            </a>
          )}
          {release.soundcloud_url && (
            <a
              href={release.soundcloud_url}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#141e36] hover:bg-blue-900/40 border border-blue-900/50 flex items-center justify-between text-xs font-bold transition-all hover:border-blue-400"
            >
              <span>SoundCloud</span>
              <span className="text-blue-400">Listen →</span>
            </a>
          )}
          {release.telegram_url && (
            <a
              href={release.telegram_url}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#141e36] hover:bg-blue-900/40 border border-blue-900/50 flex items-center justify-between text-xs font-bold transition-all hover:border-blue-400"
            >
              <span>Telegram Channel</span>
              <span className="text-blue-400">Join →</span>
            </a>
          )}
        </div>

        {/* Download Gate */}
        {release.download_url && (
          <div className="w-full bg-[#101930] border border-blue-800/40 p-5 rounded-2xl shadow-inner">
            <h3 className="text-sm font-bold text-white mb-1">Download Exclusive Track</h3>
            <p className="text-xs text-blue-300/70 mb-4">Enter your email to unlock the download link</p>

            {downloaded ? (
              <div className="p-3 bg-blue-600/20 border border-blue-500/50 rounded-xl text-blue-300 text-xs font-bold">
                🎉 Thanks! Download starting now.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#141e36] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {submitting ? 'Unlocking...' : 'Get Track'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 text-xs font-semibold tracking-wider text-slate-500/60 uppercase">
        Powered by Dropper • By: Andrew Jester
      </div>
    </main>
  );
}