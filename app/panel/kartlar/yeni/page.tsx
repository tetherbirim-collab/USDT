"use client";

import Link from "next/link";
import { IssueForm } from "@/components/issue-form";
import { Notice } from "@/components/notice";
import { percentText } from "@/components/fee-sheet";
import { formatTL } from "@/lib/format";
import { Boot, useQuery, useSiteSettings, useUser } from "@/lib/live";
import { listCards, snapshot } from "@/lib/store";

export default function NewCardPage() {
  const user = useUser();
  const query = useQuery();
  const settings = useSiteSettings();
  if (!user || !query) return <Boot />;
  const open = listCards(user.id).filter((card) => card.status !== "kapali").length;
  const slotsLeft = (settings.plans?.[user.plan]?.cardLimit ?? 0) - open;

  return (
    <div className="grid gap-5">
      <div>
        <Link href="/panel/kartlar" className="text-sm text-gold">
          ← Kartlara dön
        </Link>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight">Kart oluştur</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Göndermeden önce basım ücreti {formatTL(settings.issueFeeKurus)}, yükleme komisyonu {percentText(settings.loadFeePercent)} ve karta yazılacak tutar tabloda durur. 30 günlük kart bedeli oluşturma anında ikinci kez düşmez.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <div className="glass rounded-[28px] p-4 sm:p-6">
        <IssueForm
          balance={user.balance}
          slotsLeft={slotsLeft}
          bins={snapshot().bins}
          account={{ id: user.id, name: user.name, username: user.username }}
        />
      </div>
    </div>
  );
}
