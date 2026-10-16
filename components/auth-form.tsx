"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useChrome } from "@/components/chrome-controls";
import { loginAction, registerAction, resetPasswordAction, seedLoginAction } from "@/lib/actions";
import { uiText } from "@/lib/ui";
import { SECURITY_QUESTIONS } from "@/lib/catalog";
import { Boot } from "@/lib/live";
import { makeSeedWords } from "@/lib/secrets";

function QuestionFields() {
  return (
    <>
      <label className="auth-label">
        Güvenlik sorusu
        <select className="auth-field" name="soru" required defaultValue="hayvan">
          {SECURITY_QUESTIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="auth-label">
        Güvenlik yanıtı
        <input className="auth-field" name="cevap" autoComplete="off" placeholder="Yanıtını yaz" required minLength={2} maxLength={40} />
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
        <div className="theme-veil fixed inset-0 z-[80]">
          <Boot />
        </div>
      )}
      <label className="auth-label">
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
      <label className="auth-label">
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
  const [words, setWords] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setWords(makeSeedWords(12));
  }, []);

  async function copySeed() {
    if (words.length === 0) return;
    const text = [`Kullanıcı adı: ${username}`, `Parola: ${password}`, `Tohum: ${words.join(" ")}`].join("\n");
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

  const ready = words.length > 0;

  return (
    <form action={action} className="grid gap-3">
      {pending && (
        <div className="theme-veil fixed inset-0 z-[80]">
          <Boot />
        </div>
      )}
      <label className="auth-label">
        Kullanıcı adı
        <input
          className="auth-field"
          name="kullanici"
          autoComplete="username"
          placeholder="ornek_ad"
          required
          minLength={2}
          maxLength={24}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>
      <label className="auth-label">
        Parola
        <input
          className="auth-field"
          name="parola"
          type="password"
          autoComplete="new-password"
          placeholder="En az 6 karakter, harf ve rakam"
          required
          minLength={6}
          maxLength={72}
          pattern="[A-Za-z0-9]{6,72}"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label className="auth-label">
        Parolayı yeniden yaz
        <input
          className="auth-field"
          name="parola2"
          type="password"
          autoComplete="new-password"
          placeholder="En az 6 karakter, harf ve rakam"
          required
          minLength={6}
          maxLength={72}
          pattern="[A-Za-z0-9]{6,72}"
        />
      </label>
      <div className="seed-block">
        <p className="auth-label">Tohum</p>
        {ready ? (
          <ol className="seed-words" data-signup-seed={words.join(" ")}>
            {words.map((word, index) => (
              <li key={`${word}-${index}`} className="seed-word">
                <span>{index + 1}</span>
                {word}
              </li>
            ))}
          </ol>
        ) : (
          <p className="auth-hint">Tohum hazırlanıyor.</p>
        )}
        <button className="auth-outline mt-3" type="button" onClick={() => void copySeed()} disabled={!ready}>
          {copied ? "Kopyalandı" : "Tohumu kopyala"}
        </button>
        {ready && <input type="hidden" name="tohum" value={words.join(" ")} />}
      </div>
      <label className="auth-check">
        <input
          id="signup-confirm"
          type="checkbox"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
          required
          disabled={!ready}
        />
        <span>Tohumu kaydettim.</span>
      </label>
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="auth-primary mt-1" type="submit" disabled={pending || !ready || !saved}>
        {uiText(lang, "register")}
      </button>
    </form>
  );
}

export function SeedLoginForm() {
  const [state, action, pending] = useActionState(seedLoginAction, { error: "" });
  const [username, setUsername] = useState("");
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    if (state.legacy) setLegacy(true);
  }, [state.legacy]);

  return (
    <>
      <form action={action} className="grid gap-3">
        {pending && (
          <div className="theme-veil fixed inset-0 z-[80]">
            <Boot />
          </div>
        )}
        <label className="auth-label">
          Kullanıcı adı
          <input
            className="auth-field"
            name="kullanici"
            autoComplete="username"
            placeholder="ornek_ad"
            required
            minLength={2}
            maxLength={24}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label className="auth-label">
          Tohum
          <textarea className="auth-field min-h-24" name="tohum" autoComplete="off" placeholder="kelimeleri aralarında boşlukla yaz" required />
        </label>
        {state.error && <p className="banner-bad">{state.error}</p>}
        <button className="auth-primary mt-1" type="submit" disabled={pending}>
          Tohumla gir
        </button>
      </form>
      {legacy ? (
        <div className="mt-8">
          <ResetForm username={username.trim()} />
        </div>
      ) : (
        <button className="auth-outline mt-3" type="button" onClick={() => setLegacy(true)}>
          Tohumu olmayan eski hesap
        </button>
      )}
    </>
  );
}

export function ResetForm({ username = "" }: { username?: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, { error: "" });
  return (
    <form action={action} className="grid gap-3">
      {pending && (
        <div className="theme-veil fixed inset-0 z-[80]">
          <Boot />
        </div>
      )}
      <p className="auth-hint">Bu hesapta tohum yok. Soruyu, yanıtı ve yeni parolayı yaz.</p>
      <label className="auth-label">
        Kullanıcı adı
        <input className="auth-field" name="kullanici" autoComplete="username" placeholder="ornek_ad" required minLength={2} maxLength={24} defaultValue={username} />
      </label>
      <QuestionFields />
      <label className="auth-label">
        Yeni parola
        <input className="auth-field" name="parola" type="password" autoComplete="new-password" placeholder="En az 6 karakter, harf ve rakam" required minLength={6} maxLength={72} pattern="[A-Za-z0-9]{6,72}" />
      </label>
      <label className="auth-label">
        Yeni parolayı yeniden yaz
        <input className="auth-field" name="parola2" type="password" autoComplete="new-password" placeholder="En az 6 karakter, harf ve rakam" required minLength={6} maxLength={72} pattern="[A-Za-z0-9]{6,72}" />
      </label>
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="auth-primary mt-1" type="submit" disabled={pending}>
        Yeni parolayı kaydet
      </button>
    </form>
  );
}

