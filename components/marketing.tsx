"use client";

import Link from "next/link";
import { CARD_TYPES, CARD_TYPE_ORDER } from "@/lib/catalog";
import { siteText, type CopyKey } from "@/lib/copy";
import { useSiteSettings } from "@/lib/live";
import { AnnounceBar } from "./announce-bar";
import { PlanGrid } from "./plan-grid";
import { TrustLine } from "./trust-line";
import { formatTL } from "@/lib/format";
import { makeCvv, makePan } from "@/lib/pan";
import type { CardTypeId } from "@/lib/types";
import { CoinYard } from "./coin-yard";
import { Mark, Wordmark } from "./mark";
import { TiltCard } from "./tilt-card";
import { VirtualCard } from "./virtual-card";

const LAUNCH: { type: CardTypeId; phrase: CopyKey }[] = [
  { type: "facebook_ads", phrase: "phraseFacebook" },
  { type: "tiktok", phrase: "phraseTiktok" },
  { type: "google_ads", phrase: "phraseGoogle" },
  { type: "ultima", phrase: "phraseUltima" },
];

function LaunchUnit() {
  const settings = useSiteSettings();
  return (
    <div className="launch-unit">
      {LAUNCH.map((beat) => (
        <span key={beat.type} className="launch-beat">
          <span className={`launch-card launch-card-${beat.type}`} aria-hidden>
            <span className="launch-chip" />
            <span className="launch-line">Clay Virtual Card</span>
            <span className="launch-brand">{CARD_TYPES[beat.type].name}</span>
          </span>
          <span className="launch-phrase">{siteText(settings, beat.phrase)}</span>
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

function EntranceWaves() {
  return (
    <svg className="entrance-waves" viewBox="0 0 240 150" aria-hidden>
      {Array.from({ length: 16 }, (_, index) => (
        <path
          key={index}
          d={`M${128 + index * 5.4} 170 C ${146 + index * 3} 96, ${168 + index * 2} 28, 270 ${-16 + index * 7}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
        />
      ))}
    </svg>
  );
}

function BrandGlyph({ type }: { type: CardTypeId }) {
  if (type === "facebook_ads") {
    return (
      <svg className="entrance-glyph" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="12" fill="#fff" />
        <path fill="#1877F2" d="M13.4 18.4v-4.3h1.5l.2-1.7h-1.7V11c0-.5.1-.8.9-.8h1V8.6c-.2 0-.8 0-1.4-.1-1.4 0-2.3.8-2.3 2.4v1.5H9.8v1.7h1.8v4.3h1.8z" />
      </svg>
    );
  }
  if (type === "tiktok") {
    const note = "M13.1 6.2h1.6c.2 1.1 1 1.9 2 2.2v1.7c-.8 0-1.5-.3-2-.7v4c0 1.7-1.3 3-3.1 3S8.5 15.1 8.5 13.4s1.4-3 3.1-3c.2 0 .4 0 .6.1v1.8c-.2-.1-.4-.2-.6-.2-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4 1.4-.6 1.4-1.4V6.2z";
    return (
      <svg className="entrance-glyph" viewBox="0 0 24 24" aria-hidden>
        <rect width="24" height="24" rx="7" fill="#111" />
        <path d={note} fill="#25F4EE" transform="translate(-0.7 0.5)" />
        <path d={note} fill="#FE2C55" transform="translate(0.7 -0.5)" />
        <path d={note} fill="#fff" />
      </svg>
    );
  }
  if (type === "google_ads") {
    return (
      <svg className="entrance-glyph" viewBox="0 0 24 24" aria-hidden>
        <rect width="24" height="24" rx="7" fill="#fff" />
        <circle cx="8.2" cy="8.2" r="2.5" fill="#4285F4" />
        <circle cx="15.8" cy="8.2" r="2.5" fill="#EA4335" />
        <circle cx="8.2" cy="15.8" r="2.5" fill="#FBBC05" />
        <circle cx="15.8" cy="15.8" r="2.5" fill="#34A853" />
      </svg>
    );
  }
  return (
    <svg className="entrance-glyph" viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="7" fill="#1a140c" />
      <path d="M12 4.2 19.2 9.2 17 19H7L4.8 9.2 12 4.2z" fill="#e0b15a" />
      <path d="M12 4.2 19.2 9.2 12 11 4.8 9.2z" fill="#fff1cc" />
    </svg>
  );
}

function EntranceDeck() {
  return (
    <div className="entrance-deck">
      {CARD_TYPE_ORDER.map((id) => (
        <a key={id} className={`entrance-card entrance-${id}`} href="#turler" aria-label={`${CARD_TYPES[id].name} Clay Virtual Card`}>
          <EntranceWaves />
          <span className="entrance-sheen" aria-hidden />
          <span className="entrance-beam" aria-hidden />
          <span className="entrance-beam entrance-beam-hot" aria-hidden />
          <span className="entrance-chip" aria-hidden />
          <span className="entrance-brand">
            <BrandGlyph type={id} />
            <span className="entrance-type">{CARD_TYPES[id].name}</span>
          </span>
          <span className="entrance-copy">
            <span className="entrance-clay">Clay Virtual Card</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export function Marketing({
  loggedIn,
  deskHref = "/panel",
  deskLabel = "Panele git",
}: {
  loggedIn: boolean;
  deskHref?: string;
  deskLabel?: string;
}) {
  const settings = useSiteSettings();
  const line = (key: Parameters<typeof siteText>[1]) => siteText(settings, key);
  const steps = [
    { n: "01", title: line("step1Title"), text: line("step1Text") },
    { n: "02", title: line("step2Title"), text: line("step2Text") },
    { n: "03", title: line("step3Title"), text: line("step3Text") },
    { n: "04", title: line("step4Title"), text: line("step4Text") },
  ];
  const faq = [
    { q: line("faq1q"), a: line("faq1a") },
    { q: line("faq2q"), a: line("faq2a") },
    { q: line("faq3q"), a: line("faq3a") },
  ];
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
      <header className="site-bar sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Mark />
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-white/75 md:flex" aria-label="Sayfa">
            <a href="#yetenek">Atölye</a>
            <a href="#turler">{line("navTypes")}</a>
            <a href="#nasil">{line("navHow")}</a>
            <a href="#fiyat">{line("navPlans")}</a>
            <a href="#sorular">{line("navFaq")}</a>
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
        <TrustLine className="trust-bar" />
      </header>
      <AnnounceBar />

      <LaunchRail />
      <CoinYard />

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-10">
          <div className="entrance">
            <div className="hero-mark">
              <img className="hero-still" src="/clay-hero.png" alt="" width={420} height={420} />
              <img className="hero-motion" src="/clay-hero.gif" alt="CLAY Virtual Card, sanal kart hizmeti" width={420} height={420} />
              <p className="hero-word" aria-hidden>
                CLAY
              </p>
            </div>
            <EntranceDeck />
          </div>
          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="eyebrow">{line("heroKicker")}</p>
            <h1 className="font-display mt-3 text-4xl font-extrabold leading-[1.05] sm:text-6xl">{line("heroTitle")}</h1>
            <p className="mt-5 text-lg text-white/75">{line("heroLede")}</p>
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
            <p className="eyebrow">{line("typesKicker")}</p>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">{line("typesTitle")}</h2>
            <p className="mt-3 text-white/70">{line("typesLede")}</p>
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

        <section id="yetenek" className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow">ATÖLYE</p>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Reklam masasının tamamı</h2>
            <p className="mt-3 text-white/70">Kart bas, yatır, çek, dondur, kapat, aktar. Hepsi bu stüdyoda, kendi yüzüyle.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Kart bas", "Facebook, TikTok, Google ve Ultima. BIN seç, bedeli öde, kart açılsın."],
              ["02", "Yatır", "Cüzdana crypto ile yükle. Komisyon yok. Kur sabit."],
              ["03", "Çek", "Adres yaz, tutar beklemeye alınsın. Yönetim gönderince haberin gelir."],
              ["04", "Dondur", "Harcama dursun. Kart durur, bakiye durur."],
              ["05", "Kapat", "Kart kapanır. PST kartında komut hesaba da gider."],
              ["06", "Aktar", "Kullanılabilir bakiye karşı karta geçer. Ana cüzdan durur."],
              ["07", "Canlı takip", "Ekran kapansa da VPS yatırımı, çekimi ve kartı okur."],
              ["08", "Destek", "Talep aç. Yanıt zilde durur. Yönetim aynı masayı görür."],
            ].map(([n, title, text]) => (
              <article key={n} className="glass rounded-[24px] p-4">
                <p className="font-display text-2xl font-extrabold text-gold">{n}</p>
                <h3 className="mt-2 font-bold">{title}</h3>
                <p className="mt-2 text-sm text-white/70">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="nasil" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{line("stepsTitle")}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
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
            <p className="eyebrow">{line("plansKicker")}</p>
            <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">{line("plansTitle")}</h2>
          </div>
          <PlanGrid />
        </section>

        <section id="sorular" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">{line("faqTitle")}</h2>
          <div className="mt-6 grid gap-3">
            {faq.map((item) => (
              <details key={item.q} className="glass rounded-2xl p-4">
                <summary className="cursor-pointer font-semibold">{item.q}</summary>
                <p className="mt-3 text-sm text-white/75">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-[32px] px-6 py-8">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-gold">HAZIR</p>
              <h2 className="font-display mt-2 text-3xl font-extrabold">Reklamını bugün aç</h2>
              <p className="mt-2 max-w-xl text-white/70">Hesap aç, cüzdanı yükle, kartı bas. KYC yok. Aynı masa yönetimden de izlenir.</p>
            </div>
            <Link href={loggedIn ? deskHref : "/kayit"} className="btn btn-gold">
              {loggedIn ? deskLabel : "Hesap aç"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <TrustLine className="trust-foot" />
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Mark className="h-9 w-9" />
            <Wordmark />
          </div>
          <p className="max-w-xl text-sm text-white/55">{line("footerLine")}</p>
        </div>
      </footer>
    </div>
  );
}
