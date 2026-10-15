import Link from "next/link";
import { CARD_TYPES, CARD_TYPE_ORDER } from "@/lib/catalog";
import { PlanGrid } from "./plan-grid";
import { formatTL } from "@/lib/format";
import { makeCvv, makePan } from "@/lib/pan";
import type { CardTypeId } from "@/lib/types";
import { Mark, Wordmark } from "./mark";
import { TiltCard } from "./tilt-card";
import { VirtualCard } from "./virtual-card";

const LAUNCH: { type: CardTypeId; phrase: string }[] = [
  { type: "facebook_ads", phrase: "KYC GEREKMEZ" },
  { type: "tiktok", phrase: "ANONİM SANAL KART" },
  { type: "google_ads", phrase: "OLUŞTUR VE HEMEN HARCA" },
  { type: "ultima", phrase: "CLAY SANAL KART" },
];

function LaunchUnit() {
  return (
    <div className="launch-unit">
      {LAUNCH.map((beat) => (
        <span key={beat.type} className="launch-beat">
          <span className={`launch-card launch-card-${beat.type}`} aria-hidden>
            <span className="launch-chip" />
            <span className="launch-brand">{CARD_TYPES[beat.type].name}</span>
          </span>
          <span className="launch-phrase">{beat.phrase}</span>
        </span>
      ))}
    </div>
  );
}

function LaunchRail() {
  return (
    <div className="launchpad" aria-label="KYC gerekmez. Anonim sanal kart oluştur ve hemen harca.">
      <div className="launch-track">
        <LaunchUnit />
        <LaunchUnit />
      </div>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Hesap aç",
    text: "Kullanıcı adı ve parola yeter. Kimlik belgesi istenmez.",
  },
  {
    n: "02",
    title: "Bakiye yükle",
    text: "Tutarı dolar olarak girersin. Heleket ödemesi onaylanınca bakiyede sabit kurun TL karşılığı durur.",
  },
  {
    n: "03",
    title: "Kart bas",
    text: "Karta isim ver, kullanılabilir bakiyeyi seç, sonra o türün BIN listesinden bir satır işaretle.",
  },
  {
    n: "04",
    title: "İzle ve dondur",
    text: "Harcama limite işlenir. İstediğin an dondur veya kapat.",
  },
];

const FAQ = [
  {
    q: "Kart nasıl oluşur?",
    a: "Türü, adı ve kullanılabilir bakiyeyi seçersin. Üzerindeki ad, verdiğin addır.",
  },
  {
    q: "Bakiye nasıl durur?",
    a: "Tutar dolar olarak girilir. Ekranda yalnız sabit kurun TL karşılığı görünür.",
  },
  {
    q: "Numara ne zaman görünür?",
    a: "Satın almadan önce BIN kalır, kalan haneler X olur. Kart oluşunca 16 hane yazılır. CVV’yi sen açarsın.",
  },
];

export function Marketing({
  loggedIn,
  deskHref = "/panel",
  deskLabel = "Panele git",
}: {
  loggedIn: boolean;
  deskHref?: string;
  deskLabel?: string;
}) {
  const sample = {
    type: "facebook_ads" as const,
    label: "Kampanya",
    holder: "CLAY",
    pan: makePan(100_000_042),
    expiry: "12/29",
    cvv: makeCvv(100_000_042),
    status: "aktif" as const,
  };

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07060bcc] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Mark />
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-white/75 md:flex">
            <a href="#turler">Türler</a>
            <a href="#nasil">Nasıl işler</a>
            <a href="#fiyat">Vitrin</a>
            <a href="#sorular">Sorular</a>
          </nav>
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <Link href={deskHref} className="btn btn-gold">
                {deskLabel}
              </Link>
            ) : (
              <>
                <Link href="/giris" className="btn btn-ghost px-3 py-2 text-sm">
                  Giriş
                </Link>
                <Link href="/kayit" className="btn btn-gold px-3 py-2 text-sm">
                  Hesap aç
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <LaunchRail />

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-10">
          <div className="hero-mark">
            <img className="hero-still" src="/clay-hero.png" alt="" width={420} height={420} />
            <img className="hero-motion" src="/clay-hero.gif" alt="CLAY Virtual Card, sanal kart hizmeti" width={420} height={420} />
          </div>
          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="text-sm font-bold tracking-[0.28em] text-gold">CLAY VIRTUAL CARD</p>
            <h1 className="font-display mt-3 text-4xl font-extrabold leading-[1.05] sm:text-6xl">SANAL KART HİZMETİ</h1>
            <p className="mt-5 text-lg text-white/75">
              Facebook Ads, TikTok, Google Ads ve Ultima kartlarını aynı cüzdanda tut. CLAY
              kartı basar, kullanılabilir bakiyeyi yazar, dondurur ve işlem dökümünü tutar. Bakiye, doların sabit kur karşılığıdır.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={loggedIn ? deskHref : "/kayit"} className="btn btn-gold">
                {loggedIn ? deskLabel : "Hesap aç"}
              </Link>
              <Link href="/giris" className="btn btn-ghost">
                Giriş yap
              </Link>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-3 text-left text-sm">
              {[
                ["49,3929", "sabit kur"],
                [String(CARD_TYPE_ORDER.length), "kart türü"],
                ["30 USD", "hoş geldin"],
              ].map(([value, label]) => (
                <div key={label} className="glass rounded-2xl px-3 py-3">
                  <dt className="font-display text-xl font-bold text-gold">{value}</dt>
                  <dd className="text-white/60">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mx-auto mt-12 w-full max-w-[340px]">
            <TiltCard>
              <VirtualCard card={sample} />
            </TiltCard>
          </div>
        </section>

        <section id="turler" className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-mint">TÜRLER</p>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Ayrı sahneler</h2>
            <p className="mt-3 text-white/70">
              Her kart 300₺. Karta ayırdığın tutardan %7,3 kesilir. Tutar dolar cinsindendir, ekranda TL karşılığı durur.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {CARD_TYPE_ORDER.map((id, index) => (
              <article key={id} className="glass rounded-[24px] p-4">
                <VirtualCard
                  size="sm"
                  card={{
                    type: id,
                    label: CARD_TYPES[id].pitch,
                    holder: "CLAY",
                    pan: makePan(100_000_200 + index),
                    expiry: "12/29",
                    cvv: makeCvv(100_000_200 + index),
                    status: "aktif",
                  }}
                />
                <p className="mt-3 text-sm text-white/75">{CARD_TYPES[id].scene}</p>
                <p className="mt-3 text-sm font-semibold">Basım {formatTL(CARD_TYPES[id].fee)}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="nasil" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Dört adım</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n} className="glass rounded-[24px] p-5">
                <p className="font-display text-3xl font-extrabold text-gold">{step.n}</p>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-white/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="fiyat" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-gold">VİTRİN</p>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Planlar</h2>
          </div>
          <PlanGrid />
        </section>

        <section id="sorular" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">Merak edilenler</h2>
          <div className="mt-6 grid gap-3">
            {FAQ.map((item) => (
              <details key={item.q} className="glass rounded-2xl p-4">
                <summary className="cursor-pointer font-semibold">{item.q}</summary>
                <p className="mt-3 text-sm text-white/75">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Mark className="h-9 w-9" />
            <Wordmark />
          </div>
          <p className="max-w-xl text-sm text-white/55">
            CLAY Sanal Kart Hizmetleri. Bakiye, doların sabit kur karşılığıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
