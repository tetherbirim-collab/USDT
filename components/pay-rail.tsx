"use client";

import { useLayoutEffect, useRef } from "react";
import { CARD_TYPES } from "@/lib/catalog";
import type { CardFace, CardTypeId } from "@/lib/types";
import { VirtualCard } from "./virtual-card";

const SLIDES: { type: CardTypeId; label: string; caption: string; tail: string; bin: string }[] = [
  { type: "tiktok", label: "Nota akışı", caption: "Nota akış kartı", tail: "6184", bin: "537872" },
  { type: "google_ads", label: "Kelime vitrini", caption: "Kelime vitrin kartı", tail: "8033", bin: "537872" },
  { type: "ultima", label: "Gece salonu", caption: "Gece salon kartı", tail: "9166", bin: "537872" },
  { type: "facebook_ads", label: "Akış kartı", caption: "Akış reklam kartı", tail: "1842", bin: "537872" },
  { type: "tiktok", label: "Kısa video", caption: "Kısa video kartı", tail: "2907", bin: "537872" },
  { type: "google_ads", label: "Arama kartı", caption: "Arama reklam kartı", tail: "4418", bin: "537872" },
  { type: "ultima", label: "Metal kart", caption: "Metal salon kartı", tail: "7731", bin: "537872" },
  { type: "facebook_ads", label: "Kampanya", caption: "Kampanya kartı", tail: "5520", bin: "537872" },
];

const CODE = [
  "function issue(bytes32 kind, uint256 limit) {",
  '    require(limit > 0, "LIMIT");',
  "    Card storage row = desk[id];",
  "    row.kind = kind;",
  '    row.holder = "CLAY";',
  "    row.limit = limit;",
  "    emit Issued(id, kind);",
  "    return id;",
  "}",
  "function fund(uint256 usd) {",
  '    require(usd > 0, "ZERO");',
  "    balance += quote(usd);",
  "    emit Funded(usd, balance);",
  "}",
  "function mask(bytes16 pan) view returns (string) {",
  '    return "•••• •••• ••••";',
  "}",
];

function face(slide: (typeof SLIDES)[number]): CardFace {
  return {
    type: slide.type,
    label: slide.label,
    holder: "CLAY",
    pan: `${slide.bin}0000000000`.slice(0, 16),
    panLine: `•••• •••• •••• ${slide.tail}`,
    bin: slide.bin,
    expiry: "09/29",
    cvv: "•••",
    status: "aktif",
    hideCvv: true,
  };
}

function codeBlock(index: number): string {
  const lines: string[] = [];
  for (let row = 0; row < 28; row += 1) lines.push(CODE[(index + row) % CODE.length]);
  return `${lines.join("\n")}\n${lines.join("\n")}`;
}

function Mark({ kind }: { kind: "usdt" | "btc" | "xmr" | "eth" | "ltc" }) {
  if (kind === "usdt") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="#26a17b" />
        <path d="M9 8.5h14v2.2h-5.2V23h-3.6V10.7H9V8.5z" fill="#fff" />
        <path d="M8.2 12.2h15.6v1.7H8.2z" fill="#fff" />
      </svg>
    );
  }
  if (kind === "btc") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="#f7931a" />
        <path
          d="M14.2 7.2h2.1v2.1h1.2c2.3 0 3.8 1.2 3.8 3.2 0 1.3-.6 2.3-1.7 2.8 1.4.4 2.2 1.6 2.2 3.2 0 2.3-1.7 3.7-4.4 3.7h-1.1v2.1h-2.1v-2.1H12v-2h1.1V11.3H12V9.3h2.2V7.2zm2.1 4.1v3.4h1.5c1 0 1.6-.5 1.6-1.4s-.6-1.4-1.6-1.4h-1.5zm0 5.2v3.8h1.8c1.1 0 1.8-.6 1.8-1.7s-.7-1.6-1.8-1.6h-1.8z"
          fill="#fff"
        />
      </svg>
    );
  }
  if (kind === "xmr") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="#f26822" />
        <path d="M8 21.5V11.2l4 5.2 4-5.2 4 5.2 4-5.2v10.3h-3.1v-5.2l-4.9 6.2-4.9-6.2v5.2H8z" fill="#fff" />
      </svg>
    );
  }
  if (kind === "eth") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="#627eea" />
        <path d="M16 6.5 15.7 7.5v12.2l.3.3 6.2-3.6L16 6.5z" fill="#fff" opacity=".85" />
        <path d="M16 6.5 9.8 16.4 16 20v-13.5z" fill="#fff" />
        <path d="M16 21.4 15.8 21.6v3.6l.2.6 6.2-8.7L16 21.4z" fill="#fff" opacity=".85" />
        <path d="M16 25.8v-4.4l-6.2-3.7L16 25.8z" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#345d9d" />
      <path d="M12.2 9.2h7.4l-3.1 8.2h3.4L13.4 24l1.6-6.2H12l.2-8.6z" fill="#fff" />
    </svg>
  );
}

