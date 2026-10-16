"use client";

import { useState } from "react";
import { fundCardAction } from "@/lib/actions";
import { FUND_PROCESSING_USD_MINOR, MAX_USD_MINOR, MIN_USD_MINOR, loadFeeAt, noticeText, usdMinorToKurus } from "@/lib/catalog";
import { formatTL, formatUsd, parseTryToKurus } from "@/lib/format";
import { openHeleketPayment } from "@/lib/heleket";
import { useSiteSettings } from "@/lib/live";
import { HeleketMark } from "./pay-marks";
import { SubmitButton } from "./submit-button";

export function FundForm({ cardId, balance, userId, kripicard = false }: { cardId: string; balance: number; userId: string; kripicard?: boolean }) {
  const [raw, setRaw] = useState("");
  const [method, setMethod] = useState<"hesap" | "heleket">("hesap");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const settings = useSiteSettings();
  const cents = parseTryToKurus(raw);
  const gross = cents !== null ? usdMinorToKurus(cents) : 0;
  const rateFee = gross > 0 ? loadFeeAt(settings.loadFeePercent, gross) : 0;
  const processing = gross > 0 ? FUND_PROCESSING_USD_MINOR : 0;
  const due = gross + rateFee + processing;
  const floor = kripicard ? 1000 : MIN_USD_MINOR;
  const percent = String(settings.loadFeePercent).replace(".", ",");
  const ready =
    cents !== null &&
    cents >= floor &&
    cents <= MAX_USD_MINOR &&
    (method === "heleket" || (due <= balance && gross >= 1));

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
      className="load-desk"
      onSubmit={(event) => {
        if (method !== "heleket") return;
        event.preventDefault();
        void payHeleket();
      }}
    >
      <input type="hidden" name="id" value={cardId} />
      <div className="load-desk-head">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-gold">KARTA YÜKLE</p>
          <p className="font-display text-xl font-bold">Karta bakiye yükle</p>
        </div>
        <span className="load-badge">{method === "hesap" ? `%${percent} + $1,12` : "Komisyon yok"}</span>
      </div>
      <div className="load-lane" aria-hidden>
        <span className="load-pocket">
          <small>Hesap</small>
          {formatTL(balance)}
        </span>
        <span className="load-track">
          <span className="load-bead" />
        </span>
        <span className="load-pocket load-pocket-card">
          <small>Kart</small>
          CLAY
        </span>
      </div>
      <fieldset className="load-methods">
        <legend className="money-kicker">Ödeme yöntemi</legend>
        <label className={method === "hesap" ? "load-method load-method-on" : "load-method"}>
          <input type="radio" name="yontem" value="hesap" checked={method === "hesap"} onChange={() => setMethod("hesap")} />
          <span className="load-method-mark" aria-hidden>
            $
          </span>
          <span>
            <span className="block text-sm font-semibold">Ana bakiye</span>
            <span className="block text-xs text-white/55">
              {`Karta ${formatTL(gross)} yazılır. Üzerine %${percent} (${formatTL(rateFee)}) ve işlem ${formatTL(processing)} eklenir. Hesaptan ${formatTL(due)} düşer.`}
            </span>
          </span>
        </label>
        <label className={method === "heleket" ? "load-method load-method-on" : "load-method"}>
          <input type="radio" name="yontem" value="heleket" checked={method === "heleket"} onChange={() => setMethod("heleket")} />
          <HeleketMark />
          <span>
            <span className="block text-sm font-semibold">Heleket</span>
            <span className="block text-xs text-white/55">Kripto ile ana bakiyeye yazar. Bu yüklemede komisyon yoktur.</span>
          </span>
        </label>
      </fieldset>
      <label className="money-field">
        <span className="money-kicker">Tutar (USD)</span>
        <span className="money-row">
          <span className="money-unit" aria-hidden>
            $
          </span>
          <input
            name="tutar"
            inputMode="decimal"
            placeholder="20"
            aria-label="Karta yüklemek istediğin tutar, ABD doları"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            required
          />
          <span className="money-code">USD</span>
        </span>
        <span className="money-hint">{cents !== null && cents > 0 ? formatUsd(cents) : "ABD doları"}</span>
      </label>
      {method === "hesap" ? (
        <div className="grid gap-2">
          <p className="text-xs text-white/70">
            {kripicard
              ? `Göndermeden önce: Kripicard yüklemesi en az 10 USD. Karta yazılan tutarın üzerine %${percent} fonlama ve 1,12 USD işlem ücreti eklenir.`
              : `Göndermeden önce: karta yazılan tutarın üzerine %${percent} fonlama ve 1,12 USD işlem ücreti eklenir.`}
          </p>
          {gross > 0 && (
            <div className="transfer-split">
              <span>
                <small>Hesaptan</small>
                {formatTL(due)}
              </span>
              <span>
                <small>Fonlama %{percent}</small>
                {formatTL(rateFee)}
              </span>
              <span>
                <small>Karta</small>
                {formatTL(gross)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-white/70">
          Göndermeden önce: Heleket yüklemesinde komisyon yoktur. Tutarın tamamı ana bakiyeye yazılır. Kartın kullanılabilir bakiyesine geçirmek için Ana bakiye yöntemini seç; orada %{percent} kesilir.
        </p>
      )}
      {error && <p className="banner-bad">{error}</p>}
      {method === "hesap" ? (
        <SubmitButton className="btn btn-gold w-fit">{ready ? `${formatTL(due)} düşür` : "Hesaptan karta yükle"}</SubmitButton>
      ) : (
        <button className="btn btn-gold w-fit" type="submit" disabled={pending}>
          {pending ? "Ödeme sayfası açılıyor" : "Heleket ile yükle"}
        </button>
      )}
    </form>
  );
}
