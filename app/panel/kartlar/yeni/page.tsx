"use client";

import Link from "next/link";
import { IssueForm } from "@/components/issue-form";
import { Notice } from "@/components/notice";
import { PLANS } from "@/lib/catalog";
import { Boot, useQuery, useUser } from "@/lib/live";
import { listCards, snapshot } from "@/lib/store";

export default function NewCardPage() {
  const user = useUser();
  const query = useQuery();
  if (!user || !query) return <Boot />;
  const open = listCards(user.id).filter((card) => card.status !== "kapali").length;
  const slotsLeft = PLANS[user.plan].cardLimit - open;

  return (
    <div className="grid gap-5">
      <div>
        <Link href="/panel/kartlar" className="text-sm text-gold">
          ← Kartlara dön
        </Link>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight">Kart oluştur</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Karta isim ver, türü ve tavanı seç, sonra BIN’i işaretle. Verdiğin ad kartın üzerinde durur.
          Satın almadan önce önek kalır, kalan haneler X görünür. Kart oluşunca 16 hane yazılır.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <div className="glass rounded-[28px] p-4 sm:p-6">
        <IssueForm balance={user.balance} slotsLeft={slotsLeft} bins={snapshot().bins} />
      </div>
    </div>
  );
}
