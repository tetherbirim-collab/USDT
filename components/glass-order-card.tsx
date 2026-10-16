import { CARD_TYPES } from "@/lib/catalog";
import type { CardTypeId, OrderStatus } from "@/lib/types";

function TypeGlyph({ type }: { type: CardTypeId }) {
  if (type === "facebook_ads") {
    return (
      <svg viewBox="0 0 48 48" className="glass-order-mark" aria-hidden>
        <rect width="48" height="48" rx="13" fill="#fff" />
        <path
          fill="#1877F2"
          d="M26.4 36.5v-8.4h2.8l.5-3.2h-3.3v-2c0-1 .3-1.6 1.7-1.6h1.8v-2.9c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.1H19v3.2h3.9v8.4h3.5z"
        />
      </svg>
    );
  }
  if (type === "tiktok") {
    const note =
      "M21.2 11.2h3.4c.5 2.3 2 4 4.3 4.6v3.5c-1.6-.1-3-.6-4.3-1.5v8.4c0 3.5-2.7 6.2-6.4 6.2s-6.4-2.8-6.4-6.3 2.8-6.3 6.4-6.3c.4 0 .8 0 1.2.1v3.7c-.4-.2-.8-.3-1.2-.3-1.6 0-2.8 1.2-2.8 2.8s1.2 2.8 2.8 2.8 2.8-1.2 2.8-2.8V11.2z";
    return (
      <svg viewBox="0 0 48 48" className="glass-order-mark" aria-hidden>
        <rect width="48" height="48" rx="13" fill="#111" />
        <path d={note} fill="#25F4EE" transform="translate(-1.5 1.1)" />
        <path d={note} fill="#FE2C55" transform="translate(1.5 -1.1)" />
        <path d={note} fill="#fff" />
      </svg>
    );
  }
  if (type === "google_ads") {
    return (
      <svg viewBox="0 0 48 48" className="glass-order-mark" aria-hidden>
        <rect width="48" height="48" rx="13" fill="#fff" />
        <circle cx="17" cy="17" r="5.4" fill="#4285F4" />
        <circle cx="31" cy="17" r="5.4" fill="#EA4335" />
        <circle cx="17" cy="31" r="5.4" fill="#FBBC05" />
        <circle cx="31" cy="31" r="5.4" fill="#34A853" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="glass-order-mark" aria-hidden>
      <rect width="48" height="48" rx="13" fill="#16120c" />
      <path d="M24 8.5 38.5 18.2 34.2 38H13.8L9.5 18.2 24 8.5z" fill="#c8923e" />
      <path d="M24 8.5 38.5 18.2 24 21.5 9.5 18.2z" fill="#ffe7b0" />
      <path d="M24 21.5 38.5 18.2 34.2 38 24 33.2z" fill="#8d5e22" opacity=".55" />
      <path d="M24 14.2 31.2 18.8 24 28.8 16.8 18.8z" fill="#fff4d4" opacity=".85" />
    </svg>
  );
}

export function GlassOrderCard({
  type,
  label,
  code,
  owner,
  status,
  seconds,
}: {
  type: CardTypeId;
  label: string;
  code: string;
  owner: string;
  status?: OrderStatus;
  seconds?: number;
}) {
  const name = CARD_TYPES[type]?.name ?? "Kart";
  const preparing = status === "hazirlaniyor";
  const cancelled = status === "iptal";
  const seal = preparing ? (typeof seconds === "number" && seconds > 0 ? `Hazırlanıyor · ${seconds} sn` : "Hazırlanıyor") : "";
  return (
    <article className={`glass-order glass-order-${type}`} aria-label={`${code} ${name} ${owner}`}>
      {type === "google_ads" && <span className="glass-order-stripe" />}
      <span className="glass-order-sheen" />
      <svg className="glass-order-waves" viewBox="0 0 320 200" preserveAspectRatio="none" aria-hidden>
        <path d="M0 40c40 18 80-18 120 0s80 18 120 0 80-18 120 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M0 78c48 20 88-16 136 2s84 18 136-2 40-16 48 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M0 128c36 16 84-20 132 0s88 16 140-4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      {seal && <p className="glass-order-seal">{seal}</p>}
      <header className="glass-order-top">
        <div>
          <p className="glass-order-brand font-display">CLAY</p>
          <p className="glass-order-service">SANAL KART</p>
        </div>
        <TypeGlyph type={type} />
      </header>
      <div className="glass-order-mid">
        <span className="glass-order-chip" />
        <p className="glass-order-type font-display">{name}</p>
        <p className="glass-order-label">{label}</p>
      </div>
      <footer className="glass-order-foot">
        <span className="glass-order-code">{code}</span>
        <span className="glass-order-owner">{owner}</span>
      </footer>
      {cancelled && <div className="glass-order-veil">İPTAL</div>}
    </article>
  );
}
