"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ResetForm } from "@/components/auth-form";
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
    <AuthShell title="Şifremi unuttum" lede="Kullanıcı adın ve güvenlik yanıtın doğruysa yeni parola belirlersin.">
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
