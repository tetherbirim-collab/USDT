import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { deskPath, getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Hesap aç" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(deskPath(user.role));
  return (
    <AuthShell
      title="Prova hesabı aç."
      lede="Kıvılcım planında başlarsın. Kimlik yüklemesi yok, ödeme formu yok, kart basımı simülasyondur."
    >
      <RegisterForm />
      <p className="mt-5 text-sm text-white/65">
        Hesabın var mı? <Link href="/giris" className="font-semibold text-gold">Giriş yap</Link>
      </p>
    </AuthShell>
  );
}
