"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { purgeClosedCardsAction } from "@/lib/actions";
import { CardActions } from "@/components/card-actions";
import { CrestBanner } from "@/components/crest-banner";
import { CardMenu } from "@/components/card-menu";
import { CardSecrets } from "@/components/card-secrets";
import { TransferForm } from "@/components/transfer-form";
import { Notice } from "@/components/notice";
import { TransferBurst } from "@/components/transfer-burst";
import { formatTL } from "@/lib/format";
import { Boot, useQuery, useSiteSettings, useUser } from "@/lib/live";
import { listCards, listTransactions } from "@/lib/store";
import type { Card } from "@/lib/types";

const TABS = [
  ["acik", "Açık"],
  ["donuk", "Dondurulmuş"],
  ["kapali", "Kapanmış"],
] as const;

export default function CardsPage() {
  const user = useUser();
  const query = useQuery();
  const settings = useSiteSettings();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("acik");
  const [q, setQ] = useState("");
  const highlight = query?.get("vurgu") ?? null;
  const landed = query?.get("karsi") ?? null;
  const note = query?.get("bildirim") ?? null;
  useEffect(() => {
    if (!user) return;
    if (note === "silindi") {
      setTab("kapali");
      return;
    }
    const hit = listCards(user.id).find((card) => card.id === highlight || card.id === landed);
    if (hit?.status === "donduruldu") setTab("donuk");
    else if (hit?.status === "kapali") setTab("kapali");
    else if (hit) setTab("acik");
  }, [user, highlight, landed, note]);
  if (!user || !query) return <Boot />;
  const cards = listCards(user.id);
  const txs = listTransactions(user.id);
  const sent = highlight ? txs.find((entry) => entry.cardId === highlight && entry.kind === "transfer" && entry.amount < 0) : undefined;
  const got = sent ? txs.find((entry) => entry.kind === "transfer" && entry.amount > 0 && entry.createdAt === sent.createdAt) : undefined;
  const fromCard = cards.find((card) => card.id === highlight);
  const toCard = cards.find((card) => card.id === landed);
  const returned = note === "ana-hesap"
    ? txs.find((entry) => entry.title === "Ana hesaba aktar" && (!highlight || entry.cardId === highlight))
    : undefined;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold">KARTLARIM</p>
          <h1 className="font-display text-4xl font-extrabold">Kartlarım</h1>
          <p className="mt-2 max-w-xl text-white/65">Bakiye 0 başlar. Yükleme kartın altından yapılır.</p>
        </div>
        <Link href="/panel/kartlar/yeni" className="btn btn-gold">
          Kart bas
        </Link>
      </div>
      <CrestBanner />
      {note === "ana-hesap" && returned ? (
        <p className="banner-ok" role="status">
          Ana hesaba {formatTL(Math.abs(returned.amount))} aktarıldı. Karttan düştü. Komisyon yok.
        </p>
      ) : query.get("bildirim") === "transfer" && fromCard && toCard && sent && got ? (
        <TransferBurst
          from={fromCard}
          to={toCard}
          left={Math.abs(sent.amount)}
          fee={Math.abs(sent.amount) - got.amount}
          arrived={got.amount}
        />
      ) : (
        <Notice code={query.get("bildirim") || undefined} text={query.get("metin") || undefined} />
      )}
      {cards.length === 0 ? (
        <div className="glass rounded-[24px] p-6">Henüz basılmış kart yok.</div>
      ) : (
        <div className="grid gap-5">
          <label className="grid max-w-sm gap-1 text-sm">
            Kart ara
            <input className="field" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Ad veya son dört hane" />
          </label>
          <div className="card-tabs" role="tablist" aria-label="Kart durumları">
            {TABS.map(([id, title]) => {
              const count =
                id === "acik"
                  ? cards.filter((card) => card.status === "aktif" || card.status === "hazirlaniyor").length
                  : id === "donuk"
                    ? cards.filter((card) => card.status === "donduruldu").length
                    : cards.filter((card) => card.status === "kapali").length;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className="card-tab"
                  onClick={() => setTab(id)}
                >
                  {title} {count}
                </button>
              );
            })}
          </div>
          {(() => {
            const needle = q.trim().toLowerCase();
            const rows: Card[] = (
              tab === "acik"
                ? cards.filter((card) => card.status === "aktif" || card.status === "hazirlaniyor")
                : tab === "donuk"
                  ? cards.filter((card) => card.status === "donduruldu")
                  : cards.filter((card) => card.status === "kapali")
            )
              .filter((card) => {
                if (!needle) return true;
                return `${card.label ?? ""} ${String(card.pan ?? "").slice(-4)} ${card.binLabel ?? ""}`.toLowerCase().includes(needle);
              })
              .sort((a, b) => Number(Boolean(b.starred)) - Number(Boolean(a.starred)));
            if (rows.length === 0) return <p className="text-sm text-white/50">Bu sekmede kart yok.</p>;
            const closed = tab === "kapali" && cards.some((card) => card.status === "kapali");
            return (
                <div className="grid gap-3">
                  {closed && (
                    <form action={purgeClosedCardsAction} className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="onay" value="on" required />
                        Kapalı kartlar ve siparişleri silinsin. Para geçmişi durur.
                      </label>
                      <button className="btn btn-ghost">Kapalıları temizle</button>
                    </form>
                  )}
                <div className="grid gap-3 lg:grid-cols-2">
                  {rows.map((card) => (
                    <article
                      key={card.id}
                      id={card.id}
                      className={`glass rounded-[28px] p-4 ${highlight === card.id || landed === card.id ? "ring-2 ring-gold" : ""}`}
                    >
                      <CardSecrets
                        card={card}
                        menu={<CardMenu card={card} fee={settings.issueFeeKurus} />}
                      >
                        {card.status !== "kapali" && card.status !== "hazirlaniyor" && card.limit - card.spent > 0 && (
                            <div className="mt-4">
                              <TransferForm
                                card={card}
                                peers={cards.filter((item) => item.id !== card.id && (item.status === "aktif" || item.status === "donduruldu"))}
                              />
                            </div>
                          )}
                      </CardSecrets>
                      <CardActions
                        card={card}
                        balance={user.balance}
                        drain={query.get("bildirim") === "harcama" && highlight === card.id}
                        entries={txs.filter((entry) => entry.cardId === card.id).slice(0, 6)}
                      />
                    </article>
                  ))}
                </div>
                </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
