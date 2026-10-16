"use client";

import { adminFeesAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { Boot, useQuery, useSiteSettings } from "@/lib/live";

function major(kurus: number) {
  return String(kurus / 100).replace(".", ",");
}

function percent(value: number) {
  return String(value).replace(".", ",");
}

export default function AdminFeesPage() {
  const query = useQuery();
  const settings = useSiteSettings();
  if (!query) return <Boot />;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">ÜCRETLER</p>
        <h1 className="font-display text-4xl font-extrabold">Ücretler</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Kart bedeli lira olarak yazılır. Yükleme ve aktarım yüzde olarak yazılır. Ana bakiyeye Heleket yüklemesinde bu kesintiler yoktur.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={adminFeesAction} className="glass grid gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Kart bedeli (₺)
          <input className="field" name="bedel" inputMode="decimal" required defaultValue={major(settings.issueFeeKurus)} />
        </label>
        <label className="grid gap-1 text-sm">
          Karta yükleme komisyonu (%)
          <input className="field" name="yukleme" inputMode="decimal" required defaultValue={percent(settings.loadFeePercent)} />
        </label>
        <label className="grid gap-1 text-sm">
          Kartlar arası aktarım (%)
          <input className="field" name="aktarim" inputMode="decimal" required defaultValue={percent(settings.transferFeePercent)} />
        </label>
        <button className="btn btn-gold w-fit">Ücretleri kaydet</button>
      </form>
    </div>
  );
}
