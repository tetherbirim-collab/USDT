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
      title="Panele gir."
      lede="Simülasyon cüzdanın, kartların ve işlem dökümün burada durur. Gerçek bir oturum sağlayıcısı yoktur."
    >
      <Notice code={one(sp.bildirim)} />
      <LoginForm />
      <p className="mt-5 text-sm text-white/65">
        Hesabın yok mu? <Link href="/kayit" className="font-semibold text-gold">Hesap aç</Link>
      </p>
    </AuthShell>
  );
}
