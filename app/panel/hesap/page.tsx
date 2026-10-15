"use client";

import { Notice } from "@/components/notice";
import { addressAction, displayNameAction, passwordChangeAction, planAction } from "@/lib/actions";
import { PLANS, usdMinorToKurus } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { Boot, useQuery, useUser } from "@/lib/live";
import type { PlanId } from "@/lib/types";

export default function AccountPage() {
  const user = useUser();
  const query = useQuery();
  if (!user || !query) return <Boot />;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">HESAP</p>
        <h1 className="font-display text-4xl font-extrabold">Hesap</h1>
        <p className="mt-2 max-w-xl text-white/70">
          Kart bedeli, karta yükleme ve harcama bu hesabın bakiyesinden düşer. Kartlar arası aktarım ana bakiyeye dokunmaz.
        </p>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <dl className="glass grid max-w-md gap-3 rounded-[28px] p-5 text-sm">
        <div>
          <dt className="text-white/50">Hesap no</dt>
          <dd className="font-mono text-base">{user.id}</dd>
        </div>
        <div>
          <dt className="text-white/50">Kullanıcı adı</dt>
          <dd className="font-semibold">{user.username}</dd>
        </div>
        <div>
          <dt className="text-white/50">Görünen ad</dt>
          <dd className="font-semibold">{user.name}</dd>
        </div>
      </dl>
      <form action={displayNameAction} className="glass grid max-w-md gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Görünen ad
          <input className="field" name="ad" required minLength={2} maxLength={40} defaultValue={user.name} />
        </label>
        <p className="text-xs text-white/50">Bu ad panelde görünür. Kartın üzerindeki ad, kartı oluştururken verdiğin addır.</p>
        <button className="btn btn-gold w-fit">Adı kaydet</button>
      </form>
      <form action={addressAction} className="glass grid max-w-md gap-3 rounded-[28px] p-5">
        <label className="grid gap-1 text-sm">
          Kart adresi
          <textarea className="field min-h-24" name="adres" maxLength={120} defaultValue={user.address} />
        </label>
        <p className="text-xs text-white/50">
          Yalnızca senin kartlarının detayında görünür. Boş bırakıp kaydedince satır silinir. Bu bir fatura adresi değildir.
        </p>
        <button className="btn btn-gold w-fit">Adresi kaydet</button>
      </form>
      <form action={planAction} className="glass grid max-w-xl gap-3 rounded-[28px] p-5">
        <p className="font-semibold">Plan</p>
        <p className="text-sm text-white/60">
          Açık kart adedi planın tavanını aşamaz. Bronze 2, Silver 8, Gold 25. Her kart ayrıca 300₺.
        </p>
        {(Object.keys(PLANS) as PlanId[]).map((id) => (
          <label key={id} className={`plan-card plan-${PLANS[id].metal} !p-3`}>
            <input className="mr-2" type="radio" name="plan" value={id} defaultChecked={user.plan === id} />
            <span className="font-semibold">{PLANS[id].name}</span>
            <span className="mt-1 block text-sm text-white/80">
              {PLANS[id].cardLimit} açık kart · {PLANS[id].priceUsdMinor / 100} USD · {formatTL(usdMinorToKurus(PLANS[id].priceUsdMinor))}
            </span>
          </label>
        ))}
        <button className="btn btn-gold w-fit">Planı kaydet</button>
      </form>
      <form action={passwordChangeAction} className="glass grid max-w-md gap-3 rounded-[28px] p-5">
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
