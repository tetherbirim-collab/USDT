import { CARD_TYPES } from "@/lib/catalog";
import { formatPan } from "@/lib/format";
import type { CardFace, CardTypeId } from "@/lib/types";

type Network = "visa" | "mastercard";
type Tone = "light" | "dark";

const NETWORK: Record<CardTypeId, Network> = {
  facebook_ads: "mastercard",
  tiktok: "mastercard",
  google_ads: "visa",
  ultima: "visa",
};

const TONE: Record<CardTypeId, Tone> = {
  facebook_ads: "dark",
  tiktok: "dark",
  google_ads: "light",
  ultima: "dark",
};

const SKINS: Record<CardTypeId, string> = {
  facebook_ads:
    "radial-gradient(90% 80% at 0% 0%, rgba(255,255,255,.5), transparent 42%), linear-gradient(155deg, #7eb6ff 0%, #1877f2 48%, #0a4fb3 100%)",
  tiktok:
    "radial-gradient(70% 80% at 100% 0%, rgba(37,244,238,.4), transparent 42%), radial-gradient(70% 70% at 0% 100%, rgba(254,44,85,.38), transparent 46%), linear-gradient(165deg, #2a2a2a 0%, #070707 68%, #141414 100%)",
  google_ads:
    "radial-gradient(80% 70% at 100% 0%, rgba(66,133,244,.22), transparent 46%), radial-gradient(60% 50% at 0% 100%, rgba(52,168,83,.16), transparent 50%), linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)",
  ultima:
    "radial-gradient(80% 70% at 0% 0%, rgba(255,236,196,.62), transparent 40%), linear-gradient(145deg, #8d8d96 0%, #3a3a40 26%, #0c0c0e 64%, #4a4a52 100%)",
};

const GLOW: Record<CardTypeId, string> = {
  facebook_ads: "0 0 22px rgba(126,182,255,.9), 0 0 64px rgba(24,119,242,.75)",
  tiktok: "0 0 18px rgba(37,244,238,.85), 0 0 46px rgba(254,44,85,.62)",
  google_ads: "0 0 18px rgba(66,133,244,.7), 0 0 42px rgba(251,188,5,.4), 0 0 70px rgba(52,168,83,.35)",
  ultima: "0 0 20px rgba(255,236,196,.9), 0 0 58px rgba(240,201,138,.62)",
};

const STATUS_LABEL = {
  aktif: "AKTİF",
  donduruldu: "DONDURULDU",
  kapali: "KAPALI",
} as const;

function VisaMark({ ink }: { ink: string }) {
  return (
    <p className="vcard-visa font-display" style={{ color: ink }}>
      VISA
    </p>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 44 28" className="vcard-pay" aria-hidden>
      <circle cx="16" cy="14" r="10" fill="#EB001B" />
      <circle cx="28" cy="14" r="10" fill="#F79E1B" />
      <path d="M22 6.4a10 10 0 0 1 0 15.2 10 10 0 0 1 0-15.2z" fill="#FF5F00" />
    </svg>
  );
}

function TypeMark({ type }: { type: CardTypeId }) {
  if (type === "facebook_ads") {
    return (
      <svg viewBox="0 0 32 32" className="vcard-mark-sq" aria-hidden>
        <circle cx="16" cy="16" r="16" fill="#fff" />
        <path
          fill="#1877F2"
          d="M18.4 25v-7h2.3l.4-2.6h-2.7v-1.6c0-.8.2-1.3 1.3-1.3H21V9.4c-.2 0-1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v1.6H13v2.6h2.6V25h2.8z"
        />
      </svg>
    );
  }
  if (type === "tiktok") {
    return (
      <svg viewBox="0 0 32 32" className="vcard-mark-sq" aria-hidden>
        <path d="M14 6h3.2v12.4a3.5 3.5 0 1 1-2.5-3.3V6z" fill="#25F4EE" transform="translate(-1.3 1)" />
        <path d="M14 6h3.2v12.4a3.5 3.5 0 1 1-2.5-3.3V6z" fill="#FE2C55" transform="translate(1.3 -1)" />
        <path d="M14 6h3.2v12.4a3.5 3.5 0 1 1-2.5-3.3V6z" fill="#fff" />
      </svg>
    );
  }
  if (type === "google_ads") {
    return (
      <svg viewBox="0 0 36 12" className="vcard-mark-wide" aria-hidden>
        <circle cx="6" cy="6" r="4" fill="#4285F4" />
        <circle cx="14" cy="6" r="4" fill="#EA4335" />
        <circle cx="22" cy="6" r="4" fill="#FBBC05" />
        <circle cx="30" cy="6" r="4" fill="#34A853" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className="vcard-mark-sq" aria-hidden>
      <path d="M16 4 27 12.5 23 26H9L5 12.5 16 4z" fill="#f0c98a" />
    </svg>
  );
}

export function VirtualCard({
  card,
  size = "md",
}: {
  card: CardFace;
  size?: "md" | "sm";
}) {
  const tone = TONE[card.type];
  const light = tone === "light";
  const pan = card.masked ? "•••• •••• •••• ••••" : formatPan(card.pan);
  const ink = light ? "#202124" : "#fff";
  const mute = light ? "rgba(32,33,36,.62)" : "rgba(255,255,255,.72)";
  const name = CARD_TYPES[card.type].name;
  const holder = card.holder.trim() || "CLAY";

  return (
    <article
      className={`vcard ${card.type === "ultima" ? "vcard-metal" : ""} ${light ? "vcard-light" : ""}`}
      style={{
        background: SKINS[card.type],
        color: ink,
        boxShadow: `0 22px 48px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.5), ${GLOW[card.type]}`,
      }}
      data-size={size}
      aria-label={`${name} kartı, ${holder}. Demo verisidir, gerçek üye işyerinde kullanılamaz.`}
    >
      {card.type === "google_ads" && <span className="vcard-stripe" />}
      <span className="sheen" />
      <header className="vcard-top">
        <TypeMark type={card.type} />
        <div className="vcard-id">
          <p className="vcard-title font-display">{name}</p>
          <p className="vcard-kicker" style={{ color: mute }}>
            {card.label}
          </p>
        </div>
        {NETWORK[card.type] === "visa" ? <VisaMark ink={light ? "#1a1f71" : "#fff"} /> : <MastercardMark />}
      </header>
      <div className="vcard-mid">
        <div className="chip" />
        <p className="vcard-pan">{pan}</p>
      </div>
      <footer className="vcard-foot">
        <div className="min-w-0">
          <p className="vcard-k" style={{ color: mute }}>
            Ad
          </p>
          <p className="vcard-holder font-display">{holder}</p>
        </div>
        <div>
          <p className="vcard-k" style={{ color: mute }}>
            SKT
          </p>
          <p className="vcard-v">{card.masked ? "••/••" : card.expiry}</p>
        </div>
        <div>
          <p className="vcard-k" style={{ color: mute }}>
            CVV
          </p>
          <p className="vcard-v">{card.masked ? "•••" : card.cvv}</p>
        </div>
      </footer>
      {card.status !== "aktif" && (
        <div className="vcard-status">
          <span>{STATUS_LABEL[card.status]}</span>
        </div>
      )}
    </article>
  );
}
