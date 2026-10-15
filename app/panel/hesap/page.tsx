"use client";

import { Notice } from "@/components/notice";
import { addressAction, displayNameAction, passwordChangeAction, planAction } from "@/lib/actions";
import { PLANS, usdMinorToKurus } from "@/lib/catalog";
import { daysLeftLine, daysUntil, formatDay, formatTL } from "@/lib/format";
import { Boot, useQuery, useSiteSettings, useUser } from "@/lib/live";
import type { PlanId } from "@/lib/types";

const RANK: Record<PlanId, number> = { kivilcim: 0, atolye: 1, galeri: 2 };
const EMOJI = { bronze: "🥉", silver: "🥈", gold: "🥇" } as const;

export default function AccountPage() {
  const user = useUser();
  const query = useQuery();
  const settings = useSiteSettings();
  if (!user || !query) return <Boot />;
  const plan = settings.plans[user.plan];
  const metal = PLANS[user.plan].metal;
  const days = daysUntil(user.planUntil);
  const remain = days > 0 ? `Bitmesine ${daysLeftLine(days)}` : days === 0 ? "Paket bugün bitiyor" : "Paket günü geçti";

  return (
    <div className="grid gap-5">
      <section className="account-hero">
        <p className="account-kicker">HESABIN</p>
        <h1 className="account-name font-display">{user.name}</h1>
        <p className="account-line">
          Kullanıcı adın <strong>{user.username}</strong>. Bu adla girersin.
        </p>
        <p className="account-line">
          Cüzdanın <strong>{formatTL(user.balance)}</strong>. Kart bedeli ve karta yükleme buradan düşer. Kartlar arası aktarım ana bakiyeye dokunmaz.
        </p>
        <p className="account-line">
          <span aria-hidden>{EMOJI[metal]} </span>
          Paketin {plan.name}. {remain}. Yenileme {formatDay(user.planUntil)}.
        </p>
        <p className="account-id">Hesap no {user.id}</p>
      </section>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={displayNameAction} className="account-sheet">
        <h2 className="font-display text-2xl font-bold">Görünen ad</h2>
        <p className="text-sm text-white/60">Panelde bu ad yazar. Kartın üzerindeki ad, kartı basarken verdiğin addır.</p>
        <label className="grid gap-1 text-sm">
          Ad
          <input className="field" name="ad" required minLength={2} maxLength={40} defaultValue={user.name} />
        </label>
        <button className="btn btn-gold w-fit">Adı kaydet</button>
      </form>
      <form action={addressAction} className="account-sheet">
        <h2 className="font-display text-2xl font-bold">Kart adresi</h2>
        <p className="text-sm text-white/60">Yalnızca senin kartlarının detayında görünür. Boş bırakıp kaydedince satır silinir.</p>
        <label className="grid gap-1 text-sm">
          Adres
          <textarea className="field min-h-24" name="adres" maxLength={120} defaultValue={user.address} />
        </label>
        <button className="btn btn-gold w-fit">Adresi kaydet</button>
      </form>
      <section className="grid gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold">PLAN</p>
          <h2 className="font-display text-3xl font-bold">Planı yükselt</h2>
          <p className="mt-2 max-w-xl text-sm text-white/65">
            Seçtiğin paketin ücreti bakiyeden düşer. Aynı pakete basmak ücret almaz. Açık kart adedi yeni pakete sığmazsa geçiş olmaz.
          </p>
        </div>
        <div className="plan-grid">
          {(Object.keys(PLANS) as PlanId[]).map((id) => {
            const row = settings.plans[id];
            const current = id === user.plan;
            const higher = RANK[id] > RANK[user.plan];
            return (
              <form key={id} action={planAction} className={`plan-card plan-${PLANS[id].metal}`}>
                <input type="hidden" name="plan" value={id} />
                <p className="text-xs font-bold tracking-[0.16em] text-white/70">{current ? "SEÇİLİ PAKET" : higher ? "YÜKSELT" : "GEÇİŞ"}</p>
                <h3 className="font-display mt-2 text-2xl font-bold">
                  <span aria-hidden>{EMOJI[PLANS[id].metal]} </span>
                  {row.name}
                </h3>
                <p className="mt-3 font-display text-3xl font-extrabold">{row.priceUsdMinor / 100} USD</p>
                <p className="text-sm text-[#ffe7c2]">{formatTL(usdMinorToKurus(row.priceUsdMinor))}</p>
                <p className="mt-3 text-sm text-white/80">En fazla {row.cardLimit} açık kart</p>
                {current && <p className="mt-2 text-sm font-semibold text-[#ffe7c2]">{remain}</p>}
                <button className="btn btn-gold relative z-[1] mt-5 w-full" type="submit">
                  {current ? "Bu paket sende" : higher ? "Planı yükselt" : "Bu plana geç"}
                </button>
              </form>
            );
          })}
        </div>
      </section>
      <form action={passwordChangeAction} className="account-sheet">
        <h2 className="font-display text-2xl font-bold">Parola</h2>
        <p className="text-sm text-white/60">Yeni parola en az 6 karakter. Yönetici masasında düz metin olarak durur.</p>
        <label className="grid gap-1 text-sm">
          Mevcut parola
          <input className="field" name="eski" type="password" required autoComplete="current-password" />
        </label>
        <label className="grid gap-1 text-sm">
          Yeni parola
          <input className="field" name="yeni" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
        </label>
        <label className="grid gap-1 text-sm">
          Yeni parola tekrar
          <input className="field" name="yeni2" type="password" required minLength={6} maxLength={72} autoComplete="new-password" />
        </label>
        <button className="btn btn-gold w-fit">Parolayı güncelle</button>
      </form>
    </div>
  );
}
