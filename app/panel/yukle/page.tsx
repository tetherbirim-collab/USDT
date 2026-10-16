"use client";

import { useEffect, useState } from "react";
import { ClayLoadArt, CoinLogo, HeleketMark } from "@/components/pay-marks";
import { Notice } from "@/components/notice";
import { MAX_USD_MINOR, MIN_USD_MINOR, USD_RATE_AS_OF, USD_SELL_RATE, noticeText, usdMinorToKurus } from "@/lib/catalog";
import { PAYOUT_COINS, payoutCoinName } from "@/lib/coins";
import { formatRate, formatSigned, formatTL, formatUsd, formatWhen, parseTryToKurus } from "@/lib/format";
import { withdrawAction } from "@/lib/actions";
import { openHeleketPayment, readHeleketPayment } from "@/lib/heleket";
import { Boot, useQuery, useUser } from "@/lib/live";
import { creditHeleketPayment, listTransactions, snapshot } from "@/lib/store";
import type { PayoutCoin } from "@/lib/types";

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
  const [drawAmount, setDrawAmount] = useState("");
  const [drawAddress, setDrawAddress] = useState("");
  const [coin, setCoin] = useState<PayoutCoin>("usdt");
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
  const picked = PAYOUT_COINS.find((row) => row.id === coin) ?? PAYOUT_COINS[1];
  const drawKurus = parseTryToKurus(drawAmount);
  const floor = usdMinorToKurus(1000);
  const asks = snapshot()
    .payouts.filter((row) => row.userId === user.id)
    .slice()
    .reverse();

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
        className="wallet-stage glass"
        onSubmit={(event) => {
          event.preventDefault();
          if (cents !== null) void pay(cents);
        }}
      >
        <div className="wallet-copy">
          <p className="text-xs font-bold tracking-[0.18em] text-gold">CRYPTO İLE YÜKLE</p>
          <h2 className="font-display mt-1 text-3xl font-extrabold">Heleket</h2>
          <p className="mt-2 text-sm text-white/70">Komisyon yok. Yazdığın tutar ABD dolarıdır. Onaylanınca sabit kurun TL karşılığı ana bakiyeye yazılır.</p>
          <HeleketMark />
          <label className="money-field">
            <span className="money-kicker">Ödeme yapmak istediğin tutar (USD)</span>
            <span className="money-row">
              <span className="money-unit" aria-hidden>
                $
              </span>
              <input
                name="tutar"
                inputMode="decimal"
                placeholder="50"
                aria-label="Ödeme yapmak istediğin tutar, ABD doları"
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
              />
              <span className="money-code">USD</span>
            </span>
            <span className="money-hint">
              {ready && cents !== null
                ? `${formatUsd(cents)} = ${formatTL(usdMinorToKurus(cents))}`
                : `1 USD = ${formatRate(USD_SELL_RATE)} TL · 1–5.000 USD`}
            </span>
          </label>
          <button className="btn btn-gold w-fit" type="submit" disabled={pending}>
            {pending ? "Ödeme sayfası açılıyor" : "Ödeme sayfasına git"}
          </button>
          <p className="text-sm text-white/55">Onaydan sonra bu bakiye kart harcamasında kullanılır. Heleket yüklemesinde kesinti yoktur.</p>
          {waitText && <p className="text-sm text-gold">{waitText}</p>}
          {error && <p className="banner-bad">{error}</p>}
        </div>
        <ClayLoadArt />
      </form>
      <form action={withdrawAction} className="wallet-stage glass">
        <div className="wallet-copy">
          <p className="text-xs font-bold tracking-[0.18em] text-gold">ÇEKİM</p>
          <h2 className="font-display mt-1 text-3xl font-extrabold">Para çek</h2>
          <p className="mt-2 text-sm text-white/70">
            Tutar yerelde beklemeye alınır. Zincire gönderilmez. Yönetim gönderince veya iptal edince zil çalar. En az {formatTL(floor)}.
          </p>
          <label className="money-field">
            <span className="money-kicker">Tutar (TL)</span>
            <span className="money-row">
              <span className="money-unit" aria-hidden>
                ₺
              </span>
              <input
                name="tutar"
                inputMode="decimal"
                placeholder="500"
                aria-label="Çekmek istediğin tutar, Türk lirası"
                required
                value={drawAmount}
                onChange={(event) => setDrawAmount(event.target.value)}
              />
              <span className="money-code">TL</span>
            </span>
            <span className="money-hint">
              {drawKurus !== null && drawKurus > 0 ? `Çekilecek ${formatTL(drawKurus)}` : `Ana bakiye ${formatTL(user.balance)}`}
            </span>
          </label>
          <fieldset className="coin-pick">
            <legend className="money-kicker">Adres hangi coin için</legend>
            {PAYOUT_COINS.map((row) => (
              <label key={row.id} className={coin === row.id ? "coin-on" : ""}>
                <input type="radio" name="coin" value={row.id} checked={coin === row.id} onChange={() => setCoin(row.id)} />
                <CoinLogo coin={row.id} />
                <span>{row.name}</span>
              </label>
            ))}
          </fieldset>
          <label className="addr-field">
            <CoinLogo coin={coin} />
            <span>
              <span className="money-kicker">{picked.hint}</span>
              <input
                name="cuzdan"
                placeholder={picked.placeholder}
                aria-label={`${picked.name} cüzdan adresi`}
                required
                minLength={8}
                maxLength={106}
                autoComplete="off"
                spellCheck={false}
                value={drawAddress}
                onChange={(event) => setDrawAddress(event.target.value)}
              />
            </span>
          </label>
          <button className="btn btn-ghost w-fit" type="submit">
            Çekim talebi aç
          </button>
        </div>
        <div className="draw-art" aria-hidden>
          <CoinLogo coin={coin} className="draw-art-logo" />
          <p>{picked.name}</p>
          <p className="draw-art-addr">{drawAddress.trim() || picked.placeholder}</p>
          <p className="draw-art-sum">{drawKurus !== null && drawKurus > 0 ? formatTL(drawKurus) : "Tutar"}</p>
        </div>
      </form>
      <section className="ask-list">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-gold">KUYRUK</p>
          <h2 className="font-display text-3xl font-extrabold">Taleplerim</h2>
        </div>
        {asks.length === 0 && (
          <article className="ask-card ask-empty">
            <span className="ask-empty-marks" aria-hidden>
              <CoinLogo coin="btc" />
              <CoinLogo coin="usdt" />
              <CoinLogo coin="xmr" />
            </span>
            <span>
              <p className="font-semibold">Henüz çekim talebi yok.</p>
              <p className="text-sm text-white/60">BTC, USDT veya Monero adresinle açtığın talep burada bekler, gider veya iptal olur.</p>
            </span>
          </article>
        )}
        {asks.map((row) => {
          const status = row.status === "gitti" ? "Gitti" : row.status === "iptal" ? "İptal" : "Bekliyor";
          const name = payoutCoinName(row.coin) || "Coin";
          return (
            <article key={row.id} className="ask-card">
              {row.coin ? <CoinLogo coin={row.coin} /> : <span className="coin-logo coin-logo-empty" aria-hidden />}
              <div className="ask-body">
                <p className="ask-amount">{formatTL(row.amount)}</p>
                <p className="ask-coin">{name}</p>
                <p className="ask-addr">{row.wallet}</p>
              </div>
              <div className="ask-meta">
                <span className={`ask-status ask-${row.status}`}>{status}</span>
                <time dateTime={row.createdAt}>{formatWhen(row.createdAt)}</time>
              </div>
            </article>
          );
        })}
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
