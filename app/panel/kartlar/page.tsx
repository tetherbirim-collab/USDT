"use client";

import Link from "next/link";
import { CardActions } from "@/components/card-actions";
import { CardMenu } from "@/components/card-menu";
import { CardSecrets } from "@/components/card-secrets";
import { TransferForm } from "@/components/transfer-form";
import { Notice } from "@/components/notice";
import { TransferBurst } from "@/components/transfer-burst";
import { VirtualCard } from "@/components/virtual-card";
import { formatTL } from "@/lib/format";
import { Boot, useQuery, useSiteSettings, useUser } from "@/lib/live";
import { listCards, listTransactions } from "@/lib/store";
import type { Card } from "@/lib/types";

export default function CardsPage() {
  const user = useUser();
  const query = useQuery();
  const settings = useSiteSettings();
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
            Kart bas, kullanılabilir bakiye yaz, kartlar arası aktar, harca. Numara ve CVV kartın içinde durur.
          </p>
        </div>
        <Link href="/panel/kartlar/yeni" className="btn btn-gold">
          Kart bas
        </Link>
      </div>
      <ol className="grid gap-3 sm:grid-cols-4">
        {[
          ["1", "Kart bas", "Bedel 300₺. Ödeyecek hesabı ve BIN’i seç."],
          ["2", "Bakiye yaz", "Ayırdığın tutardan %7,3 kesilir, kalan kullanılabilir bakiye olur."],
          ["3", "Aktar", "Kullanılabilir bakiye karşı karta gider. Karşı karta %4 yazılır. Ana bakiye durur."],
          ["4", "Harca", "Kullanılabilir bakiye azalınca cüzdandan yeniden yükle."],
          ["5", "Destek", "Takılırsan menüden talep aç. Yanıt zilde gelir."],
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
        <div className="grid gap-8">
          {(
            [
              ["Açık", cards.filter((card) => card.status === "aktif" || card.status === "hazirlaniyor")],
              ["Dondurulmuş", cards.filter((card) => card.status === "donduruldu")],
              ["Kapanmış", cards.filter((card) => card.status === "kapali")],
            ] as [string, Card[]][]
          ).map(([title, rows]) => (
            <section key={title} className="grid gap-4">
              <h2 className="font-display text-2xl font-bold">
                {title}
                <span className="ml-2 text-base text-white/45">{rows.length}</span>
              </h2>
              {rows.length === 0 ? (
                <p className="text-sm text-white/50">Bu bölümde kart yok.</p>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {rows.map((card) => (
                    <article
                      key={card.id}
                      id={card.id}
                      className={`glass rounded-[28px] p-4 ${highlight === card.id || landed === card.id ? "ring-2 ring-gold" : ""}`}
                    >
                      {card.status === "hazirlaniyor" ? (
                        <div className="card-face">
                          <CardMenu card={card} fee={settings.issueFeeKurus} />
                          <VirtualCard card={card} />
                        </div>
                      ) : (
                        <CardSecrets
                          card={card}
                          address={user.address}
                          menu={<CardMenu card={card} fee={settings.issueFeeKurus} />}
                        >
                          {card.status !== "kapali" &&
                            card.limit - card.spent > 0 &&
                            cards.some((item) => item.id !== card.id && (item.status === "aktif" || item.status === "donduruldu")) && (
                              <div className="mt-4">
                                <TransferForm
                                  cardId={card.id}
                                  kalan={card.limit - card.spent}
                                  peers={cards
                                    .filter((item) => item.id !== card.id && (item.status === "aktif" || item.status === "donduruldu"))
                                    .map((item) => ({
                                      id: item.id,
                                      label: `${item.label} · kullanılabilir ${formatTL(item.limit - item.spent)}`,
                                    }))}
                                />
                              </div>
                            )}
                        </CardSecrets>
                      )}
                      <CardActions
                        card={card}
                        balance={user.balance}
                        drain={query.get("bildirim") === "harcama" && highlight === card.id}
                        entries={txs.filter((entry) => entry.cardId === card.id).slice(0, 6)}
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
