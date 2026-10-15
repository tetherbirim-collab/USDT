import Link from "next/link";
import { cancelOrderAction, closeAction, freezeAction, refundAction, renewAction, spendAction } from "@/lib/actions";
import { KIND_LABEL, merchantsFor } from "@/lib/catalog";
import { formatSigned, formatTL, formatUsd, formatWhen } from "@/lib/format";
import type { Card, Tx } from "@/lib/types";
import { OrderSlip } from "./order-slip";
import { SubmitButton } from "./submit-button";
import { TransferForm } from "./transfer-form";

function heat(percent: number) {
  if (percent >= 100) return { bar: "linear-gradient(90deg,#ff6a3d,#ff2d3a)", ink: "#ff8b96" };
  if (percent >= 80) return { bar: "linear-gradient(90deg,#f0a202,#ff3b4e)", ink: "#ffb0b8" };
  if (percent >= 50) return { bar: "linear-gradient(90deg,#f0c98a,#e07a2f)", ink: "#f0c98a" };
  return { bar: "linear-gradient(90deg,#f0c98a,#8dffe4)", ink: "#ffffff" };
}

export function CardActions({
  card,
  entries = [],
  peers = [],
}: {
  card: Card;
  entries?: Tx[];
  peers?: { id: string; label: string }[];
}) {
  const kalan = card.limit - card.spent;
  const percent = card.limit > 0 ? Math.min(100, Math.round((card.spent / card.limit) * 100)) : 0;
  const tone = heat(percent);
  const finished = kalan <= 0;
  if (card.status === "hazirlaniyor") {
    return (
      <div className="mt-4 grid gap-3">
        <OrderSlip card={card} />
        <p className="text-xs text-white/50">
          Bu bilgiler simülasyon test verisidir. Gerçek üye işyerinde kullanılamaz.
        </p>
        <form action={cancelOrderAction}>
          <input type="hidden" name="id" value={card.id} />
          <SubmitButton className="btn btn-danger w-fit">Siparişi iptal et</SubmitButton>
        </form>
      </div>
    );
  }
  return (
    <div className="mt-4 grid gap-3">
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>Kalan tavan</span>
        <span className="font-semibold" style={{ color: tone.ink }}>
          {formatTL(kalan)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width,background] duration-300"
          style={{ width: `${percent}%`, background: tone.bar }}
        />
      </div>
      {finished ? (
        <Link href="/panel/yukle" className="btn btn-gold w-fit">
          Bakiye yükle
        </Link>
      ) : (
        <button type="button" className="btn btn-ghost w-fit opacity-40" disabled>
          Bakiye yükle
        </button>
      )}
      {card.status !== "kapali" && peers.length > 0 && kalan > 0 && (
        <TransferForm cardId={card.id} kalan={kalan} peers={peers} />
      )}
      {card.spent > 0 && (
        <form action={renewAction} className="grid gap-1">
          <input type="hidden" name="id" value={card.id} />
          <SubmitButton className="btn btn-gold w-fit">Tavanı yenile</SubmitButton>
          <p className="text-xs text-white/50">Harcama sayacı sıfırlanır. Cüzdandan düşen tutar geri gelmez.</p>
        </form>
      )}
      <p className="text-xs text-white/50">
        Bu bilgiler simülasyon test verisidir. Gerçek üye işyerinde kullanılamaz.
      </p>
      <div className="flex flex-wrap gap-2">
        {card.status === "aktif" && (
          <form action={freezeAction}>
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="mod" value="dondur" />
            <SubmitButton className="btn btn-ghost">Dondur</SubmitButton>
          </form>
        )}
        {card.status === "donduruldu" && (
          <form action={freezeAction}>
            <input type="hidden" name="id" value={card.id} />
            <input type="hidden" name="mod" value="coz" />
            <SubmitButton className="btn btn-gold">Çöz</SubmitButton>
          </form>
        )}
      </div>
      {card.status === "aktif" && (
        <details className="rounded-2xl border border-white/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Simüle harcama</summary>
          <form action={spendAction} className="mt-3 grid gap-2">
            <input type="hidden" name="id" value={card.id} />
            <label className="grid gap-1 text-xs text-white/70">
              Bu türün prova işletmesi
              <select className="field" name="isletme" required defaultValue={merchantsFor(card.type)[0]}>
                {merchantsFor(card.type).map((merchant) => (
                  <option key={merchant}>{merchant}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-white/70">
              Tutar (₺)
              <input className="field" name="tutar" inputMode="decimal" placeholder="120" required />
            </label>
            <SubmitButton className="btn btn-ghost">Harcama yaz</SubmitButton>
          </form>
        </details>
      )}
      {card.status === "aktif" && card.spent > 0 && (
        <details className="rounded-2xl border border-white/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Simüle iade</summary>
          <form action={refundAction} className="mt-3 grid gap-2">
            <input type="hidden" name="id" value={card.id} />
            <label className="grid gap-1 text-xs text-white/70">
              Tutar (₺)
              <input className="field" name="tutar" inputMode="decimal" placeholder="40" required />
            </label>
            <p className="text-xs text-white/50">
              En fazla {formatTL(card.spent)} geri yazılır. Tutar cüzdana döner, tavan açılır.
            </p>
            <SubmitButton className="btn btn-ghost">İade yaz</SubmitButton>
          </form>
        </details>
      )}
      {card.status !== "kapali" && (
        <details className="rounded-2xl border border-white/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#ffd0dc]">Kartı kapat</summary>
          <form action={closeAction} className="mt-3 grid gap-2">
            <input type="hidden" name="id" value={card.id} />
            <label className="flex items-start gap-2 text-sm text-white/75">
              <input type="checkbox" name="onay" required className="mt-1" />
              Bu simülasyon kartını kapatıyorum. Geri açılmaz. Basım ücreti bakiyeye geri yazılır.
            </label>
            <SubmitButton className="btn btn-danger">Kapat</SubmitButton>
          </form>
        </details>
      )}
      {entries.length > 0 && (
        <div className="rounded-2xl border border-white/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Bu kartın hareketi</p>
            <Link href={`/panel/islemler?kart=${card.id}`} className="text-xs font-semibold text-gold">
              Ödemeler
            </Link>
          </div>
          <ul className="mt-2 grid gap-2">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="block">{entry.title}</span>
                  <span className="text-xs text-white/45">
                    {formatWhen(entry.createdAt)} · {KIND_LABEL[entry.kind]}
                  </span>
                </span>
                <span className={entry.amount > 0 ? "font-semibold text-mint" : "font-semibold"}>
                  {entry.amount === 0 && entry.usdMinor ? formatUsd(entry.usdMinor) : formatSigned(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
