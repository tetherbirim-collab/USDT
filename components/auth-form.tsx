"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useChrome } from "@/components/chrome-controls";
import { loginAction, registerAction, resetPasswordAction } from "@/lib/actions";
import { uiText } from "@/lib/ui";
import { SECURITY_QUESTIONS, WELCOME_BONUS_KURUS } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { Boot } from "@/lib/live";

function QuestionFields() {
  return (
    <>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Güvenlik sorusu
        <select className="auth-field" name="soru" required defaultValue="hayvan">
          {SECURITY_QUESTIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-[#8b95a5]">Şifreni unutursan bu soruyu seçip yanıtını yazarsın.</span>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Güvenlik yanıtı
        <input className="auth-field" name="cevap" autoComplete="off" placeholder="Yanıtını yaz" required minLength={2} maxLength={40} />
        <span className="text-xs font-normal text-[#8b95a5]">En az 2 karakter. Büyük küçük harf fark etmez.</span>
      </label>
    </>
  );
}

export function LoginForm() {
  const { lang } = useChrome();
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={action} className="grid gap-3">
      {pending && (
        <div className="fixed inset-0 z-[80] bg-[#07060b]">
          <Boot />
        </div>
      )}
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Kullanıcı adı
        <input
          className="auth-field"
          name="kullanici"
          autoComplete="username"
          placeholder="ornek_ad"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Parola
        <input
          className="auth-field"
          name="parola"
          type="password"
          autoComplete="current-password"
          placeholder="Parolan"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <p className="text-xs font-normal text-[#8b95a5]">
        Parolanı unuttuysan Şifremi unuttum düğmesine bas. Kullanıcı adın ve güvenlik yanıtın doğruysa yeni parola belirlersin.
      </p>
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="auth-primary mt-2" type="submit" disabled={pending}>
        {uiText(lang, "signInLong")}
      </button>
      <Link href="/sifre" className="auth-outline">
        {uiText(lang, "forgot")}
      </Link>
    </form>
  );
}

export function RegisterForm() {
  const { lang } = useChrome();
  const [state, action, pending] = useActionState(registerAction, { error: "" });
  return (
    <form action={action} className="grid gap-3">
      {pending && (
        <div className="fixed inset-0 z-[80] bg-[#07060b]">
          <Boot />
        </div>
      )}
      <p className="text-sm text-[#5c6774]">
        Kullanıcı adını, parolanı iki kez ve güvenlik yanıtını yaz. Kayıt olunca panele girersin. Hoş geldin bakiyesi {formatTL(WELCOME_BONUS_KURUS)}.
      </p>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Kullanıcı adı
        <input className="auth-field" name="kullanici" autoComplete="username" placeholder="ornek_ad" required minLength={2} maxLength={24} />
        <span className="text-xs font-normal text-[#8b95a5]">2–24 karakter. Harf, rakam ve alt çizgi.</span>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Parola
        <input className="auth-field" name="parola" type="password" autoComplete="new-password" placeholder="En az 6 karakter" required minLength={6} maxLength={72} />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Parolayı yeniden yaz
        <input className="auth-field" name="parola2" type="password" autoComplete="new-password" placeholder="Aynı parolayı yaz" required minLength={6} maxLength={72} />
      </label>
      <QuestionFields />
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="auth-primary mt-1" type="submit" disabled={pending}>
        {uiText(lang, "register")}
      </button>
      <Link href="/sifre" className="auth-outline">
        {uiText(lang, "forgot")}
      </Link>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, { error: "" });
  return (
    <form action={action} className="grid gap-3">
      {pending && (
        <div className="fixed inset-0 z-[80] bg-[#07060b]">
          <Boot />
        </div>
      )}
      <ol className="grid list-decimal gap-1 pl-5 text-sm text-[#5c6774]">
        <li>Kayıt olurken yazdığın kullanıcı adını yaz.</li>
        <li>Aynı güvenlik sorusunu seç ve yanıtını yaz. Büyük küçük harf fark etmez.</li>
        <li>Yeni parolanı iki kez yaz. Doğruysa parola değişir ve panele girersin.</li>
      </ol>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Kullanıcı adı
        <input className="auth-field" name="kullanici" autoComplete="username" placeholder="ornek_ad" required minLength={2} maxLength={24} />
      </label>
      <QuestionFields />
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Yeni parola
        <input className="auth-field" name="parola" type="password" autoComplete="new-password" placeholder="En az 6 karakter" required minLength={6} maxLength={72} />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Yeni parolayı yeniden yaz
        <input className="auth-field" name="parola2" type="password" autoComplete="new-password" placeholder="Aynı parolayı yaz" required minLength={6} maxLength={72} />
      </label>
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="auth-primary mt-1" type="submit" disabled={pending}>
        Yeni parolayı kaydet
      </button>
    </form>
  );
}
