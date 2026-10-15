"use client";

import Link from "next/link";
import { IssueForm } from "@/components/issue-form";
import { Notice } from "@/components/notice";
import { PLANS } from "@/lib/catalog";
import { holderLine } from "@/lib/format";
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
        <h1 className="font-display mt-3 text-4xl font-extrabold">Kart bas</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          BIN’i buradan seçersin. Satın almadan önce önek kalır, kalan haneler X görünür. Kart oluşunca
          16 hane yazılır ve Visa ya da Mastercard işareti o BIN’e göre değişir. Seçim yapılmadan kart
          oluşmaz. Numara sorgulama, kimlik belgesi ve ödeme yoktur. Tür adları senaryo etiketidir.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <div className="glass rounded-[28px] p-4 sm:p-6">
        <IssueForm
          holder={holderLine(user.name)}
          balance={user.balance}
          slotsLeft={slotsLeft}
          bins={snapshot().bins}
        />
      </div>
    </div>
  );
}
