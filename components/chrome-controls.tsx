"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import type { UiLang } from "@/lib/copy";
import { uiText } from "@/lib/ui";

export const THEME_KEY = "clay-theme";
export const LANG_KEY = "clay-lang";

export type ThemeName = "dark" | "light";

type ChromeValue = {
  theme: ThemeName;
  lang: UiLang;
  toggleTheme: () => void;
  setLang: (lang: UiLang) => void;
};

const ChromeContext = createContext<ChromeValue | null>(null);

function applyTheme(theme: ThemeName) {
  document.documentElement.classList.toggle("light", theme === "light");
}

function applyLang(lang: UiLang) {
  document.documentElement.lang = lang;
}

export function ChromeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [lang, setLangState] = useState<UiLang>("tr");

  useEffect(() => {
    let nextTheme: ThemeName = "dark";
    let nextLang: UiLang = "tr";
    try {
      if (localStorage.getItem(THEME_KEY) === "light" || document.documentElement.classList.contains("light")) nextTheme = "light";
      if (localStorage.getItem(LANG_KEY) === "en" || document.documentElement.lang === "en") nextLang = "en";
    } catch {
      /* Storage can be blocked. The defaults stay Turkish and dark. */
    }
    applyTheme(nextTheme);
    applyLang(nextLang);
    setTheme(nextTheme);
    setLangState(nextLang);
  }, []);

  const toggleTheme = () => {
    const next: ThemeName = document.documentElement.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* The class still switches for this visit. */
    }
    setTheme(next);
  };

  const setLang = (next: UiLang) => {
    applyLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* The lang attribute still switches for this visit. */
    }
    setLangState(next);
  };

  return <ChromeContext.Provider value={{ theme, lang, toggleTheme, setLang }}>{children}</ChromeContext.Provider>;
}

export function useChrome(): ChromeValue {
  const value = useContext(ChromeContext);
  if (!value) throw new Error("ChromeProvider missing");
  return value;
}

function Moon() {
  return (
    <svg className="theme-glyph theme-moon" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M15.1 2.7a8.7 8.7 0 1 0 6.2 15.7A7.5 7.5 0 1 1 15.1 2.7z" />
    </svg>
  );
}

function Sun() {
  return (
    <svg className="theme-glyph theme-sun" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="3.3" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M12 3.1v2.2M12 18.7v2.2M3.1 12h2.2M18.7 12h2.2M5.7 5.7l1.6 1.6M16.7 16.7l1.6 1.6M18.3 5.7l-1.6 1.6M7.3 16.7l-1.6 1.6" />
      </g>
    </svg>
  );
}

export function FlagTr({ className = "lang-flag" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 24 18" aria-hidden>
      <defs>
        <clipPath id={`${id}-tr`}>
          <rect width="24" height="18" rx="3.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-tr)`}>
        <rect width="24" height="18" fill="#E30A17" />
        <circle cx="9.1" cy="9" r="4.35" fill="#fff" />
        <circle cx="10.45" cy="9" r="3.45" fill="#E30A17" />
        <polygon
          fill="#fff"
          points="14.55,9 13.15,9.48 13.68,10.84 12.72,9.78 11.32,10.08 12.38,9 11.32,7.92 12.72,8.22 13.68,7.16 13.15,8.52"
        />
      </g>
    </svg>
  );
}

export function FlagUs({ className = "lang-flag" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const stars: { x: number; y: number }[] = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      stars.push({ x: 1.35 + col * 1.65, y: 1.35 + row * 2.05 });
    }
  }
  return (
    <svg className={className} viewBox="0 0 24 18" aria-hidden>
      <defs>
        <clipPath id={`${id}-us`}>
          <rect width="24" height="18" rx="3.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-us)`}>
        <rect width="24" height="18" fill="#bf0a30" />
        <path fill="#fff" d="M0 1.4h24v1.4H0zm0 2.8h24v1.4H0zm0 2.8h24v1.4H0zm0 2.8h24v1.4H0zm0 2.8h24v1.4H0z" />
        <rect width="10.2" height="9.8" fill="#3c3b6e" />
        {stars.map((star) => (
          <circle key={`${star.x}-${star.y}`} cx={star.x} cy={star.y} r="0.38" fill="#fff" />
        ))}
      </g>
    </svg>
  );
}

function Chevron() {
  return (
    <svg className="lang-chevron" viewBox="0 0 12 12" aria-hidden>
      <path d="M2.2 4.2 6 8l3.8-3.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const LANGS = [
  { id: "tr" as const, flag: FlagTr },
  { id: "en" as const, flag: FlagUs },
];

export function ChromePair() {
  const { theme, lang, toggleTheme, setLang } = useChrome();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const dark = theme === "dark";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="chrome-pair">
      <button
        type="button"
        className="theme-pill"
        aria-pressed={dark}
        aria-label={uiText(lang, dark ? "themeDark" : "themeLight")}
        onClick={toggleTheme}
      >
        <span className="theme-knob">
          <Moon />
          <Sun />
        </span>
      </button>
      <div className="lang-pop" ref={wrap}>
        <button
          type="button"
          className="lang-btn"
          aria-label={uiText(lang, "language")}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          <FlagTr className="lang-flag clay-tr" />
          <FlagUs className="lang-flag clay-en" />
          <Chevron />
        </button>
        {open && (
          <ul className="lang-menu" id={menuId} role="listbox" aria-label={uiText(lang, "language")}>
            {LANGS.map((item) => {
              const Flag = item.flag;
              const label = uiText(lang, item.id === "tr" ? "turkish" : "english");
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="lang-option"
                    role="option"
                    aria-selected={lang === item.id}
                    onClick={() => {
                      setLang(item.id);
                      setOpen(false);
                    }}
                  >
                    <Flag />
                    <span>{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
