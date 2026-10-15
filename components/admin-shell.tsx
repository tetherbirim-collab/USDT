"use client";

import Link from "next/link";
import { useEffect } from "react";
import { logoutAction } from "@/lib/actions";
import { deskPath } from "@/lib/auth";
import { Boot, useUser } from "@/lib/live";
import { Mark, Wordmark } from "@/components/mark";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const user = useUser();
  useEffect(() => {
    if (user === null) window.location.replace("/giris/");
    if (user && user.role !== "yonetici") window.location.replace(`${deskPath(user.role)}/`);
  }, [user]);
  if (!user || user.role !== "yonetici") return <Boot />;
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-5">
      <header className="glass rounded-[28px] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Mark />
            <Wordmark />
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-gold px-3 py-2 font-bold text-[#24180a]">Yönetim masası</span>
            <span className="text-white/70">{user.username}</span>
            <form action={logoutAction}>
              <button className="btn btn-ghost px-3 py-2 text-sm">Çıkış</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}
