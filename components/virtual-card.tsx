import { CARD_TYPES } from "@/lib/catalog";
import { formatPan } from "@/lib/format";
import type { CardFace } from "@/lib/types";

const SKINS: Record<CardFace["type"], string> = {
  reklam:
    "radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,.32), transparent 46%), linear-gradient(145deg, #2a1748 0%, #7a52e0 40%, #1a1030 72%, #09070f 100%)",
  alisveris:
    "radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,.28), transparent 46%), linear-gradient(150deg, #08332c 0%, #149684 42%, #10241f 100%)",
  abonelik:
    "radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,.25), transparent 42%), linear-gradient(145deg, #3a220c 0%, #c4843a 44%, #1c140d 100%)",
  seyahat:
    "radial-gradient(90% 80% at 0% 100%, rgba(141,255,228,.2), transparent 40%), linear-gradient(160deg, #10203d 0%, #2f6ec4 48%, #10141d 100%)",
};

const STATUS_LABEL = {
  aktif: "AKTİF",
  donduruldu: "DONDURULDU",
  kapali: "KAPALI",
} as const;

export function VirtualCard({
  card,
  size = "md",
}: {
  card: CardFace;
  size?: "md" | "sm";
}) {
  const compact = size === "sm";
  const pan = card.masked ? "4000 00•• •••• ••••" : formatPan(card.pan);
  return (
    <article
      className={`vcard ${compact ? "p-4" : "p-5 sm:p-6"}`}
      style={{ background: SKINS[card.type] }}
      aria-label={`${card.label} simülasyon kartı. Gerçek üye işyerinde kullanılamaz.`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.18) 48%, transparent 62%)",
        }}
      />
      <span className="sheen" />
      <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] text-2xl font-black tracking-[0.28em] text-white/10 sm:text-3xl">
        SİMÜLASYON
      </p>
      <div className="relative z-20 flex items-start justify-between gap-3">
        <div>
          <p className={`font-display font-bold ${compact ? "text-sm" : "text-base"}`}>SanalKart</p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/75">
            {CARD_TYPES[card.type].name}
          </p>
        </div>
        <span className="rounded-full border border-white/50 bg-black/35 px-2 py-1 text-[10px] font-bold tracking-[0.18em]">
          SİMÜLASYON
        </span>
      </div>
      <div className={`relative flex items-center justify-between ${compact ? "mt-4" : "mt-6"}`}>
        <div className="chip" />
        <svg viewBox="0 0 48 32" className="h-7 w-10" aria-hidden>
          <path d="M8 22c6-6 10-6 16 0" fill="none" stroke="white" strokeWidth="1.6" />
          <path d="M4 26c8-9 16-9 24 0" fill="none" stroke="white" strokeWidth="1.6" opacity=".7" />
          <path d="M14 18c3-3 6-3 9 0" fill="none" stroke="white" strokeWidth="1.6" />
        </svg>
      </div>
      <p
        className={`relative font-semibold tracking-[0.14em] ${compact ? "mt-4 text-sm" : "mt-6 text-lg sm:text-xl"}`}
      >
        {pan}
      </p>
      <p className="relative mt-1 text-[11px] text-white/80">Gerçek üye işyerinde geçmez</p>
      <div className={`relative flex items-end justify-between gap-3 ${compact ? "mt-3" : "mt-5"}`}>
        <div>
          <p className="text-[9px] uppercase tracking-[0.16em] text-white/60">Ad</p>
          <p className="text-xs font-semibold sm:text-sm">{card.holder}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.16em] text-white/60">SKT</p>
          <p className="text-xs font-semibold sm:text-sm">{card.masked ? "••/••" : card.expiry}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.16em] text-white/60">CVV</p>
          <p className="text-xs font-semibold sm:text-sm">{card.masked ? "•••" : card.cvv}</p>
        </div>
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/80">TEST</p>
      </div>
      <p className="relative mt-3 truncate text-xs text-white/80">{card.label}</p>
      {card.status !== "aktif" && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/50">
          <div className="text-center">
            <span className="rounded-full border border-white/50 px-4 py-2 text-sm font-bold tracking-[0.2em]">
              {STATUS_LABEL[card.status]}
            </span>
            <p className="mt-2 text-[11px] text-white/85">Gerçek üye işyerinde geçmez</p>
          </div>
        </div>
      )}
    </article>
  );
}
