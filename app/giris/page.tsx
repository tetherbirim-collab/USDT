import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Giriş" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/panel");
  return (
    <AuthShell
      title="Panele gir."
      lede="Simülasyon cüzdanın, kartların ve işlem dökümün burada durur. Gerçek bir oturum sağlayıcısı yoktur."
    >
      <LoginForm />
      <p className="mt-5 text-sm text-white/65">
        Hesabın yok mu? <Link href="/kayit" className="font-semibold text-gold">Hesap aç</Link>
      </p>
    </AuthShell>
  );
}
