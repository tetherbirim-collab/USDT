import { Marketing } from "@/components/marketing";
import { deskPath, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <Marketing
      loggedIn={Boolean(user)}
      deskHref={user ? deskPath(user.role) : "/panel"}
      deskLabel={user?.role === "yonetici" ? "Yönetime git" : "Panele git"}
    />
  );
}
