"use client";

import Link from "next/link";
import {
  adminAccountAction,
  adminEditCardAction,
  adminEditTopupAction,
  adminEditTxAction,
  adminSetBalanceAction,
} from "@/lib/actions";
import { Notice } from "@/components/notice";
import { ADMIN_PATH } from "@/lib/auth";
import { CARD_TYPES, KIND_LABEL, kurusToUsdMinor } from "@/lib/catalog";
import { formatSigned, formatTL, formatWhen, isoToIstanbulInput, kurusToInput } from "@/lib/format";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";

const STATUS_LABEL = {
  hazirlaniyor: "Hazırlanıyor",
  aktif: "Aktif",
  donduruldu: "Donduruldu",
  kapali: "Kapalı",
} as const;

export default function AdminUserPage() {
  const query = useQuery();
  if (!query) return <Boot />;
  const id = query.get("id") || "";
  const db = snapshot();
  const user = db.users.find((item) => item.id === id);
  if (!user) {
    return (
      <div className="glass rounded-[28px] p-6">
        <p>Bu hesap yok.</p>
        <Link href={`${ADMIN_PATH}/uyeler`} className="btn btn-gold mt-4">
          Listeye dön
        </Link>
      </div>
    );
  }

  const cards = db.cards.filter((card) => card.userId === user.id);
  const txs = db.transactions
    .filter((entry) => entry.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const lastTopup = txs.find((entry) => entry.kind === "yukleme" && entry.status === "tamamlandi");
  const back = `${ADMIN_PATH}/kullanici?id=${user.id}`;
  const member = user.role === "uye";

  return (
    <div className="grid gap-5">
      <div>
        <Link href={`${ADMIN_PATH}/uyeler`} className="text-sm font-semibold text-gold">
          ← Üye listesi
        </Link>
        <p className="mt-3 text-xs font-bold tracking-[0.22em] text-gold">ÜYE</p>
        <h1 className="font-display text-4xl font-extrabold">{user.username}</h1>
        <p className="mt-1 text-white/70">{user.name}</p>
        <p className="mt-1 text-sm text-white/70">Adres {user.address.trim() ? user.address : "yazılmadı"}</p>
        <p className="mt-2 font-mono text-sm text-white/70">Hesap no {user.id}</p>
        <p className="font-mono text-sm text-white/90">Parola {user.password}</p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />

      <section className="glass rounded-[28px] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Bakiye</p>
            <p className="font-display text-4xl font-extrabold">{formatTL(user.balance)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${user.status === "askida" ? "bg-[#ff8aa2] text-[#2a1018]" : "bg-mint text-[#10241f]"}`}>
            {user.status === "askida" ? "Askıda" : "Açık"}
          </span>
        </div>
        {member && (
          <form action={adminSetBalanceAction} className="mt-4 flex flex-wrap items-end gap-2">
            <input type="hidden" name="uye" value={user.id} />
            <input type="hidden" name="donus" value={back} />
            <label className="grid gap-1 text-sm">
              Yeni bakiye (USD)
              <input className="field w-40" name="bakiye" inputMode="decimal" defaultValue={kurusToInput(kurusToUsdMinor(user.balance))} required />
            </label>
            <button className="btn btn-gold">Bakiyeyi yaz</button>
          </form>
        )}
        {member && (
          <form action={adminAccountAction} className="mt-4">
            <input type="hidden" name="uye" value={user.id} />
            <input type="hidden" name="donus" value={back} />
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
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-2xl font-bold">Kartlar</h2>
        {cards.length === 0 && <p className="text-sm text-white/55">Bu hesapta kart yok.</p>}
        {cards.map((card) => (
          <article key={card.id} className="glass rounded-[28px] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold">{card.label}</p>
                <p className="text-sm text-white/60">
                  {CARD_TYPES[card.type].name} · {STATUS_LABEL[card.status]} · BIN {card.bin} · •••• {card.pan.slice(-4)}
                </p>
              </div>
              <p className="text-sm font-semibold">
                {formatTL(card.spent)} / {formatTL(card.limit)}
              </p>
            </div>
            {member && (
              <form action={adminEditCardAction} className="mt-4 grid gap-3 sm:grid-cols-4">
                <input type="hidden" name="id" value={card.id} />
                <input type="hidden" name="uye" value={user.id} />
                <input type="hidden" name="donus" value={back} />
                <label className="grid gap-1 text-sm sm:col-span-2">
                  Kart adı
                  <input className="field" name="etiket" defaultValue={card.label} required minLength={2} maxLength={32} />
                </label>
                <label className="grid gap-1 text-sm">
                  Tavan (USD)
                  <input className="field" name="limit" inputMode="decimal" defaultValue={kurusToInput(kurusToUsdMinor(card.limit))} required />
                </label>
                <label className="grid gap-1 text-sm">
                  Durum
                  <select className="field" name="durum" defaultValue={card.status}>
                    <option value="hazirlaniyor">Hazırlanıyor</option>
                    <option value="aktif">Aktif</option>
                    <option value="donduruldu">Donduruldu</option>
                    <option value="kapali">Kapalı</option>
                  </select>
                </label>
                <button className="btn btn-gold w-fit">Kartı kaydet</button>
              </form>
            )}
          </article>
        ))}
      </section>

      <section className="glass rounded-[28px] p-5">
        <h2 className="font-display text-2xl font-bold">Son yükleme</h2>
        {lastTopup ? (
          <>
            <p className="mt-2 text-white/75">
              {formatWhen(lastTopup.createdAt)} · {formatTL(lastTopup.amount)} · {lastTopup.title}
            </p>
            {member && (
              <form action={adminEditTopupAction} className="mt-4 flex flex-wrap items-end gap-2">
                <input type="hidden" name="uye" value={user.id} />
                <input type="hidden" name="donus" value={back} />
                <label className="grid gap-1 text-sm">
                  Zaman (İstanbul)
                  <input className="field" type="datetime-local" name="zaman" defaultValue={isoToIstanbulInput(lastTopup.createdAt)} required />
                </label>
                <button className="btn btn-gold">Zamanı yaz</button>
              </form>
            )}
          </>
        ) : (
          <p className="mt-2 text-white/70">Hiç yükleme yapılmadı.</p>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-2xl font-bold">İşlemler</h2>
        {txs.length === 0 && <p className="text-sm text-white/55">İşlem yok.</p>}
        {txs.map((entry) => (
          <article key={entry.id} className="glass rounded-[24px] px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-xs text-white/50">
                  {KIND_LABEL[entry.kind]} · {formatWhen(entry.createdAt)}
                  {entry.status === "reddedildi" ? " · Reddedildi" : ""}
                </p>
              </div>
              <p className={entry.amount > 0 ? "font-bold text-mint" : "font-semibold"}>{formatSigned(entry.amount)}</p>
            </div>
            {member && (
              <form action={adminEditTxAction} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="islem" value={entry.id} />
                <input type="hidden" name="uye" value={user.id} />
                <input type="hidden" name="donus" value={back} />
                <label className="grid gap-1 text-sm">
                  Tutar (USD)
                  <input className="field w-36" name="tutar" defaultValue={kurusToInput(kurusToUsdMinor(entry.amount))} required />
                </label>
                <button className="btn btn-ghost">Tutarı yaz</button>
              </form>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
