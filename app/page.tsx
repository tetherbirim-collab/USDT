"use client";

import { Marketing } from "@/components/marketing";
import { deskPath } from "@/lib/auth";
import { useUser } from "@/lib/live";

export default function HomePage() {
  const user = useUser();
  const signedIn = Boolean(user);
  return (
    <Marketing
      loggedIn={signedIn}
      deskHref={user ? deskPath(user.role) : "/panel"}
      deskLabel={user?.role === "yonetici" ? "Yönetime git" : "Panele git"}
    />
  );
}
