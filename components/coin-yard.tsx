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
          d="M17.9 14.2c.8-.4 1.4-1.1 1.2-2.2-.2-1.4-1.3-2-3-2.2V8.2h-1.6v1.5c-.4 0-.7 0-1.1.1V8.2h-1.6v1.6H9.6v1.5s1 .1 1 .1c.6 0 .8.3.8.6v5.6c0 .2 0 .3-.1.3h-.1l-1.2 3h2v1.5h1.6v-1.5c.4 0 .8 0 1.1.1v1.4h1.6v-1.5c1.9.1 3.2-.8 3.4-2.4.2-1.2-.3-2-1.1-2.3zm-2.1-2c.8 0 2.4.2 2.4 1.4 0 1.2-1.6 1.4-2.4 1.4v-2.8zm.3 6.1c.9 0 2.8.2 2.8 1.6s-1.9 1.6-2.8 1.6v-3.2z"
        />
        <path fill="#fff" d="M14.1 6.4h1.35v3.1h-1.35zm2.55 0h1.35v3.1h-1.35zM14.1 22.5h1.35v3.1h-1.35zm2.55 0h1.35v3.1h-1.35z" />
      </svg>
    );
  }
  if (id === "eth") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M16 4.4 15.6 5.6v12.4l.4.4 7.2-4.2L16 4.4z" opacity=".72" />
        <path fill="#fff" d="M16 4.4 8.8 14.2 16 18.4V4.4z" />
        <path fill="#fff" d="M16 20.1 15.7 20.5v5.2l.3.8 7.2-10.2L16 20.1z" opacity=".72" />
        <path fill="#fff" d="M16 26.5v-6.4l-7.2-4.2L16 26.5z" />
        <path fill="#fff" d="M16 18.4 8.8 14.2 16 11.6v6.8z" opacity=".5" />
        <path fill="#fff" d="M16 18.4v-6.8l7.2 2.6L16 18.4z" opacity=".35" />
      </svg>
    );
  }
  if (id === "sol") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#00ffa3" d="M7.2 8.6h15.4c.3 0 .5.3.3.6l-2.2 2.6c-.1.1-.2.2-.4.2H5.2c-.3 0-.5-.3-.3-.6l2-2.6c.1-.1.2-.2.3-.2z" />
        <path fill="#dc1fff" d="M7.2 14.6h15.4c.3 0 .5.3.3.6l-2.2 2.6c-.1.1-.2.2-.4.2H5.2c-.3 0-.5-.3-.3-.6l2-2.6c.1-.1.2-.2.3-.2z" />
        <path fill="#00d1ff" d="M7.2 20.6h15.4c.3 0 .5.3.3.6l-2.2 2.6c-.1.1-.2.2-.4.2H5.2c-.3 0-.5-.3-.3-.6l2-2.6c.1-.1.2-.2.3-.2z" />
      </svg>
    );
  }
  if (id === "usdt") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path
          fill="#fff"
          d="M17.4 14.4V12h5.2V9.4H9.4V12h5.2v2.4c-4 .2-7 1.1-7 2.1s3 1.9 7 2.1v7h2.8v-7c4-.2 6.9-1.1 6.9-2.1s-2.9-1.9-6.9-2.1zm0 3.4v.1c-.2 0-.8.1-1.4.1s-1.2 0-1.4-.1v-.1c-3.4-.2-5.8-.8-5.8-1.5s2.4-1.3 5.8-1.5v2.2c.2 0 .8.1 1.4.1s1.2 0 1.4-.1v-2.2c3.3.2 5.7.8 5.7 1.5s-2.4 1.3-5.7 1.5z"
        />
      </svg>
    );
  }
  if (id === "ton") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M16 5.2 26.6 12.2 16 27.4 5.4 12.2 16 5.2z" />
        <path fill="#0098ea" d="M16 9.4 10.2 13.6 16 21.8 21.8 13.6 16 9.4z" />
        <path fill="#fff" d="M16 9.4 13.1 13.6 16 17.2 18.9 13.6 16 9.4z" />
      </svg>
    );
  }
  if (id === "ltc") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M12.2 7.2h6.4l-3.2 7.6h4.6l-1.4 2.6H14.2L12.4 25H8.2l2.2-7.6H7.2l1.2-2.6h3.2L14.4 7.2h-2.2z" />
        <path fill="#fff" d="M8.4 16.2h14.2v2.2H8.4z" transform="rotate(-18 15.5 17.3)" />
      </svg>
    );
  }
  if (id === "trx") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M8.2 7.4 25.4 14.2 14.6 26.2 8.2 7.4z" />
        <path fill="#ef0027" d="M11.2 10.6 20.6 14.4 15.2 21.4 11.2 10.6z" />
        <path fill="#fff" d="M14.8 13.2 18.2 14.6 16 18.2 14.8 13.2z" />
      </svg>
    );
  }
  if (id === "doge") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path
          fill="#fff"
          fillRule="evenodd"
          d="M9.6 7.4h7.6c4.4 0 7.2 2.8 7.2 8.6s-2.8 8.6-7.2 8.6H9.6V7.4zm3.4 3.2v10.8h3.8c2.3 0 3.8-1.5 3.8-5.4s-1.5-5.4-3.8-5.4h-3.8z"
        />
        <path fill="#fff" d="M8.2 14.6h15.2v2.4H8.2z" />
      </svg>
    );
  }
  if (id === "xmr") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden>
        <path fill="#fff" d="M6.4 23.2V10.2l4.8 6.2 4.8-6.2 4.8 6.2 4.8-6.2v13h-3.6v-6.4L17.2 23.4 12.4 16.8v6.4H6.4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <path fill="#fff" d="M16 4.6 18.7 7.3 16 10 13.3 7.3 16 4.6z" />
      <path fill="#fff" d="M22.8 11.4 25.5 14.1 22.8 16.8 20.1 14.1 22.8 11.4z" />
      <path fill="#fff" d="M9.2 11.4 11.9 14.1 9.2 16.8 6.5 14.1 9.2 11.4z" />
      <path fill="#fff" d="M16 18.2 18.7 20.9 16 23.6 13.3 20.9 16 18.2z" />
      <path fill="#fff" d="M16 11.2 18.2 13.4 16 20.8 13.8 13.4 16 11.2z" opacity=".85" />
    </svg>
  );
}

export function CoinYard() {
  return (
    <section className="coin-yard" aria-label="CLAY. Kripto ile yükle. 150’den fazla coin.">
      <div className="coin-yard-copy">
        <p className="coin-yard-kicker">CLAY</p>
        <h2>Kripto ile yükle.</h2>
        <p className="coin-yard-lead">150+ coin. KYC yok.</p>
        <p className="coin-yard-note">Bitcoin, USDT, Monero ve BNB. Tutar ana bakiyeye yazılır.</p>
      </div>
      <ul className="coin-grid">
        {COINS.map((coin) => (
          <li key={coin.id} className="coin-tile">
            <span className={`coin-mark coin-mark-${coin.id}`} style={{ ["--glow" as string]: coin.glow }}>
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
