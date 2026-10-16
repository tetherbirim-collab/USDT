"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useChrome } from "@/components/chrome-controls";
import { loginAction, registerAction, resetPasswordAction, seedLoginAction } from "@/lib/actions";
import { uiText } from "@/lib/ui";
import { SECURITY_QUESTIONS, WELCOME_BONUS_KURUS } from "@/lib/catalog";
import { formatTL } from "@/lib/format";
import { Boot } from "@/lib/live";
import { makeSignup, type SignupSlip } from "@/lib/secrets";

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
        Yeni hesaplar 8 haneli parola kullanır. Unuttuysan Şifremi unuttum sayfasında tohum kelimelerini yaz. Eski hesaplar güvenlik sorusuyla yenilenir.
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

function slipText(slip: SignupSlip): string {
  return [`Kullanıcı adı: ${slip.username}`, `Parola: ${slip.password}`, `Tohum: ${slip.words.join(" ")}`].join("\n");
}

export function RegisterForm() {
  const { lang } = useChrome();
  const [state, action, pending] = useActionState(registerAction, { error: "" });
  const [slip, setSlip] = useState<SignupSlip | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setSlip(makeSignup());
  }, []);

  async function copySlip() {
    if (!slip) return;
    const text = slipText(slip);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
  }

  return (
    <form action={action} className="grid gap-3">
      {pending && (
        <div className="fixed inset-0 z-[80] bg-[#07060b]">
          <Boot />
        </div>
      )}
      <p className="text-sm text-[#5c6774]">
        Kullanıcı adı, 8 haneli parola ve tohum bir kez verilir. Kaydetmeden panele geçilmez. Hoş geldin bakiyesi {formatTL(WELCOME_BONUS_KURUS)}.
      </p>
      {slip ? (
        <article className="credential-card" id="kayit-kimlik">
          <p className="text-xs font-bold tracking-[0.16em] text-[#8b95a5]">BİR KEZ GÖSTERİLİR</p>
          <p className="mt-2 text-sm font-semibold text-[#1c2430]">Kullanıcı adı</p>
          <p className="font-mono text-lg font-bold text-[#1c2430]" data-signup-user>
            {slip.username}
          </p>
          <p className="mt-3 text-sm font-semibold text-[#1c2430]">Parola · 8 rakam</p>
          <p className="font-mono text-lg font-bold tracking-[0.18em] text-[#1c2430]" data-signup-pass>
            {slip.password}
          </p>
          <p className="mt-3 text-sm font-semibold text-[#1c2430]">Kurtarma tohumu</p>
          <ol className="seed-words" data-signup-seed={slip.words.join(" ")}>
            {slip.words.map((word, index) => (
              <li key={`${word}-${index}`} className="seed-word">
                <span>{index + 1}</span>
                {word}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-[#8b95a5]">Şifreni unutursan bu kelimeleri sırayla yazarak girersin. Panele girince bir daha gösterilmez.</p>
          <button className="auth-outline mt-3" type="button" onClick={() => void copySlip()}>
            {copied ? "Kopyalandı" : "Hepsini kopyala"}
          </button>
          <input type="hidden" name="kullanici" value={slip.username} />
          <input type="hidden" name="parola" value={slip.password} />
          <input type="hidden" name="tohum" value={slip.words.join(" ")} />
        </article>
      ) : (
        <p className="text-sm text-[#5c6774]">Kimlik hazırlanıyor.</p>
      )}
      <label className="flex items-start gap-2 text-sm text-[#1c2430]">
        <input
          id="signup-confirm"
          className="mt-1"
          type="checkbox"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
          required
          disabled={!slip}
        />
        <span>Kullanıcı adını, 8 haneli parolayı ve tohum kelimelerini kaydettim.</span>
      </label>
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="auth-primary mt-1" type="submit" disabled={pending || !slip || !saved}>
        {uiText(lang, "register")}
      </button>
      <Link href="/sifre" className="auth-outline">
        {uiText(lang, "forgot")}
      </Link>
    </form>
  );
}

export function SeedLoginForm() {
  const [state, action, pending] = useActionState(seedLoginAction, { error: "" });
  return (
    <form action={action} className="grid gap-3">
      {pending && (
        <div className="fixed inset-0 z-[80] bg-[#07060b]">
          <Boot />
        </div>
      )}
      <p className="text-sm text-[#5c6774]">Kayıttaki kullanıcı adını ve tohum kelimelerini yaz. Doğruysa panele girersin. 8 haneli parolan da durur.</p>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Kullanıcı adı
        <input className="auth-field" name="kullanici" autoComplete="username" placeholder="ornek_ad" required minLength={2} maxLength={24} />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-[#1c2430]">
        Tohum
        <textarea className="auth-field min-h-24" name="tohum" autoComplete="off" placeholder="kelimeleri aralarında boşlukla yaz" required />
        <span className="text-xs font-normal text-[#8b95a5]">Kayıtta gördüğün kelimeler. Sıra aynı olsun.</span>
      </label>
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="auth-primary mt-1" type="submit" disabled={pending}>
        Tohumla gir
      </button>
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
