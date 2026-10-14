import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-4 text-center">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">404</p>
        <h1 className="font-display mt-3 text-4xl font-extrabold">Bu sahne yok</h1>
        <p className="mt-3 text-white/70">Aradığın sayfa CLAY simülasyonunda durmuyor.</p>
        <Link href="/" className="btn btn-gold mt-6">
          Ana sahneye dön
        </Link>
      </div>
    </main>
  );
}
