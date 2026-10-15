"use client";

import Link from "next/link";
import { CardActions } from "@/components/card-actions";
import { CardSecrets } from "@/components/card-secrets";
import { Notice } from "@/components/notice";
import { VirtualCard } from "@/components/virtual-card";
import { formatTL } from "@/lib/format";
import { Boot, useQuery, useUser } from "@/lib/live";
import { listCards, listTransactions } from "@/lib/store";

export default function CardsPage() {
  const user = useUser();
  const query = useQuery();
  if (!user || !query) return <Boot />;
  const highlight = query.get("vurgu");
  const cards = listCards(user.id);
  const txs = listTransactions(user.id);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold">KARTLAR</p>
          <h1 className="font-display text-4xl font-extrabold">Sahne kartları</h1>
          <p className="mt-2 max-w-xl text-white/65">
            Numara, son kullanma, CVV ve adres yalnızca bu hesabın kartında durur. Numaralar demo
            verisidir ve gerçek üye işyerinde kullanılamaz.
          </p>
        </div>
        <Link href="/panel/kartlar/yeni" className="btn btn-gold">
          Kart bas
        </Link>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      {cards.length === 0 ? (
        <div className="glass rounded-[24px] p-6">Henüz basılmış kart yok.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.id}
              id={card.id}
              className={`glass rounded-[28px] p-4 ${highlight === card.id ? "ring-2 ring-gold" : ""}`}
            >
              {card.status === "hazirlaniyor" ? (
                <VirtualCard card={card} />
              ) : (
                <CardSecrets card={card} address={user.address} />
              )}
              <CardActions
                card={card}
                peers={cards
                  .filter(
                    (item) =>
                      item.id !== card.id && (item.status === "aktif" || item.status === "donduruldu"),
                  )
                  .map((item) => ({
                    id: item.id,
                    label: `${item.label} · kalan ${formatTL(item.limit - item.spent)}`,
                  }))}
                entries={txs.filter((entry) => entry.cardId === card.id).slice(0, 6)}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
