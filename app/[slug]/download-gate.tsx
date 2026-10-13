'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface GateStep {
  id: string;
  label: string;
  url: string;
  icon: string;
}

interface DownloadGateProps {
  releaseId: string;
  downloadUrl?: string | null;
  trackTitle: string;
  socialSteps?: GateStep[];
}

export default function DownloadGate({
  releaseId,
  downloadUrl,
  trackTitle,
  socialSteps = [],
}: DownloadGateProps) {
  const [email, setEmail] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFollowClick = (step: GateStep) => {
    window.open(step.url, '_blank', 'noopener,noreferrer');
    setCompletedSteps((prev) => ({ ...prev, [step.id]: true }));
  };

  const activeSteps = socialSteps.filter((s) => s.url && s.url.trim().length > 0);
  const allStepsCompleted =
    activeSteps.length === 0 ||
    activeSteps.every((step) => completedSteps[step.id]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Пожалуйста, введите ваш email');
      return;
    }

    if (!allStepsCompleted) {
      setErrorMsg('Пожалуйста, выполните все шаги и подпишитесь на указанные каналы!');
      return;
    }

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
      setErrorMsg(err.message || 'Ошибка разблокировки');
    } finally {
      setLoading(false);
    }
  };

  if (!downloadUrl) return null;

  return (
    <div className="mt-8 p-6 bg-[#0c1324] border border-blue-900/40 rounded-3xl shadow-2xl max-w-md w-full mx-auto text-center">
      <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl border border-blue-500/30">
        ⬇
      </div>
      <h3 className="text-lg font-bold text-white mb-1">Download Gate</h3>
      <p className="text-xs text-slate-400 mb-6">
        Выполните шаги ниже, чтобы скачать <span className="text-blue-300 font-semibold">{trackTitle}</span>:
      </p>

      {unlocked ? (
        <div className="space-y-4">
          <p className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 py-3 px-4 rounded-xl">
            ✓ Все условия выполнены! Ссылка разблокирована.
          </p>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block w-full py-3.5 bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all uppercase tracking-wider"
          >
            Скачать файл прямо сейчас ↗
          </a>
        </div>
      ) : (
        <div className="space-y-5 text-left">
          {activeSteps.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Шаг 1: Подпишитесь ({Object.values(completedSteps).filter(Boolean).length}/{activeSteps.length})
              </span>
              {activeSteps.map((step) => {
                const isDone = !!completedSteps[step.id];
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleFollowClick(step)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                      isDone
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                        : 'bg-[#141e36] border-blue-900/40 text-white hover:border-blue-500'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{step.icon}</span>
                      <span>{step.label}</span>
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {isDone ? '✓ Готово' : 'Подписаться ↗'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-3 pt-2 border-t border-blue-900/30">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Шаг 2: Введите Email для разблокировки
            </span>
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
              disabled={loading || !allStepsCompleted}
              className={`w-full py-3.5 text-white font-bold text-xs rounded-xl shadow-lg transition-all uppercase tracking-wider ${
                !allStepsCompleted
                  ? 'bg-slate-700/50 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 cursor-pointer'
              }`}
            >
              {loading
                ? 'Проверка...'
                : !allStepsCompleted
                ? 'Подпишитесь на все каналы выше'
                : 'Разблокировать скачивание'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}