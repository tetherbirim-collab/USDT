"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PanelFrame } from "@/components/panel-frame";
import { formatTL } from "@/lib/format";
import { deskPath } from "@/lib/auth";
import { Boot, useSiteSettings, useUser } from "@/lib/live";
import { remainLeft, remainMood } from "@/lib/remain";
import { listCards, unreadNoticeCount } from "@/lib/store";

export function PanelShell({ children }: { children: React.ReactNode }) {
  const user = useUser();
  useEffect(() => {
    if (user === null) window.location.replace("/giris/");
    if (user?.role === "yonetici") window.location.replace(`${deskPath(user.role)}/`);
  }, [user]);
  const settings = useSiteSettings();
  if (!user || user.role !== "uye") return <Boot />;
  const ranked = listCards(user.id)
    .filter((card) => card.status === "aktif" || card.status === "donduruldu")
    .map((card) => ({ card, left: remainLeft(card.limit, card.spent) }))
    .sort((a, b) => a.left - b.left);
  const hot = ranked.filter((item) => item.left <= 20);
  const lead = hot[0];
  return (
    <PanelFrame
      name={user.name}
      username={user.username}
      balanceLabel={formatTL(user.balance)}
      planName={settings.plans[user.plan].name}
      unread={unreadNoticeCount(user.id)}
    >
      {lead && (
        <div className="remain-note remain-note-hot mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold tracking-wide">Bakiye azalıyor</p>
            <p className="text-sm">{hot.map((item) => item.card.label).join(" · ")}</p>
            <p className="mt-1 text-sm">{remainMood(lead.left).line}</p>
          </div>
          <Link href="/panel/yukle" className="btn btn-gold btn-urge">
            Bakiye yükle
          </Link>
        </div>
      )}
      {children}
    </PanelFrame>
  );
}
