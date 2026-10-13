"use client";

import { useState, type FormEvent } from "react";
import { Download, LoaderCircle, Mail } from "lucide-react";
import { supabase, type ReleaseData } from "@/lib/supabase";

export default function DownloadGate({
  release,
  isDemo,
}: {
  release: ReleaseData;
  isDemo: boolean;
}) {
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (isDemo || !supabase) {
      setMessage("Это демо-режим: email не сохраняется и файл недоступен.");
      return;
    }

    if (!release.download_url) {
      setMessage("Файл для скачивания пока не добавлен.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("contacts")
      .insert({ email, release_id: release.id });
    setIsSaving(false);

    if (error) {
      console.error("Unable to save download-gate contact:", error.message);
      setMessage("Не получилось сохранить email. Попробуйте ещё раз позже.");
      return;
    }

    setDownloadReady(true);
    setMessage("Готово! Ваш файл можно скачать.");
  }

  return (
    <section className="mt-8 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300">
          <Download aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">Скачать эксклюзивный трек</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Оставьте email, чтобы получить файл
          </p>
        </div>
      </div>

      {!downloadReady ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="sr-only" htmlFor="download-email">
            Ваш email
          </label>
          <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3">
            <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              id="download-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-bold text-black transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Download aria-hidden="true" className="h-4 w-4" />
            )}
            {isSaving ? "Сохраняем…" : "Получить файл"}
          </button>
        </form>
      ) : (
        <a
          href={release.download_url ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-bold text-black transition hover:bg-lime-200"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Скачать трек
        </a>
      )}

      {message && (
        <p className="mt-3 text-xs leading-5 text-zinc-300" role="status">
          {message}
        </p>
      )}
      <p className="mt-3 text-center text-[11px] leading-4 text-zinc-500">
        Нажимая кнопку, вы соглашаетесь получать новости артиста.
      </p>
    </section>
  );
}
