"use client";

import { adminFeesAction, adminResetAction } from "@/lib/actions";
import { ADMIN_PATH } from "@/lib/auth";
import { Notice } from "@/components/notice";
import { Boot, useQuery, useSiteSettings } from "@/lib/live";
import { issuerKeyReady } from "@/lib/store";

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
          Kart bedeli ABD doları olarak yazılır. Yükleme ve aktarım yüzde olarak yazılır. Ana bakiyeye Heleket yüklemesinde bu kesintiler yoktur.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} text={query.get("metin") || undefined} />
      <form action={adminResetAction}>
        <input type="hidden" name="alan" value="ucret" />
        <input type="hidden" name="donus" value={`${ADMIN_PATH}/ucretler`} />
        <button className="btn btn-ghost">Ücretleri varsayılana al</button>
      </form>
      <form action={adminFeesAction} className="glass grid gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Kart bedeli (USD)
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
        <label className="grid gap-1 text-sm">
          Kripicard API anahtarı
          <input className="field" name="kripicard" type="password" autoComplete="off" placeholder="Anahtarı yapıştır" />
        </label>
        <p className="text-sm text-white/60">
          Anahtar yalnız sunucudaki kripicard.config.php dosyasına yazılır. Tarayıcıya dönmez, deftere yazılmaz, günlüklenmez. Boş kutu mevcut anahtarı değiştirmez.
          {issuerKeyReady() ? " Sunucuda anahtar kayıtlı." : " Sunucudaki anahtar boş. Anahtar yoksa kart numarası üretilmez."}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="anahtar_sil" value="1" />
          Kayıtlı anahtarı sil
        </label>
        <button className="btn btn-gold w-fit">Ücretleri kaydet</button>
      </form>
    </div>
  );
}
