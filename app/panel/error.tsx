"use client";

import Link from "next/link";

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="glass rounded-[28px] p-6">
      <h1 className="font-display text-2xl font-bold">Panel açılmadı</h1>
      <p className="mt-2 text-white/70">Hesap verisi okunurken bir sorun oluştu.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-gold" onClick={reset}>
          Yeniden dene
        </button>
        <Link href="/panel/" className="btn btn-ghost">
          Özete dön
        </Link>
      </div>
    </div>
  );
}
