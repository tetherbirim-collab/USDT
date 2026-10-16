"use client";

import Link from "next/link";
import { useChrome } from "@/components/chrome-controls";
import { AuthVisual } from "./auth-visual";
import { Mark, Wordmark } from "./mark";

export function AuthShell({
  title,
  lede,
  children,
  visual,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
  visual?: React.ReactNode;
}) {
  const { theme } = useChrome();
  return (
    <main className="auth-stage">
      <div className="auth-card">
        {visual ?? <AuthVisual />}
        <section className="auth-pane">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
            <Link href="/" className="inline-flex items-center gap-3">
              <Mark />
              <Wordmark tone={theme === "light" ? "light" : "dark"} />
            </Link>
            <div className="flex flex-1 flex-col justify-center py-6">
              <h1 className="auth-title">{title}</h1>
              {lede ? <p className="auth-lede">{lede}</p> : null}
              <div className="mt-6">{children}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
