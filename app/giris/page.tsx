import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-form";
import { Notice } from "@/components/notice";
import { deskPath, getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Giriş" };
export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(deskPath(user.role));
  const sp = await searchParams;
  return (
    <AuthShell
      title="Hoş geldin"
      lede="CLAY hesabına gir veya yeni bir hesap aç."
    >
      <Notice code={one(sp.bildirim)} />
      <LoginForm />
      <Link href="/kayit" className="auth-outline mt-3">
        Kayıt ol
      </Link>
    </AuthShell>
  );
}
