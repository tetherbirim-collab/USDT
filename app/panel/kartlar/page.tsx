"use client";

import Link from "next/link";
import { CardActions } from "@/components/card-actions";
import { CardSecrets } from "@/components/card-secrets";
import { Notice } from "@/components/notice";
import { TransferBurst } from "@/components/transfer-burst";
import { VirtualCard } from "@/components/virtual-card";
import { formatTL } from "@/lib/format";
import { Boot, useQuery, useUser } from "@/lib/live";
import { listCards, listTransactions } from "@/lib/store";

export default function CardsPage() {
  const user = useUser();
  const query = useQuery();
  if (!user || !query) return <Boot />;
  const highlight = query.get("vurgu");
  const landed = query.get("karsi");
  const cards = listCards(user.id);
  const txs = listTransactions(user.id);
  const sent = highlight ? txs.find((entry) => entry.cardId === highlight && entry.kind === "transfer" && entry.amount < 0) : undefined;
  const got = sent ? txs.find((entry) => entry.kind === "transfer" && entry.amount > 0 && entry.createdAt === sent.createdAt) : undefined;
  const fromCard = cards.find((card) => card.id === highlight);
  const toCard = cards.find((card) => card.id === landed);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold">KARTLARIM</p>
          <h1 className="font-display text-4xl font-extrabold">Kartlarım</h1>
          <p className="mt-2 max-w-xl text-white/65">
            Kart bas, cüzdandan tavan yaz, harca. Numara ve CVV kartın içinde durur.
          </p>
        </div>
        <Link href="/panel/kartlar/yeni" className="btn btn-gold">
          Kart bas
        </Link>
      </div>
      <ol className="grid gap-3 sm:grid-cols-4">
        {[
          ["1", "Kart bas", "Bedel 300₺. Ödeyecek hesabı ve BIN’i seç."],
          ["2", "Tavan yaz", "Ayırdığın tutardan %7,3 kesilir, kalan karta yazılır."],
          ["3", "Harca", "Tavan çubuğu dolunca cüzdandan yeniden yükle."],
          ["4", "Destek", "Takılırsan menüden talep aç. Yanıt zilde gelir."],
        ].map(([step, title, line]) => (
          <li key={step} className="glass rounded-[22px] p-4">
            <p className="text-xs font-bold tracking-[0.16em] text-gold">{step}</p>
            <p className="mt-1 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-white/60">{line}</p>
          </li>
        ))}
      </ol>
      {query.get("bildirim") === "transfer" && fromCard && toCard && sent && got ? (
        <TransferBurst
          from={fromCard.label}
          to={toCard.label}
          left={Math.abs(sent.amount)}
          fee={Math.abs(sent.amount) - got.amount}
          arrived={got.amount}
        />
      ) : (
        <Notice code={query.get("bildirim") || undefined} />
      )}
      {cards.length === 0 ? (
        <div className="glass rounded-[24px] p-6">Henüz basılmış kart yok.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.id}
              id={card.id}
              className={`glass rounded-[28px] p-4 ${highlight === card.id || landed === card.id ? "ring-2 ring-gold" : ""}`}
            >
              {card.status === "hazirlaniyor" ? (
                <VirtualCard card={card} />
              ) : (
                <CardSecrets card={card} address={user.address} />
              )}
              <CardActions
                card={card}
                balance={user.balance}
                drain={query.get("bildirim") === "harcama" && highlight === card.id}
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
