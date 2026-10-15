"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/lib/actions";
import { Boot } from "@/lib/live";

export function LoginForm() {
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
      <input
        className="auth-field"
        name="kullanici"
        autoComplete="username"
        placeholder="Kullanıcı adı"
        required
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <input
        className="auth-field"
        name="parola"
        type="password"
        autoComplete="current-password"
        placeholder="Parola"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="auth-primary mt-2" disabled={pending}>
        Giriş yap
      </button>
      <button
        type="button"
        className="text-sm font-semibold text-[#2f78ff]"
        onClick={() => {
          setUsername("demo");
          setPassword("demo123");
        }}
      >
        Hazır hesabı doldur
      </button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, { error: "" });
  return (
    <form action={action} className="grid gap-3">
      {pending && (
        <div className="fixed inset-0 z-[80] bg-[#07060b]">
          <Boot />
        </div>
      )}
      <input className="auth-field" name="kullanici" autoComplete="username" placeholder="Kullanıcı adı" required minLength={2} maxLength={24} />
      <input
        className="auth-field"
        name="parola"
        type="password"
        autoComplete="new-password"
        placeholder="Parola"
        required
        minLength={6}
        maxLength={72}
      />
      <p className="text-sm text-[#8b95a5]">
        Yeni hesaba 1.500 ₺ hoş geldin bakiyesi yazılır. Bu tutar simülasyondur, tahsil edilmez.
      </p>
      {state.error && <p className="banner-bad">{state.error}</p>}
      <button className="auth-primary mt-1" disabled={pending}>
        Kayıt ol
      </button>
    </form>
  );
}
