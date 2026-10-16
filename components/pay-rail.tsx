const CODE = [
  "event Decline(address card, uint256 amount);",
  "function settle(bytes32 txid) internal returns (bool) {",
  "  require(settled[txid] == false);",
  "  emit Settle(txid, amount);",
  "  return true;",
  "}",
  "event Authorize(address card, uint256 amount);",
  "mapping(bytes32 => bool) settled;",
];

function CodePane({ delay }: { delay: string }) {
  const lines = [...CODE, ...CODE];
  return (
    <div className="pay-code" style={{ animationDelay: delay }}>
      <div className="pay-code-scroll">
        {lines.map((line, index) => (
          <p key={`${delay}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function Waves() {
  return (
    <svg className="pay-waves" viewBox="0 0 280 180" aria-hidden>
      {Array.from({ length: 9 }, (_, index) => (
        <path
          key={index}
          d={`M${-20 + index * 8} 190 C ${40 + index * 10} ${120 - index * 6}, ${150 + index * 8} ${40 + index * 4}, 300 ${-10 - index * 8}`}
          fill="none"
          stroke="rgba(168,92,255,0.85)"
          strokeWidth={1.4}
        />
      ))}
    </svg>
  );
}

function CryptoCard({ coin, name, delay }: { coin: "XMR" | "BTC"; name: string; delay: string }) {
  return (
    <article className={`pay-crypto pay-crypto-${coin.toLowerCase()}`} style={{ animationDelay: delay }}>
      <Waves />
      <div className="pay-crypto-top">
        <span className="pay-mark" aria-hidden>
          <i />
          <i />
        </span>
        <span>Pay</span>
        <span className="pay-signal" aria-hidden />
      </div>
      <p className="pay-crypto-coin">{coin}</p>
      <div className="pay-crypto-foot">
        <span>
          <small>CARDHOLDER</small>
          {name}
        </span>
        <strong>VISA</strong>
      </div>
    </article>
  );
}

export function PayRail() {
  return (
    <section className="pay-rail" aria-label="Ödemeler yalnız XMR ve BTC">
      <div className="pay-rail-stage">
        <CodePane delay="0s" />
        <CodePane delay="-6s" />
        <article className="pay-visa">
          <span className="pay-visa-beam" aria-hidden />
          <span className="pay-chip" aria-hidden />
          <span className="pay-contactless" aria-hidden />
          <p className="pay-visa-num">1234</p>
          <strong>VISA</strong>
        </article>
        <CryptoCard coin="XMR" name="Monero" delay="0s" />
        <CryptoCard coin="BTC" name="Bitcoin" delay="-1.4s" />
      </div>
      <p className="pay-rail-line">Ödemeler yalnız XMR ve BTC</p>
    </section>
  );
}
