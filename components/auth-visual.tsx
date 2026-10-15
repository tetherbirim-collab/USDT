"use client";

import { useEffect, useState } from "react";
import { copyFor, detectLang, type Lang } from "@/lib/locale";

const WAVES = Array.from({ length: 24 }, (_, index) => index);

export function AuthVisual() {
  const [lang, setLang] = useState<Lang>("tr");

  useEffect(() => {
    let gone = false;
    detectLang().then((next) => {
      if (!gone) setLang(next);
    });
    return () => {
      gone = true;
    };
  }, []);

  const copy = copyFor(lang);

  return (
    <div className="glass-scene">
      <div className="glass-grid" />
      <div className="glass-float">
        <article className="glass-face" lang={lang} dir={copy.dir}>
          <svg className="glass-waves" viewBox="0 0 320 460" aria-hidden>
            {WAVES.map((index) => (
              <path
                key={index}
                d={`M${168 + index * 5.2} 500 C ${188 + index * 3} ${300 - index * 2}, ${214 + index * 2} ${70 + index * 5}, 360 ${-40 + index * 9}`}
                fill="none"
                stroke="rgba(255,255,255,.78)"
                strokeWidth="1.15"
              />
            ))}
          </svg>
          <span className="glass-sheen" />
          <span className="glass-chip" />
          <div className="glass-copy">
            <p className="glass-brand">CLAY</p>
            <p className="glass-service">{copy.service}</p>
            <div className="glass-lines">
              {copy.lines.map((line) => (
                <p key={line} className="glass-line">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
