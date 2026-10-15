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

function EntranceDeck() {
  return (
    <div className="entrance-deck">
      {CARD_TYPE_ORDER.map((id) => (
        <a key={id} className={`entrance-card entrance-${id}`} href="#turler">
          <EntranceWaves />
          <span className="entrance-sheen" aria-hidden />
          <span className="entrance-chip" aria-hidden />
          <span className="entrance-type">{CARD_TYPES[id].name}</span>
          <span className="entrance-copy">
            <span className="entrance-clay">CLAY</span>
            <span className="entrance-service">SANAL KART HİZMETLERİ</span>
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

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-10">
          <div className="entrance">
            <div className="hero-mark">
              <img className="hero-still" src="/clay-hero.png" alt="" width={420} height={420} />
              <img className="hero-motion" src="/clay-hero.gif" alt="CLAY Virtual Card, sanal kart hizmeti" width={420} height={420} />
            </div>
            <p className="hero-word" aria-hidden>
              CLAY
            </p>
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
