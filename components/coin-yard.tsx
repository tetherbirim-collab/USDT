const COINS = [
  { id: "btc", name: "Bitcoin", glow: "#f7931a" },
  { id: "eth", name: "Ethereum", glow: "#7b8cff" },
  { id: "sol", name: "Solana", glow: "#14f195" },
  { id: "usdt", name: "USDT", glow: "#26a17b" },
  { id: "ton", name: "TON", glow: "#2ea6ff" },
  { id: "ltc", name: "Litecoin", glow: "#5b8def" },
  { id: "trx", name: "Tron", glow: "#ff3b4e" },
  { id: "doge", name: "Dogecoin", glow: "#e0b84a" },
  { id: "xmr", name: "Monero", glow: "#ff6a2a" },
  { id: "bnb", name: "BNB", glow: "#f3ba2f" },
] as const;

function Glyph({ id }: { id: (typeof COINS)[number]["id"] }) {
  if (id === "btc") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path
          fill="#fff"
          d="M14.2 6.4h2.2v2.2h1.3c2.4 0 4 1.3 4 3.4 0 1.4-.7 2.4-1.8 3 1.5.4 2.3 1.6 2.3 3.3 0 2.4-1.8 3.9-4.6 3.9h-1.2v2.2h-2.2v-2.2H12v-2.1h1.2V10.7H12V8.6h2.2V6.4zm2.2 4.2v3.5h1.6c1.1 0 1.7-.5 1.7-1.5s-.6-1.5-1.7-1.5h-1.6zm0 5.4v4h1.9c1.2 0 1.9-.6 1.9-1.8s-.7-1.7-1.9-1.7h-1.9z"
        />
      </svg>
    );
  }
  if (id === "eth") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M16 5.2 15.7 6.2v13.1l.3.3 6.6-3.9L16 5.2z" opacity=".85" />
        <path fill="#fff" d="M16 5.2 9.4 15.7 16 19.6V5.2z" />
        <path fill="#fff" d="M16 21.1 15.8 21.4v3.9l.2.6 6.6-9.3L16 21.1z" opacity=".85" />
        <path fill="#fff" d="M16 25.9v-4.8l-6.6-3.9L16 25.9z" />
      </svg>
    );
  }
  if (id === "sol") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#14f195" d="M8.2 10.2h13.4l-2.2-3.2H6z" />
        <path fill="#9945ff" d="M8.2 17.6h13.4l-2.2-3.2H6z" />
        <path fill="#fff" d="M8.2 25h13.4l-2.2-3.2H6z" />
      </svg>
    );
  }
  if (id === "usdt") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M8 9h16v2.3h-6.1V23h-3.8V11.3H8V9z" />
        <path fill="#fff" d="M7.2 13.4h17.6v1.8H7.2z" />
      </svg>
    );
  }
  if (id === "ton") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" fillRule="evenodd" d="M16 6.2 26.2 13.8 16 26.4 5.8 13.8 16 6.2zm0 4.1-5.4 3.8L16 21.6l5.4-7.5L16 10.3z" />
      </svg>
    );
  }
  if (id === "ltc") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M13.4 6.4h6.2l-3.4 8.2h4.2L12.6 26l1.8-7.2h-3.6l2.6-12.4z" />
      </svg>
    );
  }
  if (id === "trx") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M16 6.2 27.2 25H4.8L16 6.2zm0 5.2-6.2 10.6h12.4L16 11.4z" />
      </svg>
    );
  }
  if (id === "doge") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" fillRule="evenodd" d="M10.2 7.2h7.4c4.3 0 7 2.9 7 8.8s-2.7 8.8-7 8.8h-7.4V7.2zm3.5 3.2v11.2h3.6c2.2 0 3.6-1.6 3.6-5.6s-1.4-5.6-3.6-5.6h-3.6z" />
      </svg>
    );
  }
  if (id === "xmr") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M7.4 22.4V11.2l4.3 5.6 4.3-5.6 4.3 5.6 4.3-5.6v11.2h-3.3v-5.6L17 22.8l-4.3-6v5.6H7.4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path fill="#fff" d="M16 5.2 19.2 8.4 16 11.6 12.8 8.4 16 5.2zM22.4 11.6 25.6 14.8 22.4 18 19.2 14.8 22.4 11.6zM9.6 11.6 12.8 14.8 9.6 18 6.4 14.8 9.6 11.6zM16 18 19.2 21.2 16 24.4 12.8 21.2 16 18z" />
    </svg>
  );
}

export function CoinYard() {
  return (
    <section className="coin-yard" aria-label="CLAY kripto ödeme. Kimlik onayı yok, belge yok, her şey anonim.">
      <div className="coin-yard-copy">
        <p className="coin-yard-kicker">CLAY</p>
        <h2>Kripto ile öde.</h2>
        <p className="coin-yard-lead">Kimlik onayı yok. Belge yok. Her şey anonim.</p>
        <p className="coin-yard-note">
          Bakiyeni Bitcoin’den Monero’ya, USDT’den BNB’ye kadar kripto ile yükle. Kapıda kimlik sorulmaz, evrak toplanmaz. CLAY’de kartın ve bakiyen sende kalır.
        </p>
      </div>
      <ul className="coin-grid">
        {COINS.map((coin, index) => (
          <li key={coin.id} className="coin-tile" style={{ animationDelay: `${index * 0.18}s` }}>
            <span className={`coin-mark coin-mark-${coin.id}`} style={{ ["--glow" as string]: coin.glow, animationDelay: `${index * 0.18}s` }}>
              <Glyph id={coin.id} />
            </span>
            <span className="coin-name">{coin.name}</span>
          </li>
        ))}
        <li className="coin-tile coin-more">
          <p className="coin-more-count">150+</p>
          <p className="coin-more-line">Daha fazla coin</p>
          <p className="coin-more-clay">CLAY</p>
        </li>
      </ul>
    </section>
  );
}
