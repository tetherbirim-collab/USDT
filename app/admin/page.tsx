"use client";

import Link from "next/link";
import { AdminBins } from "@/components/admin-bins";
import { adminAccountAction, adminBalanceAction, adminCardAction, adminNoticeAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { CARD_TYPES, PLANS } from "@/lib/catalog";
import { formatTL, formatWhen } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";
import type { InboxNote, User } from "@/lib/types";

function batches(notices: InboxNote[], users: User[]) {
  const names = new Map(users.map((user) => [user.id, user.username]));
  const seen = new Map<
    string,
    { batch: string; title: string; body: string; createdAt: string; who: string[]; read: number }
  >();
  for (const note of [...notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const row = seen.get(note.batch);
    const name = names.get(note.userId) ?? "üye";
    if (!row) {
      seen.set(note.batch, {
        batch: note.batch,
        title: note.title,
        body: note.body,
        createdAt: note.createdAt,
        who: [name],
        read: note.readAt ? 1 : 0,
      });
    } else {
      row.who.push(name);
      if (note.readAt) row.read += 1;
    }
  }
  return [...seen.values()];
}

const STATUS_LABEL = {
  hazirlaniyor: "Hazırlanıyor",
  aktif: "Aktif",
  donduruldu: "Donduruldu",
  kapali: "Kapalı",
} as const;

export default function AdminPage() {
  const query = useQuery();
  if (!query) return <Boot />;
  const highlight = query.get("vurgu");
  const db = snapshot();
  const users = [...db.users].sort((a, b) => {
    if (a.role !== b.role) return a.role === "uye" ? -1 : 1;
    return a.username.localeCompare(b.username, "tr");
  });

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">SİMÜLASYON</p>
        <h1 className="font-display text-4xl font-extrabold">Yönetim masası</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Üye listesi, simülasyon bakiyesi ve kart durumu burada değişir. Kimlik belgesi yok, gerçek
          kart yok, tahsilat yok. Numaralar 400000 test önekidir.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <section className="glass rounded-[28px] p-5">
        <h2 className="font-display text-2xl font-bold">Bildirimler</h2>
        <p className="mt-1 text-sm text-white/60">
          Mesaj üye paneline düşer. Duyuru simülasyondur; e-posta veya kısa mesaj gitmez.
        </p>
        <form action={adminNoticeAction} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Başlık
            <input className="field" name="baslik" required minLength={2} maxLength={80} placeholder="Prova notu" />
          </label>
          <label className="grid gap-1 text-sm">
            Mesaj
            <textarea className="field min-h-24" name="mesaj" required minLength={2} maxLength={400} placeholder="Bu bir simülasyon bildirimidir." />
          </label>
          <label className="grid gap-1 text-sm">
            Kime
            <select className="field" name="hedef" defaultValue="tumu">
              <option value="tumu">Tüm üyeler</option>
              {users.filter((user) => user.role === "uye").map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-gold w-fit">Bildirimi gönder</button>
        </form>
        <ul className="mt-4 grid gap-2">
          {batches(db.notices, db.users).slice(0, 6).map((item) => (
            <li key={item.batch} className="rounded-2xl bg-black/25 px-3 py-3 text-sm">
              <p className="font-semibold">{item.title}</p>
              <p className="text-white/70">{item.body}</p>
              <p className="mt-1 text-xs text-white/45">
                {formatWhen(item.createdAt)} · {item.who.join(", ")} · {item.read}/{item.who.length} okudu
              </p>
            </li>
          ))}
          {db.notices.length === 0 && <li className="text-sm text-white/50">Henüz gönderilmedi.</li>}
        </ul>
      </section>
      <AdminBins bins={db.bins} />
      <div className="grid gap-4">
        {users.map((user) => {
          const cards = db.cards.filter((card) => card.userId === user.id);
          const frozen = cards.filter((card) => card.status === "donduruldu").length;
          return (
            <article
              key={user.id}
              id={user.id}
              className={`glass rounded-[28px] p-5 ${highlight === user.id ? "ring-2 ring-gold" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-bold">{user.name}</p>
                  <Link href={`/admin/kullanici?id=${user.id}`} className="text-gold underline decoration-gold/40">
                    {user.username}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-white/55">Hesap no {user.id}</p>
                  <p className="font-mono text-sm text-white/80">Parola {user.password}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${user.status === "askida" ? "bg-[#ff8aa2] text-[#2a1018]" : "bg-mint text-[#10241f]"}`}
                >
                  {user.status === "askida" ? "Askıda" : "Açık"}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-4">
                {[
                  ["Bakiye", formatTL(user.balance)],
                  ["Plan", PLANS[user.plan].name],
                  ["Kart", `${cards.length} kart${frozen ? ` · ${frozen} dondurulmuş` : ""}`],
                  ["Rol", user.role === "yonetici" ? "Yönetici" : "Üye"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-black/25 px-3 py-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>

              {user.role === "uye" && (
                <form action={adminBalanceAction} className="mt-4 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="uye" value={user.id} />
                  <label className="grid gap-1 text-sm">
                    Simülasyon tutarı (₺)
                    <input className="field w-40" name="tutar" inputMode="decimal" placeholder="250" required />
                  </label>
                  <button className="btn btn-gold" name="yon" value="artir">
                    Artır
                  </button>
                  <button className="btn btn-ghost" name="yon" value="azalt">
                    Azalt
                  </button>
                </form>
              )}

              <div className="mt-4 grid gap-2">
                {cards.length === 0 ? (
                  <p className="text-sm text-white/50">Bu hesapta kart yok.</p>
                ) : (
                  cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 px-3 py-3"
                    >
                      <div>
                        <p className="font-semibold">{card.label}</p>
                        <p className="text-xs text-white/55">
                          {CARD_TYPES[card.type].name} · BIN {card.bin} · •••• {card.pan.slice(-4)} ·{" "}
                          {STATUS_LABEL[card.status]}
                        </p>
                      </div>
                      {card.status === "aktif" && (
                        <form action={adminCardAction}>
                          <input type="hidden" name="id" value={card.id} />
                          <input type="hidden" name="mod" value="dondur" />
                          <button className="btn btn-ghost">Dondur</button>
                        </form>
                      )}
                      {card.status === "donduruldu" && (
                        <form action={adminCardAction}>
                          <input type="hidden" name="id" value={card.id} />
                          <input type="hidden" name="mod" value="coz" />
                          <button className="btn btn-gold">Çöz</button>
                        </form>
                      )}
                    </div>
                  ))
                )}
              </div>

              {user.role === "uye" && (
                <form action={adminAccountAction} className="mt-4">
                  <input type="hidden" name="uye" value={user.id} />
                  {user.status === "acik" ? (
                    <button className="btn btn-danger" name="mod" value="aski">
                      Hesabı askıya al
                    </button>
                  ) : (
                    <button className="btn btn-gold" name="mod" value="ac">
                      Hesabı aç
                    </button>
                  )}
                </form>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
