import Link from "next/link";
import { AuthVisual } from "./auth-visual";

export function AuthShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#eef3f9] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(20,40,80,.08)] lg:grid-cols-2">
        <AuthVisual />
        <section className="flex flex-col px-6 py-8 sm:px-12 sm:py-10">
          <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#1c2430]">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f1ff] text-[#2f78ff]" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <rect x="3" y="6" width="18" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            clay virtual card
          </Link>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
            <h1 className="font-display text-4xl font-extrabold text-[#1c2430]">{title}</h1>
            <p className="mt-2 text-sm text-[#8b95a5]">{lede}</p>
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
