"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RegisterForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { RegisterStage } from "@/components/register-stage";
import { deskPath } from "@/lib/auth";
import { Boot, useUser } from "@/lib/live";

export default function RegisterPage() {
  const user = useUser();
  useEffect(() => {
    if (user) window.location.replace(`${deskPath(user.role)}/`);
  }, [user]);
  if (user) return <Boot />;
  return (
    <AuthShell
      title="Kayıt ol"
      lede="Kullanıcı adı ve parola yeter. Kartın adını oluştururken verirsin."
      visual={<RegisterStage />}
    >
      <RegisterForm />
      <Link href="/giris" className="auth-outline mt-3">
        Giriş yap
      </Link>
    </AuthShell>
  );
}
