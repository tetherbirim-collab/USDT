"use client";

import { useChrome } from "@/components/chrome-controls";
import { Marketing } from "@/components/marketing";
import { deskPath } from "@/lib/auth";
import { useUser } from "@/lib/live";
import { uiText } from "@/lib/ui";

export default function HomePage() {
  const user = useUser();
  const { lang } = useChrome();
  const signedIn = Boolean(user);
  return (
    <Marketing
      loggedIn={signedIn}
      deskHref={user ? deskPath(user.role) : "/panel"}
      deskLabel={uiText(lang, user?.role === "yonetici" ? "goAdmin" : "goPanel")}
    />
  );
}
