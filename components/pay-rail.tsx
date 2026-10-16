const STREAM =
  "Settle(txId, acquirer, amount)   emit Authorize(card)   function settle(bytes32 txid)   require(settled[txid] == false)   return true;   ";

function CodeStream({ reverse = false }: { reverse?: boolean }) {
  const line = `${STREAM}${STREAM}`;
  return (
    <div className={`pay-stream ${reverse ? "pay-stream-back" : ""}`} aria-hidden>
      <p>{line}</p>
    </div>
  );
}

function Waves({ tone }: { tone: "gold" | "violet" }) {
  const stroke = tone === "gold" ? "rgba(255,236,190,0.82)" : "rgba(186,120,255,0.8)";
  return (
    <svg className="pay-waves" viewBox="0 0 280 180" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <path
          key={index}
          d={`M${-30 + index * 10} 190 C ${50 + index * 8} ${130 - index * 8}, ${150 + index * 6} ${36 + index * 5}, 320 ${-16 - index * 6}`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.35}
        />
      ))}
    </svg>
  );
}

function SeamCode() {
  const bits = ["settle(tx)", "emit card", "amount", "txid", "return", "auth"];
  const rows = Array.from({ length: 8 }, (_, index) => bits[index % bits.length]);
  return (
    <span className="pay-seam" aria-hidden>
      <span className="pay-seam-code">
        {[...rows, ...rows].map((row, index) => (
          <i key={index}>{row}</i>
        ))}
      </span>
    </span>
  );
}

function BornCard({
  coin,
  name,
  tone,
  reverse = false,
}: {
  coin: "XMR" | "BTC";
  name: string;
  tone: "gold" | "violet";
  reverse?: boolean;
}) {
  return (
    <article className={`pay-birth pay-birth-${tone} ${reverse ? "pay-birth-back" : ""}`}>
      <div className="pay-card-face">
        <Waves tone={tone} />
        <span className="pay-contact" aria-hidden />
        <p className="pay-card-brand">CLAY</p>
        <p className="pay-card-coin">{coin}</p>
        <p className="pay-card-name">{name}</p>
        <strong>VISA</strong>
      </div>
      <SeamCode />
    </article>
  );
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

export function PayRail() {
  return (
    <section className="pay-rail" aria-label="CLAY Sanal Kart Hizmetleri. Kod akarken karta dönüşür.">
      <div className="pay-rail-stage">
        <CodeStream />
        <BornCard coin="XMR" name="Monero" tone="violet" />
        <BornCard coin="BTC" name="Bitcoin" tone="gold" reverse />
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
