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
    <svg viewBox="0 0 86 28" className="vcard-pay" aria-hidden>
      <text
        x="43"
        y="21"
        textAnchor="middle"
        fill={ink}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize="24"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 52 32" className="vcard-pay" aria-hidden>
      <circle cx="18" cy="16" r="12" fill="#EB001B" />
      <circle cx="34" cy="16" r="12" fill="#F79E1B" />
      <path d="M26 6.7a12 12 0 0 1 0 18.6 12 12 0 0 1 0-18.6z" fill="#FF5F00" />
      <path d="M14 10.2a9 9 0 0 1 2.2-1.4" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TypeMark({ type }: { type: CardTypeId }) {
  if (type === "facebook_ads") {
    return (
      <svg viewBox="0 0 48 48" className="vcard-mark-sq" aria-hidden>
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
      <svg viewBox="0 0 48 48" className="vcard-mark-sq" aria-hidden>
        <rect width="48" height="48" rx="13" fill="#111" />
        <path d={note} fill="#25F4EE" transform="translate(-1.5 1.1)" />
        <path d={note} fill="#FE2C55" transform="translate(1.5 -1.1)" />
        <path d={note} fill="#fff" />
      </svg>
    );
  }
  if (type === "google_ads") {
    return (
      <svg viewBox="0 0 48 48" className="vcard-mark-sq" aria-hidden>
        <rect width="48" height="48" rx="13" fill="#fff" />
        <circle cx="17" cy="17" r="5.4" fill="#4285F4" />
        <circle cx="31" cy="17" r="5.4" fill="#EA4335" />
        <circle cx="17" cy="31" r="5.4" fill="#FBBC05" />
        <circle cx="31" cy="31" r="5.4" fill="#34A853" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="vcard-mark-sq" aria-hidden>
      <rect width="48" height="48" rx="13" fill="#16120c" />
      <path d="M24 8.5 38.5 18.2 34.2 38H13.8L9.5 18.2 24 8.5z" fill="#c8923e" />
      <path d="M24 8.5 38.5 18.2 24 21.5 9.5 18.2z" fill="#ffe7b0" />
      <path d="M24 21.5 38.5 18.2 34.2 38 24 33.2z" fill="#8d5e22" opacity=".55" />
      <path d="M24 14.2 31.2 18.8 24 28.8 16.8 18.8z" fill="#fff4d4" opacity=".85" />
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
        <div className="vcard-dates">
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
        </div>
        <div className="vcard-net">
          {NETWORK[card.type] === "visa" ? <VisaMark ink={light ? "#1a1f71" : "#fff"} /> : <MastercardMark />}
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
