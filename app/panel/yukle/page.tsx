import { convertUsdAction, topupAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { UsdField } from "@/components/usd-field";
import { getCurrentUser } from "@/lib/auth";
import { MAX_TOPUP_KURUS, MIN_TOPUP_KURUS } from "@/lib/catalog";
import { formatSigned, formatTL, formatUsd, formatWhen } from "@/lib/format";
import { listTransactions } from "@/lib/store";
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
  const receipt = listTransactions(user.id).find((entry) => entry.kind === "yukleme" && entry.status === "tamamlandi");

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">CÜZDAN</p>
        <h1 className="font-display text-4xl font-extrabold">Bakiye yükle</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Lira bakiyesi {formatTL(user.balance)}. Dolar bakiyesi {formatUsd(user.usdMinor)}. Dolar
          ayrı durur; harcama lira bakiyesinden düşer. Çevirince fişte ikisi de yazar. Banka, kart veya
          kripto çekilmez.
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
        <button className="btn btn-gold w-fit" name="tutar" value="ozel">
          Özel tutarı yükle
        </button>
        <UsdField />
        <p className="text-sm text-white/55">
          Lira aralığı {formatTL(MIN_TOPUP_KURUS)} – {formatTL(MAX_TOPUP_KURUS)}. Dolar bakiyesi 1–5.000
          USD. Hazır tutar düğmesi kendi miktarını yazar.
        </p>
      </form>
      <form action={convertUsdAction} className="glass grid max-w-xl gap-3 rounded-[28px] p-5">
        <p className="text-sm font-semibold">Doları liraya çevir</p>
        <p className="text-sm text-white/70">Bakiyedeki dolar: {formatUsd(user.usdMinor)}</p>
        <button className="btn btn-gold w-fit" name="tutar" value="hepsi" disabled={user.usdMinor <= 0}>
          Tümünü liraya çevir
        </button>
        <label className="grid gap-1 text-sm">
          Bir kısmı (USD)
          <input className="field" name="dolar" inputMode="decimal" placeholder="10" />
        </label>
        <button className="btn btn-ghost w-fit" name="tutar" value="ozel">
          Bu kadarını çevir
        </button>
      </form>
      {receipt && (
        <article className="glass max-w-xl rounded-[28px] p-5">
          <p className="text-xs font-bold tracking-[0.18em] text-gold">SON FİŞ</p>
          <h2 className="font-display mt-1 text-2xl font-bold">{receipt.title}</h2>
          <p className="mt-2 text-2xl font-bold text-mint">
            {receipt.amount === 0 && receipt.usdMinor ? formatUsd(receipt.usdMinor) : formatSigned(receipt.amount)}
          </p>
          {receipt.amount !== 0 && receipt.usdMinor ? (
            <p className="text-sm text-mint">{formatUsd(receipt.usdMinor)}</p>
          ) : null}
          <p className="mt-2 text-sm text-white/75">{receipt.note}</p>
          <p className="mt-2 text-xs text-white/45">{formatWhen(receipt.createdAt)}</p>
        </article>
      )}
    </div>
  );
}
