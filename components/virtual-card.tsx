import { CARD_TYPES } from "@/lib/catalog";
import { formatPan } from "@/lib/format";
import type { CardFace, CardTypeId } from "@/lib/types";

type Network = "visa" | "mastercard";
type Tone = "light" | "dark";

const NETWORK: Record<CardTypeId, Network> = {
  reklam: "visa",
  abonelik: "visa",
  ultima: "visa",
  google_ads: "visa",
  facebook: "visa",
  alisveris: "mastercard",
  seyahat: "mastercard",
  facebook_ads: "mastercard",
  tiktok: "mastercard",
};

const TONE: Record<CardTypeId, Tone> = {
  reklam: "dark",
  alisveris: "dark",
  abonelik: "dark",
  seyahat: "dark",
  ultima: "dark",
  google_ads: "light",
  facebook_ads: "dark",
  facebook: "dark",
  tiktok: "dark",
};

const SKINS: Record<CardTypeId, string> = {
  reklam: "linear-gradient(145deg, #7c3aed 0%, #c026d3 46%, #2e1065 100%)",
  alisveris: "linear-gradient(150deg, #ff8a3d 0%, #e11d48 52%, #7f1d1d 100%)",
  abonelik: "linear-gradient(155deg, #14b8a6 0%, #0f766e 48%, #042f2e 100%)",
  seyahat: "linear-gradient(160deg, #38bdf8 0%, #1d4ed8 46%, #0f172a 100%)",
  ultima:
    "linear-gradient(145deg, #8a8a92 0%, #3a3a40 22%, #121214 58%, #5c5c64 100%)",
  google_ads: "linear-gradient(180deg, #ffffff 0%, #f6f7f9 70%, #eef1f4 100%)",
  facebook_ads: "linear-gradient(155deg, #4c9aff 0%, #1877f2 42%, #0a4fb3 100%)",
  facebook: "linear-gradient(160deg, #3b8cff 0%, #1877f2 40%, #0b5ed7 100%)",
  tiktok: "linear-gradient(160deg, #222 0%, #050505 62%, #111 100%)",
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
  if (type === "facebook" || type === "facebook_ads") {
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
  if (type === "alisveris") {
    return (
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <path d="M9 12h14l-1.2 12H10.2L9 12z" fill="#fff" />
        <path d="M12.5 12V10a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="#fff" strokeWidth="2" />
      </svg>
    );
  }
  if (type === "seyahat") {
    return (
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <path d="M4 18 28 10l-8 12 2 4-4-2-6 2 2-6z" fill="#fff" />
      </svg>
    );
  }
  if (type === "abonelik") {
    return (
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <path d="M16 6a10 10 0 0 1 8.6 5H20v3h8V6h-3v2.2A13 13 0 1 0 29 16h-3a10 10 0 1 1-10-10z" fill="#fff" />
      </svg>
    );
  }
  if (type === "reklam") {
    return (
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <path d="M8 13h5l8-5v16l-8-5H8z" fill="#fff" />
        <path d="M22 12.5a6 6 0 0 1 0 7" fill="none" stroke="#fff" strokeWidth="2" />
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
      style={{ background: SKINS[card.type], color: ink }}
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
            <p className="truncate text-xs font-semibold">{card.holder}</p>
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
        <p className="text-[11px] font-semibold leading-none">Clay</p>
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
