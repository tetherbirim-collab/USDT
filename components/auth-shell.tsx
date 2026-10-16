import Link from "next/link";
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
  return (
    <main className="min-h-screen bg-[#eef3f9] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl rounded-[28px] bg-white shadow-[0_20px_60px_rgba(20,40,80,.08)] lg:h-[calc(100vh-2rem)] lg:grid-cols-2 lg:overflow-hidden">
        {visual ?? <AuthVisual />}
        <section className="flex min-h-0 flex-col overflow-y-auto px-6 py-8 sm:px-12 sm:py-10">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
            <Link href="/" className="inline-flex items-center gap-3">
              <Mark />
              <Wordmark tone="light" />
            </Link>
            <div className="flex flex-1 flex-col justify-center py-6">
              <h1 className="font-display text-4xl font-extrabold text-[#1c2430]">{title}</h1>
              <p className="mt-2 text-sm text-[#8b95a5]">{lede}</p>
              <div className="mt-6">{children}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
