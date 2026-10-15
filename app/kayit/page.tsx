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
      title="Kayıt ol"
      lede="Görünen ad kartın üzerine yazılır. Kimlik belgesi yok."
    >
      <RegisterForm />
      <Link href="/giris" className="auth-outline mt-3">
        Giriş yap
      </Link>
    </AuthShell>
  );
}
