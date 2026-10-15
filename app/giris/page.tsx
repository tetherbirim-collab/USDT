"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-form";
import { Notice } from "@/components/notice";
import { deskPath } from "@/lib/auth";
import { Boot, useQuery, useUser } from "@/lib/live";

export default function LoginPage() {
  const user = useUser();
  const query = useQuery();
  useEffect(() => {
    if (user) window.location.replace(`${deskPath(user.role)}/`);
  }, [user]);
  if (user) return <Boot />;
  return (
    <AuthShell title="Hoş geldin" lede="CLAY hesabına gir veya yeni bir hesap aç.">
      <Notice code={query?.get("bildirim") || undefined} />
      <LoginForm />
      <Link href="/kayit" className="auth-outline mt-3">
        Kayıt ol
      </Link>
    </AuthShell>
  );
}
