"use client";

import { useState } from "react";
import { fundCardAction } from "@/lib/actions";
import { MAX_USD_MINOR, MIN_USD_MINOR, loadFeeAt, usdMinorToKurus } from "@/lib/catalog";
import { formatTL, parseTryToKurus } from "@/lib/format";
import { useSiteSettings } from "@/lib/live";
import { SubmitButton } from "./submit-button";

export function FundForm({ cardId, balance }: { cardId: string; balance: number }) {
  const [raw, setRaw] = useState("");
  const settings = useSiteSettings();
  const cents = parseTryToKurus(raw);
  const gross = cents !== null ? usdMinorToKurus(cents) : 0;
  const commission = gross > 0 ? loadFeeAt(settings.loadFeePercent, gross) : 0;
  const net = Math.max(0, gross - commission);
  const ready = cents !== null && cents >= MIN_USD_MINOR && cents <= MAX_USD_MINOR && gross <= balance && net >= 1;

  return (
    <form action={fundCardAction} className="grid gap-2 rounded-[22px] border border-gold/25 bg-black/25 p-3">
      <input type="hidden" name="id" value={cardId} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Hesaptan karta yükle</p>
        <span className="text-[11px] font-bold tracking-[0.16em] text-gold">%{String(settings.loadFeePercent).replace(".", ",")}</span>
      </div>
      <p className="text-xs text-white/50">
        Ana bakiyeden ayrılan tutarın %{String(settings.loadFeePercent).replace(".", ",")} kadarı kesilir. Kalanı kartın tavanına yazılır.
      </p>
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
      {gross > 0 && (
        <div className="transfer-split">
          <span>
            <small>Hesaptan</small>
            {formatTL(gross)}
          </span>
          <span>
            <small>Komisyon</small>
            {formatTL(commission)}
          </span>
          <span>
            <small>Karta</small>
            {formatTL(net)}
          </span>
        </div>
      )}
      <p className="text-xs text-white/45">Ana bakiye {formatTL(balance)}. Heleket yüklemesinde bu komisyon yoktur.</p>
      <SubmitButton className="btn btn-gold w-fit" disabled={!ready}>
        {ready ? `${formatTL(gross)} düşür` : "Tutarı yaz"}
      </SubmitButton>
    </form>
  );
}
