export function Wordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const ink = tone === "light" ? "text-[#172033]" : "text-white";
  const sub = tone === "light" ? "text-[#8a6230]" : "text-gold";
  return (
    <span className="leading-none">
      <span className={`block font-display text-[1.15rem] font-bold tracking-[0.2em] ${ink}`}>CLAY</span>
      <span className={`mt-1 block text-[10px] font-semibold tracking-[0.24em] ${sub}`}>SANAL KART HİZMETLERİ</span>
    </span>
  );
}

export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#f0c98a" />
      <rect x="5" y="12" width="22" height="3.2" fill="#1a1024" />
      <circle cx="11" cy="21" r="1.5" fill="#1a1024" />
      <circle cx="16" cy="21" r="1.5" fill="#1a1024" />
    </svg>
  );
}
