import Link from "next/link";
import { CardActions } from "@/components/card-actions";
import { Notice } from "@/components/notice";
import { VirtualCard } from "@/components/virtual-card";
import { getCurrentUser } from "@/lib/auth";
import { listCards } from "@/lib/store";
import { redirect } from "next/navigation";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const sp = await searchParams;
  const highlight = one(sp.vurgu);
  const cards = listCards(user.id);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold">KARTLAR</p>
          <h1 className="font-display text-4xl font-extrabold">Sahne kartları</h1>
          <p className="mt-2 max-w-xl text-white/65">
            Her kart SİMÜLASYON rozetlidir. Numaralar 400000 test BIN’idir ve gerçek üye işyerinde
            kullanılamaz.
          </p>
        </div>
        <Link href="/panel/kartlar/yeni" className="btn btn-gold">
          Kart bas
        </Link>
      </div>
      <Notice code={one(sp.bildirim)} />
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
              <VirtualCard card={card} />
              <CardActions card={card} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
