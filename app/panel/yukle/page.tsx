"use client";

import { topupAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { MAX_USD_MINOR, MIN_USD_MINOR, USD_RATE_AS_OF, USD_SELL_RATE, usdMinorToKurus } from "@/lib/catalog";
import { formatRate, formatSigned, formatTL, formatUsd, formatWhen, parseTryToKurus } from "@/lib/format";
import { Boot, useQuery, useUser } from "@/lib/live";
import { listTransactions } from "@/lib/store";
import { useState } from "react";

const PRESETS = [10, 20, 50, 100];

export default function TopupPage() {
  const user = useUser();
  const query = useQuery();
  const [custom, setCustom] = useState("");
  if (!user || !query) return <Boot />;
  const receipt = listTransactions(user.id).find((entry) => entry.kind === "yukleme" && entry.status === "tamamlandi");
  const cents = parseTryToKurus(custom);
  const ready = cents !== null && cents >= MIN_USD_MINOR && cents <= MAX_USD_MINOR;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">CÜZDAN</p>
        <h1 className="font-display text-4xl font-extrabold">Bakiye yükle</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Tutar dolar olarak girilir. Bakiyede {formatTL(user.balance)} durur. Bu, sabit kurun TL karşılığıdır. 1 USD = {formatRate(USD_SELL_RATE)} TL · {USD_RATE_AS_OF}.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={topupAction} className="glass grid gap-4 rounded-[28px] p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map((dollars) => (
            <button key={dollars} className="btn btn-ghost h-auto flex-col gap-0.5 py-3" name="tutar" value={String(dollars)}>
              {formatUsd(dollars * 100)}
              <span className="block text-xs font-semibold text-gold">{formatTL(usdMinorToKurus(dollars * 100))}</span>
            </button>
          ))}
        </div>
        <label className="grid gap-1 text-sm">
          Tutar (USD)
          <input
            className="field"
            name="ozel"
            inputMode="decimal"
            placeholder="50"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
          />
        </label>
        {ready && cents !== null && (
          <p className="text-sm font-semibold text-gold">
            {formatUsd(cents)} karşılığı {formatTL(usdMinorToKurus(cents))}
          </p>
        )}
        <button className="btn btn-gold w-fit" name="tutar" value="ozel" disabled={!ready}>
          Karşılığı yaz
        </button>
        <p className="text-sm text-white/55">1–5.000 USD.</p>
      </form>
      {receipt && (
        <article className="glass max-w-xl rounded-[28px] p-5">
          <p className="text-xs font-bold tracking-[0.18em] text-gold">SON FİŞ</p>
          <h2 className="font-display mt-1 text-2xl font-bold">{receipt.title}</h2>
          <p className="mt-2 text-2xl font-bold text-mint">{formatSigned(receipt.amount)}</p>
          <p className="mt-2 text-sm text-white/75">{receipt.note}</p>
          <p className="mt-2 text-xs text-white/45">{formatWhen(receipt.createdAt)}</p>
        </article>
      )}
    </div>
  );
}
