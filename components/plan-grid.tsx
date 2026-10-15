"use client";

import Link from "next/link";
import { PLANS, usdMinorToKurus } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { useSiteSettings } from "@/lib/live";
import type { PlanId } from "@/lib/types";

export function PlanGrid() {
  const settings = useSiteSettings();
  const ids = Object.keys(PLANS) as PlanId[];
  return (
    <>
      <p className="mt-3 text-white/70">
        {ids.map((id) => `${settings.plans[id].name} ${settings.plans[id].priceUsdMinor / 100} USD`).join(", ")}. Ekranda sabit kurun TL karşılığı durur. Kart bedeli yönetimden değişir. Tavan dolunca plan yükselir.
      </p>
      <div className="plan-grid mt-8">
        {ids.map((id) => {
          const plan = settings.plans[id];
          const metal = PLANS[id].metal;
          const chips = Math.min(plan.cardLimit, 4);
          return (
            <article key={id} className={`plan-card plan-${metal}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-white/70">{metal === "silver" ? "ÖNE ÇIKAN" : "VİTRİN"}</p>
                  <h3 className="font-display mt-2 text-2xl font-bold">{plan.name}</h3>
                </div>
                <div className="plan-medal" aria-hidden>
                  <span className="font-display text-xl font-extrabold">{plan.cardLimit}</span>
                </div>
              </div>
              <p className="mt-5 font-display text-4xl font-extrabold">{plan.priceUsdMinor / 100} USD</p>
              <p className="text-sm font-semibold text-[#ffe7c2]">
                {formatTL(usdMinorToKurus(plan.priceUsdMinor))} · {PLANS[id].period}
              </p>
              <p className="mt-4 text-sm text-white/80">{plan.blurb}</p>
              <div className="plan-fan" aria-hidden>
                {Array.from({ length: chips }, (_, index) => (
                  <span key={index} className="plan-chip" />
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold">En fazla {plan.cardLimit} açık kart</p>
              <Link href="/kayit" className="btn btn-gold relative z-[1] mt-6 w-full">
                Hesap aç
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