const LOGOS = [
  ["usdt", "USDT"],
  ["btc", "BTC"],
  ["xmr", "XMR"],
  ["eth", "ETH"],
  ["ltc", "LTC"],
] as const;

function MarqueeSet({ copy }: { copy: "a" | "b" }) {
  return (
    <ul className="clay-marquee-set" aria-hidden={copy === "b" ? true : undefined}>
      {SLIDES.map((slide, index) => (
        <li key={`${copy}-${slide.type}-${slide.tail}`} className="clay-marquee-item">
          <div className="code-card">
            <div className="code-card-ascii" aria-hidden>
              <pre>{codeBlock(index + (copy === "b" ? 3 : 0))}</pre>
            </div>
            <div className="code-card-face">
              <VirtualCard card={face(slide)} />
            </div>
          </div>
          <p className="clay-marquee-caption">
            <span>{CARD_TYPES[slide.type].name}</span>
            <span>{slide.caption}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export function PayRail() {
  const stageRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const line = lineRef.current;
    if (!stage || !line) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let frame = 0;
    let last = performance.now();
    let pos = 0;
    let paused = false;
    const speed = 72;

    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
    };
    stage.addEventListener("pointerenter", onEnter);
    stage.addEventListener("pointerleave", onLeave);

    const tick = (now: number) => {
      const set = line.querySelector<HTMLElement>(".clay-marquee-set");
      const loop = set?.offsetWidth ?? 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused && loop > 0) {
        pos += speed * dt;
        if (pos >= loop) pos -= loop;
        line.style.transform = `translate3d(${pos - loop}px,0,0)`;
      }
      const box = stage.getBoundingClientRect();
      const midL = box.left + box.width / 2;
      line.querySelectorAll<HTMLElement>(".code-card").forEach((card) => {
        const ascii = card.querySelector<HTMLElement>(".code-card-ascii");
        if (!ascii) return;
        const rect = card.getBoundingClientRect();
        if (rect.width < 1) return;
        const clip = Math.max(0, Math.min(1, (midL - rect.left) / rect.width));
        ascii.style.setProperty("--clip-left", `${(clip * 100).toFixed(2)}%`);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointerenter", onEnter);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="pay-rail" aria-label="CLAY sanal kartlar. Facebook Ads, TikTok, Google Ads ve Ultima kayar.">
      <div className="pay-rail-stage" ref={stageRef}>
        <div className="pay-rail-scan" aria-hidden />
        <div className="clay-marquee-track" ref={lineRef}>
          <MarqueeSet copy="a" />
          <MarqueeSet copy="b" />
        </div>
      </div>
      <div className="pay-rail-foot">
        <p className="pay-rail-line">CLAY Sanal Kart Hizmetleri</p>
        <ul className="pay-logos">
          {LOGOS.map(([kind, label]) => (
            <li key={kind}>
              <Mark kind={kind} />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
