"use client";

import { Notice } from "@/components/notice";
import { PlanOffers } from "@/components/plan-offers";
import { Boot, useQuery, useUser } from "@/lib/live";
import type { PlanId } from "@/lib/types";

export default function UpgradePage() {
  const user = useUser();
  const query = useQuery();
  if (!user || !query) return <Boot />;
  const planId: PlanId = user.plan === "atolye" || user.plan === "galeri" ? user.plan : "kivilcim";
  return (
    <div className="grid gap-5">
      <div>
        <p className="eyebrow">PLAN</p>
        <h1 className="font-display text-4xl font-extrabold">Planı yükselt</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Seçtiğin paketin ücreti bakiyeden düşer. Aynı pakete basmak ücret almaz. Açık kart adedi yeni pakete sığmazsa geçiş olmaz.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <PlanOffers planId={planId} planUntil={user.planUntil} />
    </div>
  );
}
