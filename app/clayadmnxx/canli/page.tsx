"use client";

import Link from "next/link";
import { settlePayoutAction } from "@/lib/actions";
import { AdminOrderSlip } from "@/components/admin-order-slip";
import { ADMIN_PATH } from "@/lib/auth";
import { CARD_TYPES } from "@/lib/catalog";
import { Notice } from "@/components/notice";
import { Boot, useQuery, useSiteSettings } from "@/lib/live";
import { formatSigned, formatTL, formatUsd, formatWhen } from "@/lib/format";
import { snapshot } from "@/lib/store";
import type { CardTypeId } from "@/lib/types";

const SCENES = Object.keys(CARD_TYPES) as CardTypeId[];

export default function LiveDesk() {
  const query = useQuery();
  const settings = useSiteSettings();
  if (!query) return <Boot />;
  const db = snapshot();
  const pst = settings.pst;
  const watched = pst?.watchedAt ? Date.now() - Date.parse(pst.watchedAt) < 90000 : false;
  const wallets = pst?.wallets ?? [];
  const queue = (pst?.queue ?? []).filter((job) => job.status === "bekliyor" || job.status === "hata");
  const waiting = db.payouts.filter((row) => row.status === "bekliyor");
  const money = [...db.transactions]
    .filter((entry) => entry.title.startsWith("PST ") || entry.title.startsWith("Çekim"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  const byScene = SCENES.map((id) => ({
    id,
    name: CARD_TYPES[id].name,
    count: db.cards.filter((card) => card.type === id && card.status !== "kapali").length,
  }));

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold">CANLI MASA</p>
          <h1 className="font-display text-4xl font-extrabold">Stüdyo</h1>
          <p className="mt-2 max-w-2xl text-white/70">Kart, yatırım, çekim ve kapatma aynı masada. PST bağlantısı ekran kapalıyken de buraya düşer.</p>
        </div>
        <p className={`rounded-full px-3 py-2 text-sm font-bold ${watched ? "bg-[#e0152b] text-white" : "bg-white/10 text-white/70"}`}>
          {watched ? "İzleyici ayakta" : "İzleyici duruyor"}
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Açık kart", String(db.cards.filter((card) => card.status === "aktif" || card.status === "donduruldu").length)],
          ["PST kartı", String(db.cards.filter((card) => card.id.startsWith("crd_pst_")).length)],
          ["Bekleyen çekim", String(waiting.length)],
          ["Kapatma kuyruğu", String(queue.length)],
        ].map(([label, value]) => (
          <article key={label} className="glass rounded-[24px] p-4">
            <p className="text-sm text-white/55">{label}</p>
            <p className="font-display mt-2 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </div>
      <section id="basimlar" className="grid gap-3 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Yeni basımlar</h2>
        {db.orders.length === 0 && <p className="text-sm text-white/55">Henüz sipariş yok.</p>}
        {[...db.orders]
          .sort((a, b) => Number(b.status === "hazirlaniyor") - Number(a.status === "hazirlaniyor") || b.createdAt.localeCompare(a.createdAt))
          .slice(0, 6)
          .map((order) => (
            <AdminOrderSlip key={order.id} order={order} />
          ))}
      </section>
      <section className="grid gap-3 lg:grid-cols-2">
        <article className="glass rounded-[28px] p-5">
          <h2 className="font-display text-2xl font-bold">PST cüzdanı</h2>
          <p className="mt-2 text-sm text-white/65">
            {pst?.on ? `Bağlı · anahtar ••••${pst.tokenTail} · ${pst.cards} kart · ${pst.transactions} hareket` : "Bağlı değil."}
            {pst?.error ? ` ${pst.error}` : ""}
          </p>
          <ul className="mt-4 grid gap-2">
            {wallets.length === 0 && <li className="text-sm text-white/55">Cüzdan bakiyesi ilk izlemede yazılır.</li>}
            {wallets.map((row) => (
              <li key={row.id} className="rounded-2xl bg-black/25 px-3 py-3">
                <p className="text-xs text-white/45">Hesap {row.id}</p>
                <p className="font-display text-2xl font-bold">{formatUsd(row.minor)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-white/60">
            Kart bedeli {formatTL(settings.issueFeeKurus)} · yükleme %{String(settings.loadFeePercent).replace(".", ",")} · aktarım %{settings.transferFeePercent}
          </p>
          <Link href={`${ADMIN_PATH}/ucretler`} className="mt-3 inline-block text-sm font-semibold text-gold">
            Ücret masası
          </Link>
        </article>
        <article className="glass rounded-[28px] p-5">
          <h2 className="font-display text-2xl font-bold">Sahne</h2>
          <ul className="mt-4 grid gap-2">
            {byScene.map((row) => (
              <li key={row.id} className="flex items-center justify-between rounded-2xl bg-black/25 px-3 py-3">
                <span className="font-semibold">{row.name}</span>
                <span className="font-display text-xl font-bold">{row.count}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
      <section id="cekim" className="grid gap-3 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Çekim kuyruğu</h2>
        {waiting.length === 0 && <p className="text-sm text-white/60">Bekleyen talep yok.</p>}
        {waiting.map((row) => {
          const owner = db.users.find((user) => user.id === row.userId);
          return (
            <article key={row.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-3">
              <div>
                <p className="font-semibold">{formatTL(row.amount)}</p>
                <p className="text-sm text-white/70">{row.wallet}</p>
                <p className="mt-1 text-xs text-white/45">
                  {owner ? (
                    <Link href={`${ADMIN_PATH}/kullanici?id=${owner.id}`} className="text-gold">
                      {owner.username}
                    </Link>
                  ) : (
                    "üye"
                  )}
                  {" · "}
                  {formatWhen(row.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={settlePayoutAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="karar" value="gitti" />
                  <button className="btn btn-gold px-3 py-2 text-sm" type="submit">
                    Gönderildi
                  </button>
                </form>
                <form action={settlePayoutAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="karar" value="iptal" />
                  <button className="btn btn-ghost px-3 py-2 text-sm" type="submit">
                    İptal
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </section>
      <section className="grid gap-3 lg:grid-cols-2">
        <article className="glass rounded-[28px] p-5">
          <h2 className="font-display text-2xl font-bold">Yatırım ve çekim</h2>
          <ul className="mt-3 grid gap-2">
            {money.length === 0 && <li className="text-sm text-white/55">Henüz PST hareketi yok.</li>}
            {money.map((entry) => (
              <li key={entry.id} className="rounded-2xl bg-black/25 px-3 py-3 text-sm">
                <p className="font-semibold">{entry.title}</p>
                <p className={entry.amount < 0 ? "text-white" : "text-mint"}>{formatSigned(entry.amount)}</p>
                <p className="text-xs text-white/45">{formatWhen(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="glass rounded-[28px] p-5">
          <h2 className="font-display text-2xl font-bold">Kart kapatma</h2>
          <ul className="mt-3 grid gap-2">
            {queue.length === 0 && <li className="text-sm text-white/55">Bekleyen kapatma yok.</li>}
            {queue.map((job) => (
              <li key={job.id} className="rounded-2xl bg-black/25 px-3 py-3 text-sm">
                <p className="font-semibold">{job.cardId}</p>
                <p className="text-white/70">{job.status === "hata" ? job.error || "PST yanıt vermedi" : "PST’ye gidiyor"}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
