"use client";

import { adminFeesAction, adminPstAction } from "@/lib/actions";
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
      <form action={adminPstAction} className="glass grid gap-3 rounded-[28px] p-5">
        <p className="text-xs font-bold tracking-[0.22em] text-gold">PST.NET</p>
        <p className="text-sm text-white/75">
          PST’te açtığın kart, sipariş ve işlem geçmişi buraya düşer. Kart bedeli, yükleme ve aktarım oranları onların verdiği oranın %8 üstüne yazılır. Hareket tutarı PST’teki dolar olarak kalır.
        </p>
        <p className="text-sm text-white/80">
          {settings.pst?.on
            ? `Bağlı · anahtar ••••${settings.pst.tokenTail} · ${settings.pst.cards} kart · ${settings.pst.transactions} hareket`
            : "Henüz bağlı değil. PST API anahtarını yapıştır."}
          {settings.pst?.error ? ` ${settings.pst.error}` : ""}
        </p>
        {settings.pst?.on ? (
          <p className="text-sm text-white/70">
            PST kart bedeli {String(settings.pst.issueSourceUsd).replace(".", ",")} USD, yükleme %{String(settings.pst.loadSource).replace(".", ",")}
            {settings.pst.transferSource > 0 ? `, çekim %${String(settings.pst.transferSource).replace(".", ",")}` : ""}. Sitede bu rakamların %8 fazlası durur.
          </p>
        ) : null}
        <label className="grid gap-1 text-sm">
          PST API anahtarı
          <input className="field" name="anahtar" type="password" autoComplete="off" placeholder="Bearer anahtarın" />
        </label>
        <p className="text-xs text-white/50">Kart açıklamasına uye:kullanici yazarsan o kart ilgili üyeye düşer. Boşsa yönetici hesabında durur.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-gold">Bağla ve aktar</button>
          <button className="btn btn-ghost" name="sil" value="on">
            Bağlantıyı kapat
          </button>
        </div>
      </form>
    </div>
  );
}
