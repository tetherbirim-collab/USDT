"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SeedLoginForm } from "@/components/auth-form";
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
    <AuthShell title="Tohumla gir" lede="Kullanıcı adını ve tohumu yaz. Doğruysa panele girersin.">
      <SeedLoginForm />
      <Link href="/giris" className="auth-outline mt-3">
        Giriş yap
      </Link>
      <Link href="/kayit" className="auth-outline mt-3">
        Kayıt ol
      </Link>
    </AuthShell>
  );
}
