const WAVES = Array.from({ length: 26 }, (_, index) => index);

export function AuthVisual() {
  return (
    <div className="relative min-h-[280px] overflow-hidden bg-[linear-gradient(180deg,#e7f1ff_0%,#d5e6fb_55%,#c5daf6_100%)] lg:min-h-full">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.45) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="absolute left-1/2 top-[16%] w-[46%] max-w-[220px] -translate-x-1/2 -rotate-6 sm:top-[18%]">
        <svg viewBox="0 0 200 320" className="w-full drop-shadow-[0_28px_36px_rgba(28,72,150,.35)]" aria-hidden>
          <defs>
            <linearGradient id="clayFace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9fd4ff" />
              <stop offset="42%" stopColor="#2f78ff" />
              <stop offset="100%" stopColor="#12367f" />
            </linearGradient>
          </defs>
          <rect width="200" height="320" rx="24" fill="url(#clayFace)" />
          {WAVES.map((index) => (
            <path
              key={index}
              d={`M${-20 + index * 3} 340 C ${30 + index * 4} ${210 - index * 2}, ${90 + index * 2} ${40 + index * 3}, 250 ${-40 + index * 6}`}
              fill="none"
              stroke="rgba(255,255,255,.7)"
              strokeWidth="1.2"
            />
          ))}
        </svg>
      </div>
      <div className="absolute bottom-[9%] left-1/2 w-[78%] max-w-[440px] -translate-x-1/2">
        {[92, 84, 74, 64, 52].map((width, index) => (
          <div
            key={width}
            className="mx-auto mb-1.5 h-3 rounded-[50%] border border-white/70"
            style={{
              width: `${width}%`,
              background: index % 2 === 0 ? "linear-gradient(180deg,#ffffff,#d7e7fb)" : "linear-gradient(180deg,#f7fbff,#b7d2f4)",
              boxShadow: "0 8px 14px rgba(40,80,150,.12)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
