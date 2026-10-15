"use client";

import { useState } from "react";
import { MAX_USD_MINOR, MIN_USD_MINOR, USD_RATE_AS_OF, USD_SELL_RATE, usdMinorToKurus } from "@/lib/catalog";
import { formatRate, formatTL, formatUsd, parseTryToKurus } from "@/lib/format";

export function UsdField() {
  const [text, setText] = useState("");
  const minor = parseTryToKurus(text);
  const ready = minor !== null && minor >= MIN_USD_MINOR && minor <= MAX_USD_MINOR;
  const kurus = ready ? usdMinorToKurus(minor) : null;

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 p-4">
      <label className="grid gap-1 text-sm">
        Dolar tutarı
        <input
          className="field"
          name="dolar"
          inputMode="decimal"
          placeholder="50"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <p className="text-sm text-white/70">
        1 USD = {formatRate(USD_SELL_RATE)} ₺ · simülasyon döviz satış kuru, {USD_RATE_AS_OF}. Canlı kur
        çekilmez.
      </p>
      {kurus !== null && (
        <p className="text-sm font-semibold text-gold">
          {formatUsd(minor ?? 0)} bakiyeye yazılır. Liraya çevrilirse {formatTL(kurus)}.
        </p>
      )}
      <button className="btn btn-gold w-fit" name="tutar" value="usd" disabled={kurus === null}>
        Dolar bakiyesine yaz
      </button>
    </div>
  );
}
