"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/lib/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        Kullanıcı adı
        <input
          className="field"
          name="kullanici"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Parola
        <input
          className="field"
          name="parola"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="btn btn-gold" disabled={pending}>
        {pending ? "Giriliyor…" : "Giriş yap"}
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          setUsername("demo");
          setPassword("demo123");
        }}
      >
        Demo bilgilerini doldur
      </button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, { error: "" });
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        Kullanıcı adı
        <input className="field" name="kullanici" autoComplete="username" required minLength={2} maxLength={24} />
      </label>
      <label className="grid gap-1 text-sm">
        Parola
        <input
          className="field"
          name="parola"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          maxLength={72}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Parola tekrar
        <input
          className="field"
          name="parola2"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          maxLength={72}
        />
      </label>
      <p className="text-sm text-white/60">
        Yeni hesaba 1.500 ₺ hoş geldin bakiyesi yazılır. Bu tutar simülasyondur, tahsil edilmez.
      </p>
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="btn btn-gold" disabled={pending}>
        {pending ? "Açılıyor…" : "Hesabı aç"}
      </button>
    </form>
  );
}
