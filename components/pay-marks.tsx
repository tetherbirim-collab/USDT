import { Mark } from "./mark";
import type { PayoutCoin } from "@/lib/types";

export function CoinLogo({ coin, className = "" }: { coin: PayoutCoin; className?: string }) {
  const label = coin === "btc" ? "Bitcoin" : coin === "usdt" ? "USDT" : "Monero";
  return (
    <span className={`coin-logo coin-logo-${coin} ${className}`.trim()} role="img" aria-label={label}>
      {coin === "btc" && (
        <svg viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="16" fill="#f7931a" />
          <path
            fill="#fff"
            d="M17.7 14.4c.9-.4 1.5-1.2 1.3-2.4-.2-1.5-1.4-2.1-3.2-2.4V8.2h-1.5v1.3c-.4 0-.8.1-1.2.1V8.2h-1.5v1.4H9.4v1.6s1.1 0 1.1.1c.6 0 .8.3.9.6l-.1.2v5.2c0 .1 0 .2-.1.2h-.1l-1.3 3.2h2.1v1.4h1.5v-1.4c.4 0 .8.1 1.2.1v1.3h1.5v-1.4c2 0 3.4-.9 3.6-2.6.2-1.3-.4-2.1-1.2-2.5zm-2.2-2.1c.8 0 2.6.2 2.6 1.5 0 1.3-1.8 1.5-2.6 1.5v-3zm.3 6.4c.9 0 3 .2 3 1.7s-2.1 1.7-3 1.7v-3.4z"
          />
        </svg>
      )}
      {coin === "usdt" && (
        <svg viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="16" fill="#26a17b" />
          <path fill="#fff" d="M17.6 14.2v-2.1h4.6V9.6H9.8v2.5h4.6v2.1c-3.7.2-6.5.9-6.5 1.8s2.8 1.6 6.5 1.8v6.4h3.2v-6.4c3.7-.2 6.4-.9 6.4-1.8s-2.7-1.6-6.4-1.8zm0 3.1v.1c-.1 0-.7 0-1.6 0s-1.5 0-1.6 0v-.1c-3.2-.1-5.6-.7-5.6-1.3s2.4-1.2 5.6-1.3v2.1c.1 0 .8.1 1.6.1s1.5 0 1.6-.1v-2.1c3.2.1 5.5.7 5.5 1.3s-2.3 1.2-5.5 1.3z" />
        </svg>
      )}
      {coin === "xmr" && (
        <svg viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="16" fill="#ff6600" />
          <path fill="#fff" d="M7.2 22.6V11.4l4.4 5.4 4.4-5.4 4.4 5.4 4.4-5.4v11.2h-3.3v-5.4L16 22.8l-5.5-5.6v5.4H7.2z" />
        </svg>
      )}
    </span>
  );
}

export function HeleketMark() {
  return (
    <span className="heleket-plaque">
      <svg className="heleket-sigil" viewBox="0 0 64 64" aria-hidden>
        <path fill="#f0c98a" d="M32 4 56 18v28L32 60 8 46V18L32 4z" />
        <path fill="#1a1020" d="M24 22h6.2v7.2h3.6V22H40v20h-6.2v-8.2h-3.6V42H24V22z" />
        <circle cx="32" cy="32" r="22" fill="none" stroke="#1a1020" strokeOpacity=".28" strokeWidth="1.4" />
      </svg>
      <span className="heleket-word">
        <strong>HELEKET</strong>
        <small>Kripto ödeme</small>
      </span>
    </span>
  );
}

export function ClayLoadArt() {
  return (
    <div className="clay-load" aria-hidden>
      <span className="clay-load-coin clay-load-btc">
        <CoinLogo coin="btc" />
      </span>
      <span className="clay-load-coin clay-load-usdt">
        <CoinLogo coin="usdt" />
      </span>
      <span className="clay-load-coin clay-load-xmr">
        <CoinLogo coin="xmr" />
      </span>
      <span className="clay-load-card">
        <span className="clay-load-chip" />
        <span className="clay-load-brand">CLAY</span>
        <span className="clay-load-shine" />
      </span>
    </div>
  );
}

export function AccountOrbit() {
  return (
    <div className="account-orbit" aria-hidden>
      <span className="account-orbit-core">
        <Mark className="h-12 w-12" />
        <span className="account-orbit-sheen" />
      </span>
      <span className="account-float account-float-a">
        <CoinLogo coin="btc" />
      </span>
      <span className="account-float account-float-b">
        <CoinLogo coin="usdt" />
      </span>
      <span className="account-float account-float-c">
        <CoinLogo coin="xmr" />
      </span>
      <span className="account-float account-float-d">
        <svg viewBox="0 0 32 32" aria-hidden>
          <rect x="4" y="8" width="24" height="16" rx="3" fill="#f0c98a" />
          <rect x="4" y="12" width="24" height="3" fill="#1a1020" />
          <rect x="7" y="18" width="6" height="2" rx="1" fill="#1a1020" />
        </svg>
      </span>
      <span className="account-float account-float-e">
        <svg viewBox="0 0 32 32" aria-hidden>
          <rect x="8" y="14" width="16" height="12" rx="2" fill="#8dffe4" />
          <path d="M11 14v-2.2a5 5 0 0 1 10 0V14" fill="none" stroke="#8dffe4" strokeWidth="2.4" />
        </svg>
      </span>
    </div>
  );
}
