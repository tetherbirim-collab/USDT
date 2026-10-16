"use client";

import Link from "next/link";
import { useState } from "react";
import { adminAccountAction, adminBalanceAction, adminBulkSuspendAction, adminCloseAccountAction } from "@/lib/actions";
import { Notice } from "@/components/notice";
import { ADMIN_PATH } from "@/lib/auth";
import { formatTL, showOrderCode } from "@/lib/format";
import { Boot, useQuery, useSiteSettings } from "@/lib/live";
import { snapshot } from "@/lib/store";

export default function AdminMembersPage() {
  const query = useQuery();
  const settings = useSiteSettings();
  if (!query) return <Boot />;
  const highlight = query.get("vurgu");
  const [picked, setPicked] = useState<string[]>([]);
  const db = snapshot();
  const users = [...db.users].sort((a, b) => {
    if (a.role !== b.role) return a.role === "uye" ? -1 : 1;
    return a.username.localeCompare(b.username, "tr");
  });

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">ÜYELER</p>
        <h1 className="font-display text-4xl font-extrabold">Üye listesi</h1>
        <p className="mt-2 max-w-2xl text-white/70">
          Bakiye dolar olarak yazılır, ekranda canlı kurun TL karşılığı durur. Parola düz metin görünür. Kart dondurma Kartlar sekmesindedir.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={adminBulkSuspendAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="idler" value={picked.join(",")} />
        <input type="hidden" name="donus" value={`${ADMIN_PATH}/uyeler`} />
        <button className="btn btn-danger">Seçilenleri askıya al</button>
        <p className="text-sm text-white/60">{picked.length} üye seçili</p>
      </form>
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
                  <div className="flex items-center gap-2">
                    {user.role === "uye" && user.status === "acik" && (
                      <input
                        type="checkbox"
                        aria-label={`${user.username} seç`}
                        checked={picked.includes(user.id)}
                        onChange={() => setPicked((cur) => (cur.includes(user.id) ? cur.filter((id) => id !== user.id) : [...cur, user.id]))}
                      />
                    )}
                    <p className="font-display text-2xl font-bold">{user.name}</p>
                  </div>
                  <Link href={`${ADMIN_PATH}/kullanici?id=${user.id}`} className="text-gold underline decoration-gold/40">
                    {user.username}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-white/55">Hesap no {user.id}</p>
                  <p className="font-mono text-sm text-white/80">Parola {user.password}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${user.status === "acik" ? "bg-mint text-[#10241f]" : "bg-[#ff8aa2] text-[#2a1018]"}`}
                >
                  {user.status === "kapali" ? "Kapalı" : user.status === "askida" ? "Askıda" : "Açık"}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-4">
                {[
                  ["Bakiye", formatTL(user.balance)],
                  ["Plan", settings.plans[user.plan].name],
                  ["Kart", `${cards.length} kart${frozen ? ` · ${frozen} dondurulmuş` : ""}`],
                  ["Rol", user.role === "yonetici" ? "Yönetici" : "Üye"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-black/25 px-3 py-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              {cards.length > 0 && (
                <ul className="mt-4 grid gap-1 text-sm">
                  {cards.map((card) => {
                    const order = db.orders.find((row) => row.cardId === card.id);
                    const code = showOrderCode(order ?? { cardId: card.id, id: card.id });
                    return (
                      <li key={card.id}>
                        <Link href={`${ADMIN_PATH}/kartlar?vurgu=${card.id}`} className="font-semibold text-gold">
                          {code}
                        </Link>
                        <span className="text-white/70">
                          {" "}
                          · {card.label} · {user.username}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {user.role === "uye" && (
                <form action={adminBalanceAction} className="mt-4 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="uye" value={user.id} />
                  <label className="grid gap-1 text-sm">
                    Tutar (USD)
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
              {user.role === "uye" && (
                <form action={adminAccountAction} className="mt-4">
                  <input type="hidden" name="uye" value={user.id} />
                  <input type="hidden" name="donus" value={`${ADMIN_PATH}/uyeler`} />
                  {user.status === "acik" ? (
                    <button className="btn btn-danger" name="mod" value="aski">
                      Hesabı askıya al
                    </button>
                  ) : user.status === "askida" ? (
                    <button className="btn btn-gold" name="mod" value="ac">
                      Hesabı aç
                    </button>
                  ) : null}
                </form>
              )}
              {user.role === "uye" && user.status !== "kapali" && (
                <form action={adminCloseAccountAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="uye" value={user.id} />
                  <input type="hidden" name="mod" value="kalici" />
                  <input type="hidden" name="donus" value={`${ADMIN_PATH}/uyeler`} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="onay" value="on" required />
                    Kalıcı kapat
                  </label>
                  <button className="btn btn-ghost">Kalıcı kapat</button>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
