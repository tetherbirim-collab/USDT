"use client";

import { useEffect, useState } from "react";
import { Notice } from "@/components/notice";
import { MAX_USD_MINOR, MIN_USD_MINOR, USD_RATE_AS_OF, USD_SELL_RATE, noticeText, usdMinorToKurus } from "@/lib/catalog";
import { formatRate, formatSigned, formatTL, formatUsd, formatWhen, parseTryToKurus } from "@/lib/format";
import { withdrawAction } from "@/lib/actions";
import { openHeleketPayment, readHeleketPayment } from "@/lib/heleket";
import { Boot, useQuery, useUser } from "@/lib/live";
import { creditHeleketPayment, listTransactions, snapshot } from "@/lib/store";

function explain(error: string): string {
  return noticeText(error.startsWith("e-") ? error : `e-${error}`) || "Heleket ödeme sayfası açılmadı.";
}

function Loaded({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show);
  if (!open) return null;
  return (
    <div className="load-veil" role="presentation">
      <div className="load-card" role="status">
        <p className="text-xs font-bold tracking-[0.22em] text-gold">BAKİYE</p>
        <h2 className="font-display mt-2 text-3xl font-extrabold">Bakiyeniz yüklendi</h2>
        <p className="load-ad" aria-label="CLAY sanal kart. KYC gerekmez. Anonim sanal kart oluştur ve hemen harca.">
          <span className="load-ad-track">
            <span>CLAY SANAL KART · KYC GEREKMEZ · ANONİM SANAL KART · HEMEN HARCA · </span>
            <span aria-hidden="true">CLAY SANAL KART · KYC GEREKMEZ · ANONİM SANAL KART · HEMEN HARCA · </span>
          </span>
        </p>
        <p className="mt-3 text-sm text-white/75">Tutar cüzdana yazıldı. Aynı haber zilde de durur.</p>
        <button type="button" className="btn btn-gold mt-4" onClick={() => setOpen(false)}>
          Tamam
        </button>
      </div>
    </div>
  );
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
          const code = await creditHeleketPayment({ userId, orderId, cents: payment.cents });
          if (code === "ok" || code === "var") {
            window.location.assign("/panel/yukle/?bildirim=yuklendi");
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
  const loaded = query.get("bildirim") === "yuklendi";

  return (
    <div className="grid gap-5">
      <Loaded show={loaded} />
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">CÜZDAN</p>
        <h1 className="font-display text-4xl font-extrabold">Bakiye yükle</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Ana bakiyede {formatTL(user.balance)} durur. Crypto yüklemesine komisyon yok. 1 USD = {formatRate(USD_SELL_RATE)} TL · {USD_RATE_AS_OF}.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form
        className="glass grid max-w-xl gap-4 rounded-[28px] p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (cents !== null) void pay(cents);
        }}
      >
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-gold">CRYPTO İLE YÜKLE</p>
          <h2 className="font-display mt-1 text-2xl font-bold">Heleket</h2>
        </div>
        <label className="grid gap-1 text-sm">
          Ödeme yapmak istediğin tutar (USD)
          <input
            className="field"
            name="tutar"
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
        <button className="btn btn-gold w-fit" type="submit" disabled={pending}>
          {pending ? "Ödeme sayfası açılıyor" : "Ödeme sayfasına git"}
        </button>
        <p className="text-sm text-white/55">1–5.000 USD. Onaydan sonra bu bakiye kart harcamasında kullanılır.</p>
        {waitText && <p className="text-sm text-gold">{waitText}</p>}
        {error && <p className="banner-bad">{error}</p>}
      </form>
      <form action={withdrawAction} className="glass grid max-w-xl gap-4 rounded-[28px] p-5">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-gold">ÇEKİM</p>
          <h2 className="font-display mt-1 text-2xl font-bold">Para çek</h2>
          <p className="mt-2 text-sm text-white/70">Tutar hemen beklemeye alınır. Yönetim gönderince veya iptal edince zil çalar. En az 10 USD karşılığı.</p>
        </div>
        <label className="grid gap-1 text-sm">
          Tutar (TL)
          <input className="field" name="tutar" inputMode="decimal" placeholder="500" required />
        </label>
        <label className="grid gap-1 text-sm">
          Cüzdan adresi
          <input className="field" name="cuzdan" placeholder="TRC20 veya cüzdan kodu" required />
        </label>
        <button className="btn btn-ghost w-fit" type="submit">
          Çekim talebi aç
        </button>
      </form>
      <section className="grid max-w-xl gap-3">
        <h2 className="font-display text-2xl font-bold">Taleplerim</h2>
        {snapshot().payouts.filter((row) => row.userId === user.id).length === 0 && <p className="text-sm text-white/55">Henüz çekim talebi yok.</p>}
        {snapshot().payouts
          .filter((row) => row.userId === user.id)
          .map((row) => (
            <article key={row.id} className="glass rounded-[24px] px-4 py-3 text-sm">
              <p className="font-semibold">{formatTL(row.amount)}</p>
              <p className="text-white/70">{row.wallet}</p>
              <p className="mt-1 text-xs text-white/45">
                {formatWhen(row.createdAt)} · {row.status === "bekliyor" ? "Bekliyor" : row.status === "gitti" ? "Gönderildi" : "İptal"}
              </p>
            </article>
          ))}
      </section>
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
