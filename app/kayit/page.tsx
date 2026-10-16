"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RegisterForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { useChrome } from "@/components/chrome-controls";
import { deskPath } from "@/lib/auth";
import { siteText } from "@/lib/copy";
import { uiText } from "@/lib/ui";
import { Boot, useSiteSettings, useUser } from "@/lib/live";

export default function RegisterPage() {
  const user = useUser();
  const settings = useSiteSettings();
  const { lang } = useChrome();
  useEffect(() => {
    if (user) window.location.replace(`${deskPath(user.role)}/`);
  }, [user]);
  if (user) return <Boot />;
  return (
    <AuthShell title={siteText(settings, "signupTitle", lang)} lede={siteText(settings, "signupLede", lang)}>
      <RegisterForm />
      <Link href="/giris" className="auth-outline mt-3">
        {uiText(lang, "signInLong")}
      </Link>
    </AuthShell>
  );
}
