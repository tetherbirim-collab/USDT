import Link from "next/link";
import { Mark, Wordmark } from "./mark";

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
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <section>
        <Link href="/" className="inline-flex items-center gap-2">
          <Mark />
          <Wordmark />
        </Link>
        <p className="mt-8 text-xs font-bold tracking-[0.22em] text-gold">SİMÜLASYON GİRİŞİ</p>
        <h1 className="font-display mt-3 text-4xl font-extrabold">{title}</h1>
        <p className="mt-4 max-w-md text-white/70">{lede}</p>
        <p className="mt-6 max-w-md text-sm text-white/50">
          Demo hesap: kullanıcı adı demo, parola demo123. Yönetim: kullanıcı adı admin, parola admin123.
          İçerideki kartlar test verisidir ve gerçek üye işyerinde kullanılamaz.
        </p>
      </section>
      <section className="glass rounded-[28px] p-6 sm:p-8">{children}</section>
    </main>
  );
}
