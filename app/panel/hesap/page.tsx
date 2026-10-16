"use client";

import { AccountOrbit } from "@/components/pay-marks";
import { Notice } from "@/components/notice";
import { securityQuestionAction } from "@/lib/actions";
import { PLANS, SECURITY_QUESTIONS, securityQuestionLabel } from "@/lib/catalog";
import { daysLeftLine, daysUntil, formatDay, formatTL } from "@/lib/format";
import { Boot, useQuery, useSiteSettings, useUser } from "@/lib/live";

const EMOJI = { bronze: "🥉", silver: "🥈", gold: "🥇" } as const;

export default function AccountPage() {
  const user = useUser();
  const query = useQuery();
  const settings = useSiteSettings();
  if (!user || !query) return <Boot />;
  const planId = user.plan === "atolye" || user.plan === "galeri" ? user.plan : "kivilcim";
  const plan = settings.plans?.[planId] ?? settings.plans?.kivilcim;
  const planName = plan?.name ?? PLANS[planId].name;
  const metal = PLANS[planId]?.metal ?? "bronze";
  const days = daysUntil(user.planUntil || new Date().toISOString());
  const remain = days > 0 ? `Bitmesine ${daysLeftLine(days)}` : days === 0 ? "Paket bugün bitiyor" : "Paket günü geçti";

  return (
    <div className="grid gap-5">
      <section className="account-hero">
        <div className="account-hero-copy">
          <p className="account-kicker">HESABIN</p>
          <h1 className="account-name font-display">{user.username}</h1>
          <div className="account-stats">
            <p>
              <small>Ana bakiye</small>
              <strong>{formatTL(user.balance)}</strong>
            </p>
            <p>
              <small>Paket</small>
              <strong>
                <span aria-hidden>{EMOJI[metal]} </span>
                {planName}
              </strong>
            </p>
          </div>
          <p className="account-line">
            Adın <strong>{user.username}</strong>. Kayıtta seçtiğin kullanıcı adı.
          </p>
          <p className="account-line">
            Ana bakiye <strong>{formatTL(user.balance)}</strong>. Kart bedeli ve karta yükleme buradan düşer.
          </p>
          <p className="account-line">
            <span aria-hidden>{EMOJI[metal]} </span>
            {planName}. {remain}. Yenileme {formatDay(user.planUntil)}.
          </p>
          <p className="account-id">Hesap no {user.id}</p>
        </div>
        <AccountOrbit />
      </section>
      <Notice code={query.get("bildirim") || undefined} />
      <form action={securityQuestionAction} className="account-sheet">
        <h2 className="account-sheet-title font-display text-2xl font-bold">Güvenlik sorusu</h2>
        <p className="text-sm text-white/60">
          {user.hasSeed
            ? "Kurtarma tohumun kayıtta bir kez gösterildi. Şifreni unutursan kullanıcı adın ve tohumla girersin. İstersen buna ek bir güvenlik sorusu da kaydedebilirsin."
            : user.securityQuestion
              ? `Kayıtlı sorun: ${securityQuestionLabel(user.securityQuestion)}. Yanıt ekranda durmaz. Değiştirmek için mevcut parolanı ve yeni yanıtı yaz.`
              : "Henüz sorun yok. Mevcut parolanı, soruyu ve yanıtı yazıp kaydet. Şifreni unutursan girişteki Şifremi unuttum ile kullanıcı adın ve bu yanıt yeni parola belirler."}
        </p>
        <label className="grid gap-1 text-sm">
          Mevcut parola
          <input className="field" name="eski" type="password" required autoComplete="current-password" />
        </label>
        <label className="grid gap-1 text-sm">
          Soru
          <select className="field" name="soru" required defaultValue={user.securityQuestion || "hayvan"}>
            {SECURITY_QUESTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Yanıt
          <input className="field" name="cevap" required minLength={2} maxLength={40} autoComplete="off" placeholder="Yanıtını yaz" />
        </label>
        <button className="btn btn-gold w-fit">Soruyu kaydet</button>
      </form>
    </div>
  );
}
