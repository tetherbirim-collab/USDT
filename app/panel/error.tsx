"use client";

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="glass rounded-[28px] p-6">
      <h1 className="font-display text-2xl font-bold">Panel açılmadı</h1>
      <p className="mt-2 text-white/70">Hesap verisi okunurken bir sorun oluştu.</p>
      <button className="btn btn-gold mt-5" onClick={reset}>
        Yeniden dene
      </button>
    </div>
  );
}
