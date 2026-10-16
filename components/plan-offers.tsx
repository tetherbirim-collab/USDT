"use client";

import Link from "next/link";
import { planAction } from "@/lib/actions";
import { OPENING_FEE_NOTE, PLANS, usdMinorToKurus } from "@/lib/catalog";
import { percentText } from "@/components/fee-sheet";
import { daysLeftLine, daysUntil, formatTL } from "@/lib/format";
import { useSiteSettings } from "@/lib/live";
import type { PlanId } from "@/lib/types";

const RANK: Record<PlanId, number> = { kivilcim: 0, atolye: 1, galeri: 2 };

const OFFER: Record<PlanId, { title: string; metal: "bronze" | "silver" | "gold" }> = {
  kivilcim: { title: "Kıvılcım", metal: "bronze" },
  atolye: { title: "Atölye", metal: "silver" },
  galeri: { title: "Galeri", metal: "gold" },
};

function SparkArt({ id }: { id: string }) {
  return (
    <svg className="plan-offer-svg" viewBox="0 0 320 168" aria-hidden>
      <defs>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe1c4" />
          <stop offset="0.48" stopColor="#e08a52" />
          <stop offset="1" stopColor="#6a3018" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="42%" r="55%">
          <stop offset="0" stopColor="#fff6e8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ff7a3c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="168" fill="#4a2014" />
      <circle cx="168" cy="78" r="78" fill={`url(#${id}-glow)`} />
      <g transform="translate(102 42) rotate(-8 56 40)">
        <rect width="112" height="74" rx="12" fill={`url(#${id}-card)`} stroke="rgba(255,255,255,.6)" />
        <rect x="12" y="14" width="24" height="17" rx="4" fill="#fff1cf" />
        <text x="12" y="56" fill="#3a160c" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700" letterSpacing="1.6">
          CLAY
        </text>
      </g>
      <path d="M176 14l5 14h13l-10 8 4 14-12-8-12 8 4-14-10-8h13z" fill="#fff8ec" />
    </svg>
  );
}

