export function Wordmark() {
  return (
    <span className="leading-none">
      <span className="block font-display text-lg font-extrabold tracking-[0.08em]">CLAY</span>
      <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.16em] text-white/55">
        SANAL KART HİZMETLERİ
      </span>
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
