export function CrestBanner() {
  return (
    <section className="crest" aria-labelledby="crest-baslik">
      <div className="crest-sheen" aria-hidden="true" />
      <div className="crest-glint" aria-hidden="true" />
      <div className="crest-grid">
        <div className="crest-art" aria-hidden="true">
          <svg viewBox="0 0 640 420" role="presentation">
            <defs>
              <linearGradient id="crest-glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d7e6ff" stopOpacity="0.22" />
                <stop offset="1" stopColor="#8eafe4" stopOpacity="0.08" />
              </linearGradient>
              <radialGradient id="crest-peri" cx="38%" cy="32%" r="68%">
                <stop offset="0%" stopColor="#e4edff" />
                <stop offset="42%" stopColor="#a9c0f2" />
                <stop offset="100%" stopColor="#7e9de4" />
              </radialGradient>
              <linearGradient id="crest-arc" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#c9dcff" stopOpacity="0" />
                <stop offset="0.25" stopColor="#d5e4ff" stopOpacity="0.85" />
                <stop offset="1" stopColor="#c9dcff" stopOpacity="0.15" />
              </linearGradient>
              <filter id="crest-shadow" x="-30%" y="-30%" width="160%" height="170%">
                <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#06101e" floodOpacity="0.38" />
              </filter>
              <filter id="crest-soft" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#071426" floodOpacity="0.28" />
              </filter>
            </defs>

            <path
              d="M18 300 C 150 392, 320 408, 590 268"
              fill="none"
              stroke="url(#crest-arc)"
              strokeWidth="2"
            />
            <path
              d="M78 338 C 150 372, 230 378, 300 348"
              fill="none"
              stroke="#d5e4ff"
              strokeOpacity="0.55"
              strokeWidth="1.4"
              strokeDasharray="1.5 7"
              strokeLinecap="round"
            />

            <g filter="url(#crest-soft)">
              <rect x="72" y="46" width="348" height="248" rx="28" fill="url(#crest-glass)" stroke="#d7e6ff" strokeOpacity="0.38" />
              <circle cx="132" cy="112" r="30" fill="#d7e6ff" fillOpacity="0.16" stroke="#e7f0ff" strokeOpacity="0.45" />
              <circle cx="132" cy="104" r="9" fill="#eef4ff" />
              <path d="M112 132c4.5-14 12.5-18 20-18s15.5 4 20 18" fill="#eef4ff" />
              <rect x="178" y="92" width="148" height="9" rx="4.5" fill="#f4f8ff" fillOpacity="0.78" />
              <rect x="178" y="112" width="104" height="9" rx="4.5" fill="#f4f8ff" fillOpacity="0.42" />
              <rect x="108" y="168" width="214" height="8" rx="4" fill="#f4f8ff" fillOpacity="0.34" />
              <rect x="108" y="190" width="250" height="8" rx="4" fill="#f4f8ff" fillOpacity="0.24" />
              <rect x="108" y="212" width="176" height="8" rx="4" fill="#f4f8ff" fillOpacity="0.18" />
              <rect x="108" y="240" width="92" height="22" rx="11" fill="#f4f8ff" fillOpacity="0.12" />
            </g>

            <circle cx="438" cy="168" r="116" fill="url(#crest-peri)" />
            <circle cx="438" cy="168" r="116" fill="none" stroke="#ffffff" strokeOpacity="0.28" />

            <g transform="translate(438 168) rotate(-27)">
              <rect x="-168" y="-15" width="336" height="30" rx="10" fill="#07111f" />
              <path
                d="M-6 -8 l12 8 -12 8"
                fill="none"
                stroke="#d7e6ff"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            <g className="crest-coin crest-coin-b" filter="url(#crest-shadow)">
              <circle cx="214" cy="286" r="48" fill="#ffffff" />
              <circle cx="214" cy="286" r="36" fill="#f7931a" />
              <text
                x="218"
                y="298"
                textAnchor="middle"
                fill="#ffffff"
                fontFamily="Inter, sans-serif"
                fontSize="34"
                fontWeight="700"
              >
                B
              </text>
              <path d="M200 264 v44 M208 264 v44" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
            </g>

            <g className="crest-coin crest-coin-t" filter="url(#crest-shadow)">
              <circle cx="146" cy="348" r="42" fill="#ffffff" />
              <circle cx="146" cy="348" r="31" fill="#26a17b" />
              <path d="M130 336 h32 v7 h-12.5 v16 h-7 v-16 H130 z" fill="#ffffff" />
            </g>

            <g className="crest-coin crest-coin-m" filter="url(#crest-shadow)">
              <circle cx="252" cy="348" r="44" fill="#ffffff" />
              <circle cx="252" cy="348" r="33" fill="#ff6600" />
              <path d="M234 360 V336 h8 l10 13 10-13 h8 v24 h-7.5 v-13 l-10.5 13 -10.5-13 v13 z" fill="#ffffff" />
            </g>
          </svg>
        </div>
        <div className="crest-copy">
          <div className="crest-stack">
            <p className="crest-ghost" aria-hidden="true">
              <span>CLAY</span>
              <span>SANAL KART</span>
            </p>
            <h2 id="crest-baslik" className="crest-title">
              <span>Sanal kart.</span>
              <span>Hemen harca.</span>
            </h2>
          </div>
          <p className="crest-lede">KYC yok. Kripto ile yükle.</p>
        </div>
      </div>
    </section>
  );
}
