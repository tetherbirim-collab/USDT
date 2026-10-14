import { closeAction, freezeAction, spendAction } from "@/lib/actions";
import { MERCHANTS } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import type { Card } from "@/lib/types";
import { SubmitButton } from "./submit-button";

export function CardActions({ card }: { card: Card }) {
  const kalan = card.limit - card.spent;
  return (
    <div className="mt-4 grid gap-3">
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>Kalan tavan</span>
        <span className="font-semibold text-white">{formatTL(kalan)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-mint"
          style={{ width: `${Math.min(100, Math.round((card.spent / card.limit) * 100))}%` }}
        />
      </div>
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
              Prova işletmesi
              <select className="field" name="isletme" required defaultValue={MERCHANTS[0]}>
                {MERCHANTS.map((merchant) => (
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
      {card.status !== "kapali" && (
        <details className="rounded-2xl border border-white/10 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#ffd0dc]">Kartı kapat</summary>
          <form action={closeAction} className="mt-3 grid gap-2">
            <input type="hidden" name="id" value={card.id} />
            <label className="flex items-start gap-2 text-sm text-white/75">
              <input type="checkbox" name="onay" required className="mt-1" />
              Bu simülasyon kartını kapatıyorum. Geri açılmaz.
            </label>
            <SubmitButton className="btn btn-danger">Kapat</SubmitButton>
          </form>
        </details>
      )}
    </div>
  );
}
