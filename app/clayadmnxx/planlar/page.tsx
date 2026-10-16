"use client";

import { adminPlanSaveAction, adminResetAction } from "@/lib/actions";
import { ADMIN_PATH } from "@/lib/auth";
import { Notice } from "@/components/notice";
import { PLANS } from "@/lib/catalog";
import { Boot, useQuery, useSiteSettings } from "@/lib/live";
import type { PlanId } from "@/lib/types";

const ORDER: PlanId[] = ["kivilcim", "atolye", "galeri"];
const METAL = { bronze: "Bronz", silver: "Gümüş", gold: "Altın" } as const;

export default function AdminPlansPage() {
  const query = useQuery();
  const settings = useSiteSettings();
  if (!query) return <Boot />;

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">PLANLAR</p>
        <h1 className="font-display text-4xl font-extrabold">Planlar</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Ad, fiyat, kart adedi ve kısa yazı buradan değişir. Metal rengi sabit kalır. Plan değiştirmek cüzdandan düşmez.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={adminResetAction}>
        <input type="hidden" name="alan" value="plan" />
        <input type="hidden" name="donus" value={`${ADMIN_PATH}/planlar`} />
        <button className="btn btn-ghost">Planları varsayılana al</button>
      </form>
      <div className="grid gap-4">
        {ORDER.map((id) => {
          const plan = settings.plans[id];
          const metal = PLANS[id].metal;
          return (
            <form key={id} action={adminPlanSaveAction} className="glass grid gap-3 rounded-[28px] p-5">
              <input type="hidden" name="plan" value={id} />
              <p className="text-xs font-bold tracking-[0.18em] text-gold">{METAL[metal]}</p>
              <label className="grid gap-1 text-sm">
                Ad
                <input className="field" name="ad" required minLength={2} maxLength={40} defaultValue={plan.name} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  Fiyat (USD)
                  <input className="field" name="fiyat" inputMode="decimal" required defaultValue={plan.priceUsdMinor / 100} />
                </label>
                <label className="grid gap-1 text-sm">
                  En fazla kart
                  <input className="field" name="adet" inputMode="numeric" required min={1} max={100} defaultValue={plan.cardLimit} />
                </label>
              </div>
              <label className="grid gap-1 text-sm">
                Kısa yazı
                <textarea className="field min-h-20" name="yazi" required minLength={2} maxLength={180} defaultValue={plan.blurb} />
              </label>
              <button className="btn btn-gold w-fit">Planı kaydet</button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
