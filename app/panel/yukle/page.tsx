"use client";

import { useEffect, useState } from "react";
import { Notice } from "@/components/notice";
import { MAX_USD_MINOR, MIN_USD_MINOR, USD_RATE_AS_OF, USD_SELL_RATE, noticeText, usdMinorToKurus } from "@/lib/catalog";
import { formatRate, formatSigned, formatTL, formatUsd, formatWhen, parseTryToKurus } from "@/lib/format";
import { openHeleketPayment, readHeleketPayment } from "@/lib/heleket";
import { Boot, useQuery, useUser } from "@/lib/live";
import { creditHeleketPayment, listTransactions } from "@/lib/store";

const PRESETS = [10, 20, 50, 100];

function explain(error: string): string {
  return noticeText(error.startsWith("e-") ? error : `e-${error}`) || "Heleket ödeme sayfası açılmadı.";
}

export default function TopupPage() {
  const user = useUser();
  const query = useQuery();
  const [custom, setCustom] = useState("");
  const [pending, setPending] = useState(false);
  const [waitText, setWaitText] = useState("");
  const [error, setError] = useState("");
  const userId = user?.id ?? "";

  useEffect(() => {
    if (!userId) return;
    const found = new URLSearchParams(window.location.search).get("siparis");
    if (!found) return;
    const orderId: string = found;
    let stopped = false;
    let tries = 0;

    async function look() {
      if (stopped) return;
      tries += 1;
      setWaitText("Heleket ödemesi kontrol ediliyor.");
      try {
        const payment = await readHeleketPayment(orderId, userId);
        if (payment.status === "paid" || payment.status === "paid_over") {
          const code = creditHeleketPayment({ userId, orderId, cents: payment.cents });
          if (code === "ok") {
            window.location.assign("/panel/yukle/?bildirim=yuklendi");
            return;
          }
          if (code === "var") {
            setWaitText("");
            return;
          }
          setError(code === "tavan" ? explain("e-tavan") : explain("e-yok"));
          setWaitText("");
          return;
        }
        if (payment.final) {
          setWaitText("");
          setError(explain("e-odeme"));
          return;
        }
      } catch (reason) {
        const code = reason instanceof Error ? reason.message : "heleket";
        if (code === "yok" && tries < 8) {
          window.setTimeout(look, 4000);
          return;
        }
        setError(explain(code === "yok" ? "e-odeme" : "e-heleket"));
        setWaitText("");
        return;
      }
      if (tries < 15) window.setTimeout(look, 4000);
      else setWaitText("Ödeme hâlâ onay bekliyor. Bu sayfayı biraz sonra yenile.");
    }

    void look();
    return () => {
      stopped = true;
    };
  }, [userId]);

  async function pay(cents: number) {
    if (!user || pending) return;
    if (cents < MIN_USD_MINOR || cents > MAX_USD_MINOR) {
      setError(explain("e-tutar"));
      return;
    }
    setError("");
    setPending(true);
    try {
      await openHeleketPayment(cents, user.id);
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "heleket";
      setError(explain(code === "anahtar" ? "e-anahtar" : code === "tutar" ? "e-tutar" : "e-heleket"));
      setPending(false);
    }
  }

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
          Tutar dolar olarak Heleket’e gider. Ödeme onaylanınca ana bakiyede {formatTL(user.balance)} durur. Bu yüklemeye komisyon yok. Kartına aktarırken %7,3 kesilir. 1 USD = {formatRate(USD_SELL_RATE)} TL · {USD_RATE_AS_OF}.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form
        className="glass grid gap-4 rounded-[28px] p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (cents !== null) void pay(cents);
        }}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map((dollars) => (
            <button
              key={dollars}
              type="button"
              className="btn btn-ghost h-auto flex-col gap-0.5 py-3"
              disabled={pending}
              onClick={() => void pay(dollars * 100)}
            >
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
        <button className="btn btn-gold w-fit" type="submit" disabled={!ready || pending}>
          {pending ? "Heleket açılıyor" : "Heleket ile öde"}
        </button>
        <p className="text-sm text-white/55">1–5.000 USD. Onaydan sonra bu bakiye kart harcamasında kullanılır.</p>
        {waitText && <p className="text-sm text-gold">{waitText}</p>}
        {error && <p className="banner-bad">{error}</p>}
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