function AtelierArt({ id }: { id: string }) {
  return (
    <svg className="plan-offer-svg" viewBox="0 0 320 168" aria-hidden>
      <defs>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c5d0dc" />
          <stop offset="1" stopColor="#6d7888" />
        </linearGradient>
        <linearGradient id={`${id}-lamp`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#9eb0c4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="320" height="168" fill="#1b2430" />
      <path d="M150 18h28l46 92H104z" fill={`url(#${id}-lamp)`} />
      <rect x="146" y="10" width="36" height="12" rx="4" fill="#e8eef6" />
      <rect x="28" y="118" width="264" height="10" rx="4" fill="#8ea0b4" />
      <g transform="translate(108 48) rotate(-6 52 34)">
        <rect width="108" height="70" rx="12" fill={`url(#${id}-card)`} stroke="rgba(255,255,255,.7)" />
        <rect x="12" y="14" width="22" height="16" rx="3" fill="#d7c08a" />
        <text x="12" y="54" fill="#1c2430" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700" letterSpacing="1.6">
          CLAY
        </text>
      </g>
    </svg>
  );
}

function GalleryArt({ id }: { id: string }) {
  return (
    <svg className="plan-offer-svg" viewBox="0 0 320 168" aria-hidden>
      <defs>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3d4" />
          <stop offset="0.45" stopColor="#e2b15a" />
          <stop offset="1" stopColor="#8a5a16" />
        </linearGradient>
        <radialGradient id={`${id}-spot`} cx="50%" cy="0%" r="70%">
          <stop offset="0" stopColor="#fff6dd" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff6dd" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="168" fill="#2c2114" />
      <rect width="320" height="168" fill={`url(#${id}-spot)`} />
      <rect x="78" y="22" width="164" height="112" rx="8" fill="none" stroke="#f0c98a" strokeWidth="8" />
      <rect x="92" y="36" width="136" height="84" rx="6" fill="#1a140c" />
      <g transform="translate(108 48)">
        <rect width="104" height="66" rx="10" fill={`url(#${id}-card)`} />
        <rect x="10" y="12" width="20" height="14" rx="3" fill="#fff6e4" />
        <text x="10" y="48" fill="#3a2508" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700" letterSpacing="1.5">
          CLAY
        </text>
      </g>
    </svg>
  );
}

function OfferSet({
  prefix,
  planId,
  planUntil,
  publicMode = false,
}: {
  prefix: string;
  planId: PlanId;
  planUntil: string;
  publicMode?: boolean;
}) {
  const settings = useSiteSettings();
  const days = daysUntil(planUntil || new Date().toISOString());
  const remain = days > 0 ? `Bitmesine ${daysLeftLine(days)}` : days === 0 ? "Paket bugün bitiyor" : "Paket günü geçti";
  const issue = formatTL(settings.issueFeeKurus);
  const load = percentText(settings.loadFeePercent);
  const transfer = percentText(settings.transferFeePercent);
  const ids = Object.keys(PLANS) as PlanId[];
  return (
    <div className="plan-set">
      {ids.map((id) => {
        const row = settings.plans?.[id] ?? PLANS[id];
        const offer = OFFER[id];
        const current = !publicMode && id === planId;
        const higher = !publicMode && RANK[id] > RANK[planId];
        return (
          <article key={`${prefix}-${id}`} className={`plan-offer plan-offer-${offer.metal}${current ? " plan-offer-now" : ""}`}>
            <div className="plan-offer-art">
              {id === "kivilcim" && <SparkArt id={`${prefix}-spark`} />}
              {id === "atolye" && <AtelierArt id={`${prefix}-atelier`} />}
              {id === "galeri" && <GalleryArt id={`${prefix}-gallery`} />}
              <p className="plan-offer-badge">{row.cardLimit} kart</p>
            </div>
            <div className="plan-offer-body">
              <p className="plan-offer-kicker">{row.name}</p>
              <h2 className="plan-offer-name font-display">{offer.title}</h2>
              <p className="plan-offer-price font-display">
                {row.priceUsdMinor / 100} <span>USD</span>
              </p>
              <p className="plan-offer-sub">{formatTL(usdMinorToKurus(row.priceUsdMinor))} · ay</p>
              {current && <p className="plan-offer-remain">{remain}</p>}
              <ul className="plan-offer-pills">
                <li>Basım {issue}. {OPENING_FEE_NOTE}</li>
                <li>Yükleme {load}</li>
                <li>30 gün {issue}</li>
                <li>Aktarım {transfer}</li>
              </ul>
              {publicMode ? (
                <Link href="/kayit" className="btn btn-gold plan-offer-cta w-full">
                  Hesap aç
                </Link>
              ) : (
                <form action={planAction} className="plan-offer-cta">
                  <input type="hidden" name="plan" value={id} />
                  <button className="btn btn-gold w-full" type="submit">
                    {current ? "Bu paket sende" : higher ? "Planı yükselt" : "Bu plana geç"}
                  </button>
                </form>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function PublicPlanOffers() {
  return (
    <div className="plan-stage">
      <div className="plan-track">
        <OfferSet prefix="pub-a" planId="atolye" planUntil="" publicMode />
        <div inert aria-hidden="true">
          <OfferSet prefix="pub-b" planId="atolye" planUntil="" publicMode />
        </div>
      </div>
    </div>
  );
}

export function PlanOffers({ planId, planUntil }: { planId: PlanId; planUntil: string }) {
  return (
    <div className="plan-stage">
      <div className="plan-track">
        <OfferSet prefix="a" planId={planId} planUntil={planUntil} />
        <div inert aria-hidden="true">
          <OfferSet prefix="b" planId={planId} planUntil={planUntil} />
        </div>
      </div>
    </div>
  );
}
