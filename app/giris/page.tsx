"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-form";
import { useChrome } from "@/components/chrome-controls";
import { Notice } from "@/components/notice";
import { deskPath } from "@/lib/auth";
import { siteText } from "@/lib/copy";
import { uiText } from "@/lib/ui";
import { Boot, useQuery, useSiteSettings, useUser } from "@/lib/live";

export default function LoginPage() {
  const user = useUser();
  const query = useQuery();
  const settings = useSiteSettings();
  const { lang } = useChrome();
  useEffect(() => {
    if (user) window.location.replace(`${deskPath(user.role)}/`);
  }, [user]);
  if (user) return <Boot />;
  return (
    <AuthShell title={siteText(settings, "loginTitle", lang)} lede={siteText(settings, "loginLede", lang)}>
      <Notice code={query?.get("bildirim") || undefined} />
      <LoginForm />
      <Link href="/kayit" className="auth-outline mt-3">
        {uiText(lang, "register")}
      </Link>
    </AuthShell>
  );
}
