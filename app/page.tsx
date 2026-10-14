import { Marketing } from "@/components/marketing";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  return <Marketing loggedIn={Boolean(user)} />;
}
