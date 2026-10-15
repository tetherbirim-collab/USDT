export function Wordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const ink = tone === "light" ? "text-[#172033]" : "text-[#2a1418]";
  const sub = "text-[#c41025]";
  return (
    <span className="leading-none">
      <span className={`block font-display text-[1.15rem] font-bold tracking-[0.2em] ${ink}`}>CLAY</span>
      <span className={`mt-1 block text-[10px] font-semibold tracking-[0.24em] ${sub}`}>SANAL KART HİZMETLERİ</span>
    </span>
  );
}

export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={`clay-mark ${className}`} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#e0152b" />
      <rect x="5" y="12" width="22" height="3.2" fill="#fff" />
      <circle cx="11" cy="21" r="1.5" fill="#fff" />
      <circle cx="16" cy="21" r="1.5" fill="#fff" />
    </svg>
  );
}
