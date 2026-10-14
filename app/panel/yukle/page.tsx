import { topupAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { getCurrentUser } from "@/lib/auth";
import { MAX_TOPUP_KURUS, MIN_TOPUP_KURUS } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { redirect } from "next/navigation";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const PRESETS = [500, 1500, 5000, 10000];

export default async function TopupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const sp = await searchParams;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">CÜZDAN</p>
        <h1 className="font-display text-4xl font-extrabold">Bakiye yükle</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Şu anki simülasyon bakiyesi {formatTL(user.balance)}. Tutar anında deftere yazılır.
          Banka, kart veya kripto çekilmez.
        </p>
      </div>
      <Notice code={one(sp.bildirim)} />
      <form action={topupAction} className="glass grid gap-4 rounded-[28px] p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map((amount) => (
            <button key={amount} className="btn btn-ghost" name="tutar" value={String(amount)}>
              {formatTL(amount * 100)}
            </button>
          ))}
        </div>
        <label className="grid gap-1 text-sm">
          Özel tutar (₺)
          <input className="field" name="ozel" inputMode="decimal" placeholder="2500" />
        </label>
        <button className="btn btn-gold" name="tutar" value="ozel">
          Özel tutarı yükle
        </button>
        <p className="text-sm text-white/55">
          Aralık {formatTL(MIN_TOPUP_KURUS)} – {formatTL(MAX_TOPUP_KURUS)}. Hazır tutar düğmesi
          kendi miktarını yazar; özel tutar alttaki düğmeyle yüklenir.
        </p>
      </form>
    </div>
  );
}
