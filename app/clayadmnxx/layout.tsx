import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";

export const metadata: Metadata = { title: "Yönetim" };

export default function SecretAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
