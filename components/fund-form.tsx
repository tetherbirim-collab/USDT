"use client";

import { useState } from "react";
import { fundCardAction } from "@/lib/actions";
import { MAX_USD_MINOR, MIN_USD_MINOR, loadFeeAt, noticeText, usdMinorToKurus } from "@/lib/catalog";
import { formatTL, parseTryToKurus } from "@/lib/format";
import { openHeleketPayment } from "@/lib/heleket";
import { useSiteSettings } from "@/lib/live";
import { SubmitButton } from "./submit-button";

export function FundForm({ cardId, balance, userId }: { cardId: string; balance: number; userId: string }) {
  const [raw, setRaw] = useState("");
  const [method, setMethod] = useState<"hesap" | "heleket">("hesap");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const settings = useSiteSettings();
  const cents = parseTryToKurus(raw);
  const gross = cents !== null ? usdMinorToKurus(cents) : 0;
  const commission = gross > 0 ? loadFeeAt(settings.loadFeePercent, gross) : 0;
  const net = Math.max(0, gross - commission);
  const percent = String(settings.loadFeePercent).replace(".", ",");
  const ready =
    cents !== null &&
    cents >= MIN_USD_MINOR &&
    cents <= MAX_USD_MINOR &&
    (method === "heleket" || (gross <= balance && net >= 1));

  async function payHeleket() {
    if (!ready || cents === null || pending) return;
    setError("");
    setPending(true);
    try {
      await openHeleketPayment(cents, userId);
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "heleket";
      setError(noticeText(code === "anahtar" ? "e-anahtar" : code === "tutar" ? "e-tutar" : "e-heleket") || "Heleket ödeme sayfası açılmadı.");
      setPending(false);
    }
  }

  return (
    <form
      action={method === "hesap" ? fundCardAction : undefined}
      className="grid gap-2 rounded-[22px] border border-gold/25 bg-black/25 p-3"
      onSubmit={(event) => {
        if (method !== "heleket") return;
        event.preventDefault();
        void payHeleket();
      }}
    >
      <input type="hidden" name="id" value={cardId} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Karta bakiye yükle</p>
        <span className="text-[11px] font-bold tracking-[0.16em] text-gold">
          {method === "hesap" ? `%${percent}` : "Komisyon yok"}
        </span>
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-xs font-bold tracking-[0.16em] text-gold">ÖDEME YÖNTEMİ</legend>
        <label className={`flex cursor-pointer items-start gap-2 rounded-2xl border px-3 py-2 ${method === "hesap" ? "border-gold bg-white/10" : "border-white/10"}`}>
          <input type="radio" name="yontem" value="hesap" checked={method === "hesap"} onChange={() => setMethod("hesap")} />
          <span>
            <span className="block text-sm font-semibold">Ana bakiye</span>
            <span className="block text-xs text-white/55">Hesaptan düşer. Göndermeden önce %{percent} yükleme komisyonu kesilir.</span>
          </span>
        </label>
        <label className={`flex cursor-pointer items-start gap-2 rounded-2xl border px-3 py-2 ${method === "heleket" ? "border-gold bg-white/10" : "border-white/10"}`}>
          <input type="radio" name="yontem" value="heleket" checked={method === "heleket"} onChange={() => setMethod("heleket")} />
          <span>
            <span className="block text-sm font-semibold">Heleket</span>
            <span className="block text-xs text-white/55">Kripto ile ana bakiyeye yazar. Bu yüklemede komisyon yoktur.</span>
          </span>
        </label>
      </fieldset>
      <label className="grid gap-1 text-xs text-white/70">
        Tutar (USD)
        <input
          className="field"
          name="tutar"
          inputMode="decimal"
          placeholder="20"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          required
        />
      </label>
      {method === "hesap" ? (
        <div className="grid gap-2">
          <p className="text-xs text-white/70">
            Göndermeden önce: ana bakiyeden ayrılan tutarın %{percent} kadarı yükleme komisyonu olarak kesilir. Kalan, kartın kullanılabilir bakiyesine yazılır.
          </p>
          {gross > 0 && (
            <div className="transfer-split">
              <span>
                <small>Hesaptan</small>
                {formatTL(gross)}
              </span>
              <span>
                <small>Komisyon %{percent}</small>
                {formatTL(commission)}
              </span>
              <span>
                <small>Karta</small>
                {formatTL(net)}
              </span>
            </div>
          )}
          <p className="text-xs text-white/45">Ana bakiye {formatTL(balance)}.</p>
        </div>
      ) : (
        <p className="text-xs text-white/70">
          Göndermeden önce: Heleket yüklemesinde komisyon yoktur. Tutarın tamamı ana bakiyeye yazılır. Kartın kullanılabilir bakiyesine geçirmek için Ana bakiye yöntemini seç; orada %{percent} kesilir.
        </p>
      )}
      {error && <p className="banner-bad">{error}</p>}
      {method === "hesap" ? (
        <SubmitButton className="btn btn-gold w-fit">{ready ? `${formatTL(gross)} düşür` : "Hesaptan karta yükle"}</SubmitButton>
      ) : (
        <button className="btn btn-gold w-fit" type="submit" disabled={pending}>
          {pending ? "Ödeme sayfası açılıyor" : "Heleket ile yükle"}
        </button>
      )}
    </form>
  );
}
