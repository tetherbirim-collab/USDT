"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ResetForm, SeedLoginForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { deskPath } from "@/lib/auth";
import { Boot, useUser } from "@/lib/live";

export default function ResetPage() {
  const user = useUser();
  useEffect(() => {
    if (user) window.location.replace(`${deskPath(user.role)}/`);
  }, [user]);
  if (user) return <Boot />;
  return (
    <AuthShell title="Şifremi unuttum" lede="Tohumun varsa kullanıcı adın ve kelimelerle girersin. Eski hesaplar güvenlik sorusuyla yeni parola belirler.">
      <SeedLoginForm />
      <h2 className="mb-3 mt-8 text-sm font-bold tracking-[0.14em] text-[#8b95a5]">ESKİ HESAP · GÜVENLİK SORUSU</h2>
      <ResetForm />
      <Link href="/giris" className="auth-outline mt-3">
        Giriş yap
      </Link>
      <Link href="/kayit" className="auth-outline mt-3">
        Kayıt ol
      </Link>
    </AuthShell>
  );
}
