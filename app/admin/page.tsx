'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const OWNER_EMAIL = 'niknesvet@gmail.com';
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface Release {
  id: string;
  title: string;
  artist: string;
  slug: string;
  cover_url?: string;
  download_url?: string;
  created_at: string;
  user_id?: string;
  views_count?: number;
}

interface Contact {
  id: string;
  email: string;
  created_at: string;
  release_id: string;
}

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [releases, setReleases] = useState<Release[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [appleMusicUrl, setAppleMusicUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    setErrorMsg('');
    const { data: rels, error: relErr } = await supabase
      .from('releases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (relErr) {
      setErrorMsg('Failed to load data from database.');
      return;
    }

    const currentReleases = rels || [];
    setReleases(currentReleases);

    if (currentReleases.length > 0) {
      const releaseIds = currentReleases.map((r) => r.id);
      const { data: conts } = await supabase
        .from('contacts')
        .select('*')
        .in('release_id', releaseIds)
        .order('created_at', { ascending: false });

      setContacts(conts || []);
    } else {
      setContacts([]);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message);
      } else if (data?.user && !data?.session) {
        setSuccessMsg('Account created! You can now log in.');
        setIsSignUp(false);
      } else {
        setSuccessMsg('Account created successfully!');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCoverFile(null);
      return;
    }

    // Проверка размера файла (до 5 МБ)
    if (file.size > MAX_COVER_SIZE_BYTES) {
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMsg(`Artwork file is too large (${fileSizeMb} MB). Maximum allowed size is 5 MB.`);
      e.target.value = ''; // сбрасываем выбранный файл в input
      setCoverFile(null);
      return;
    }

    setErrorMsg('');
    setCoverFile(file);
  };

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from('tracks').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('tracks').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const generateSlug = (text: string) => {
    const baseSlug = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return baseSlug || `track-${Math.random().toString(36).substring(2, 7)}`;
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    if (coverFile && coverFile.size > MAX_COVER_SIZE_BYTES) {
      setErrorMsg('Artwork file exceeds the 5 MB limit.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      let finalCoverUrl = '';

      if (coverFile) {
        finalCoverUrl = await uploadFile(coverFile, 'covers');
      }

      const autoSlug = `${generateSlug(title)}-${Math.random().toString(36).substring(2, 6)}`;

      const { error } = await supabase.from('releases').insert([
        {
          user_id: session.user.id,
          title,
          artist,
          slug: autoSlug,
          cover_url: finalCoverUrl || null,
          download_url: downloadUrl || null,
          spotify_url: spotifyUrl || null,
          apple_music_url: appleMusicUrl || null,
          telegram_url: telegramUrl || null,
          soundcloud_url: soundcloudUrl || null,
          instagram_url: instagramUrl || null,
        },
      ]);

      if (error) throw error;

      setTitle('');
      setArtist('');
      setDownloadUrl('');
      setSpotifyUrl('');
      setAppleMusicUrl('');
      setTelegramUrl('');
      setSoundcloudUrl('');
      setInstagramUrl('');
      setCoverFile(null);
      loadUserData(session.user.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating release');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRelease = async (id: string) => {
    if (!confirm('Are you sure you want to delete this release?')) return;
    const { error } = await supabase.from('releases').delete().eq('id', id);
    if (!error && session?.user?.id) {
      loadUserData(session.user.id);
    }
  };

  const copyToClipboard = (slug: string, id: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportContactsCSV = () => {
    if (contacts.length === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Email,Date'].concat(contacts.map((c) => `${c.email},${new Date(c.created_at).toISOString()}`)).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dropper_contacts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!session) {
    return (
      <main className="min-h-screen bg-[#060913] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0c1324] border border-blue-600/30 p-8 rounded-3xl shadow-2xl shadow-blue-950/70">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500"></span>
            <h1 className="text-xl font-black tracking-widest text-blue-400 uppercase">DROPPER</h1>
          </div>
          <h2 className="text-2xl font-bold mb-6 text-white">
            {isSignUp ? 'Create Artist Account' : 'Sign In'}
          </h2>

          {errorMsg && (
            <p className="mb-4 text-xs text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p className="mb-4 text-xs text-blue-300 bg-blue-950/40 p-3 rounded-xl border border-blue-800/50">
              {successMsg}
            </p>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs text-blue-300 font-semibold uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1.5 bg-[#141e36] border border-blue-900/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-blue-300 font-semibold uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full mt-1.5 bg-[#141e36] border border-blue-900/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl shadow-lg shadow-blue-600/40 transition-all cursor-pointer"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4 cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isOwner = session?.user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  return (
    <main className="min-h-screen bg-[#060913] text-slate-100 p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500"></span>
              <span className="text-xs font-black tracking-widest text-blue-400 uppercase">DROPPER</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mt-1">Artist Portal</h1>
            <p className="text-xs text-slate-400 mt-0.5">{session.user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            {isOwner && (
              <Link
                href="/admin/master"
                className="px-4 py-2 text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                ★ Master Hub
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-bold bg-[#141e36] hover:bg-blue-950 border border-blue-800/40 rounded-xl transition-all text-blue-200 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Release Form */}
          <div className="lg:col-span-7 bg-[#0c1324] border border-blue-900/40 rounded-3xl p-6 md:p-8 shadow-2xl shadow-blue-950/40">
            <h2 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              New Smart Link
            </h2>

            <form onSubmit={handleCreateRelease} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-blue-300">Track Title *</label>
                  <input
                    type="text"
                    placeholder="Midnight Drive"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full mt-1 bg-[#141e36] border border-blue-900/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-blue-300">Artist *</label>
                  <input
                    type="text"
                    placeholder="DJ Yavin"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    required
                    className="w-full mt-1 bg-[#141e36] border border-blue-900/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Cover Artwork File (Limited to 5MB) */}
              <div className="p-4 bg-[#101930] rounded-2xl border border-blue-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Cover Artwork (JPG, PNG)
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/50">
                    Max 5 MB
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleCoverChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-500 file:cursor-pointer"
                />
              </div>

   {/* Download URL */}
          <div>
            <label className="text-xs font-semibold text-blue-300">Download URL (Google Drive / Dropbox)</label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full mt-1 bg-[#141e36] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Streaming Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-blue-300">Spotify URL</label>
              <input
                type="url"
                placeholder="https://open.spotify.com/..."
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                className="w-full mt-1 bg-[#141e36] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-blue-300">Apple Music URL</label>
              <input
                type="url"
                placeholder="https://music.apple.com/..."
                value={appleMusicUrl}
                onChange={(e) => setAppleMusicUrl(e.target.value)}
                className="w-full mt-1 bg-[#141e36] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
                <div>
                  <label className="text-xs font-semibold text-blue-300">SoundCloud URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={soundcloudUrl}
                    onChange={(e) => setSoundcloudUrl(e.target.value)}
                    className="w-full mt-1 bg-[#141e36] border border-blue-900/50 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                  />
<div>
            <label className="text-xs font-semibold text-blue-300">Instagram URL</label>
            <input
              type="url"
              placeholder="https://instagram.com/..."
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="w-full mt-1 bg-[#141e36] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-blue-300">Telegram URL</label>
            <input
              type="url"
              placeholder="https://t.me/..."
              value={telegramUrl}
              onChange={(e) => setTelegramUrl(e.target.value)}
              className="w-full mt-1 bg-[#141e36] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-all"
        >
          {uploading ? 'Uploading cover...' : '+ Create Smart Link'}
        </button>
      </form>
          {/* Releases & Contacts */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0c1324] border border-blue-900/40 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold mb-4 text-white flex justify-between items-center">
                <span>My Releases</span>
                <span className="text-xs text-blue-300 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/50 font-mono">
                  {releases.length}
                </span>
              </h2>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {releases.length === 0 ? (
                  <p className="text-xs text-slate-500">No releases created yet.</p>
                ) : (
                  releases.map((rel) => (
                    <div
                      key={rel.id}
                      className="p-3.5 bg-[#141e36] border border-blue-900/30 rounded-2xl flex items-center justify-between gap-2"
                    >
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm text-white truncate">{rel.title}</p>
                        <p className="text-xs text-blue-300/70 truncate">
                          {rel.artist} {rel.views_count ? `• 👁 ${rel.views_count}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => copyToClipboard(rel.slug, rel.id)}
                          className="text-xs font-semibold px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 rounded-lg border border-blue-800/50 transition-all cursor-pointer"
                        >
                          {copiedId === rel.id ? 'Copied!' : 'Copy'}
                        </button>
                        <a
                          href={`/${rel.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold px-2.5 py-1.5 bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-500/40 transition-all"
                        >
                          Open ↗
                        </a>
                        <button
                          onClick={() => handleDeleteRelease(rel.id)}
                          className="text-xs text-slate-500 hover:text-rose-400 p-1.5 transition-all cursor-pointer"
                          title="Delete release"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#0c1324] border border-blue-900/40 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Fan Contacts</h2>
                  <span className="text-xs text-blue-300 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/50 font-mono">
                    {contacts.length}
                  </span>
                </div>
                {contacts.length > 0 && (
                  <button
                    onClick={exportContactsCSV}
                    className="text-xs font-bold px-2.5 py-1 text-blue-400 hover:text-white bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/50 rounded-lg transition-all cursor-pointer"
                  >
                    Export .CSV
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {contacts.length === 0 ? (
                  <p className="text-xs text-slate-500">No contacts collected yet.</p>
                ) : (
                  contacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 bg-[#141e36]/60 border border-blue-950 rounded-xl flex justify-between items-center text-xs"
                    >
                      <span className="text-blue-200 font-mono">{c.email}</span>
                      <span className="text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}