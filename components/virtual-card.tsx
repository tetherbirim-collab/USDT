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
    <p className="font-display text-lg font-extrabold italic leading-none tracking-tight" style={{ color: ink }}>
      VISA
    </p>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 44 28" className="h-7 w-11" aria-hidden>
      <circle cx="16" cy="14" r="10" fill="#EB001B" />
      <circle cx="28" cy="14" r="10" fill="#F79E1B" />
      <path d="M22 6.4a10 10 0 0 1 0 15.2 10 10 0 0 1 0-15.2z" fill="#FF5F00" />
    </svg>
  );
}

function TypeMark({ type }: { type: CardTypeId }) {
  if (type === "facebook_ads") {
    return (
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
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
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <path d="M14 6h3.2v12.4a3.5 3.5 0 1 1-2.5-3.3V6z" fill="#25F4EE" transform="translate(-1.3 1)" />
        <path d="M14 6h3.2v12.4a3.5 3.5 0 1 1-2.5-3.3V6z" fill="#FE2C55" transform="translate(1.3 -1)" />
        <path d="M14 6h3.2v12.4a3.5 3.5 0 1 1-2.5-3.3V6z" fill="#fff" />
      </svg>
    );
  }
  if (type === "google_ads") {
    return (
      <svg viewBox="0 0 36 12" className="h-3 w-9 shrink-0" aria-hidden>
        <circle cx="6" cy="6" r="4" fill="#4285F4" />
        <circle cx="14" cy="6" r="4" fill="#EA4335" />
        <circle cx="22" cy="6" r="4" fill="#FBBC05" />
        <circle cx="30" cy="6" r="4" fill="#34A853" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
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
  const compact = size === "sm";
  const tone = TONE[card.type];
  const light = tone === "light";
  const pan = card.masked ? "•••• •••• •••• ••••" : formatPan(card.pan);
  const ink = light ? "#202124" : "#fff";
  const mute = light ? "rgba(32,33,36,.62)" : "rgba(255,255,255,.72)";
  const name = CARD_TYPES[card.type].name;

  return (
    <article
      className={`vcard ${card.type === "ultima" ? "vcard-metal" : ""} ${light ? "vcard-light" : ""} ${compact ? "p-4" : "p-5 sm:p-6"}`}
      style={{
        background: SKINS[card.type],
        color: ink,
        boxShadow: `0 22px 48px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.5), ${GLOW[card.type]}`,
      }}
      aria-label={`${name} kartı. Demo verisidir, gerçek üye işyerinde kullanılamaz.`}
    >
      {card.type === "google_ads" && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#4285F4,#EA4335,#FBBC05,#34A853)]" />
      )}
      <span className="sheen" />
      <div className="relative z-20 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <TypeMark type={card.type} />
          <div className="min-w-0">
            <p className={`truncate font-display font-extrabold ${compact ? "text-sm" : "text-base"}`}>{name}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.16em]" style={{ color: mute }}>
              {card.label}
            </p>
          </div>
        </div>
        {NETWORK[card.type] === "visa" ? <VisaMark ink={light ? "#1a1f71" : "#fff"} /> : <MastercardMark />}
      </div>
      <div className={`relative z-20 flex items-center justify-between ${compact ? "mt-3" : "mt-5"}`}>
        <div className="chip" />
      </div>
      <p className={`relative z-20 font-semibold tracking-[0.12em] ${compact ? "mt-3 text-sm" : "mt-4 text-lg"}`}>
        {pan}
      </p>
      <div className={`relative z-20 mt-auto flex items-end justify-between gap-3 ${compact ? "pt-3" : "pt-4"}`}>
        <div className="flex min-w-0 gap-3">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.14em]" style={{ color: mute }}>
              Ad
            </p>
            <p className="truncate font-display text-sm font-bold tracking-wide">Clay</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em]" style={{ color: mute }}>
              SKT
            </p>
            <p className="text-xs font-semibold">{card.masked ? "••/••" : card.expiry}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em]" style={{ color: mute }}>
              CVV
            </p>
            <p className="text-xs font-semibold">{card.masked ? "•••" : card.cvv}</p>
          </div>
        </div>
      </div>
      {card.status !== "aktif" && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/55">
          <span className="rounded-full border border-white/50 px-4 py-2 text-sm font-bold tracking-[0.2em] text-white">
            {STATUS_LABEL[card.status]}
          </span>
        </div>
      )}
    </article>
  );
}
