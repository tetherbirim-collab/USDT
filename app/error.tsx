"use client";

import Link from "next/link";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md">
        <h1 className="font-display text-4xl font-extrabold">Sayfa açılmadı</h1>
        <p className="mt-3 text-white/70">Bağlantı yenilenince panele dönersin.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-gold" onClick={() => reset()}>
            Yeniden dene
          </button>
          <Link href="/panel/" className="btn btn-ghost">
            Panele dön
          </Link>
          <Link href="/" className="btn btn-ghost">
            Ana sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
