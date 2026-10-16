import { formatTL } from "@/lib/format";

function axisMoney(kurus: number): string {
  const lira = kurus / 100;
  if (Math.abs(lira) >= 1000) {
    return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(lira)}`;
  }
  return formatTL(kurus);
}

export function SpendChart({
  days,
}: {
  days: { key: string; label: string; total: number }[];
}) {
  const width = 720;
  const height = 268;
  const pad = { left: 78, right: 18, top: 28, bottom: 36 };
  if (days.length === 0) {
    return <p className="mt-4 text-sm text-white/55">Bu aralıkta harcama yok.</p>;
  }
  const peak = Math.max(...days.map((day) => day.total), 0);
  const scale = peak || 1;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const step = days.length > 1 ? innerW / (days.length - 1) : innerW;
  const points = days.map((day, index) => {
    const x = pad.left + index * step;
    const y = pad.top + innerH - (day.total / scale) * innerH;
    return { ...day, x, y };
  });
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const baseline = pad.top + innerH;
  const area = `${line} L${last?.x.toFixed(1)},${baseline} L${first?.x.toFixed(1)},${baseline} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const sum = days.reduce((total, day) => total + day.total, 0);
  const top = days.reduce((best, day) => (day.total > best.total ? day : best), days[0]);

  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Son yedi günün harcaması">
        <defs>
          <linearGradient id="spend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0c98a" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#9be7c4" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f0c98a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="spend-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9be7c4" />
            <stop offset="58%" stopColor="#f0c98a" />
            <stop offset="100%" stopColor="#ffb4a2" />
          </linearGradient>
          <filter id="spend-glow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {ticks.map((mark) => {
          const y = pad.top + innerH - mark * innerH;
          const value = Math.round(scale * mark);
          return (
            <g key={mark}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="rgba(255,255,255,.08)" />
              <text x={pad.left - 10} y={y + 4} textAnchor="end" fill="rgba(255,255,255,.42)" fontSize="11">
                {axisMoney(value)}
              </text>
            </g>
          );
        })}
        <path className="spend-area" d={area} fill="url(#spend-fill)" />
        <path
          className="spend-line"
          d={line}
          pathLength={1}
          fill="none"
          stroke="url(#spend-stroke)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#spend-glow)"
        />
        {points.map((point) => {
          const high = peak > 0 && point.total === peak;
          return (
            <g key={point.key}>
              {high && <circle cx={point.x} cy={point.y} r="11" fill="rgba(240,201,138,.18)" />}
              <circle cx={point.x} cy={point.y} r={high ? 5.5 : 4} fill="#07060b" stroke={high ? "#ffe7c2" : "#f0c98a"} strokeWidth="2" />
              {high && (
                <text x={point.x} y={point.y - 12} textAnchor="middle" fill="#f0c98a" fontSize="12" fontWeight="700">
                  {formatTL(point.total)}
                </text>
              )}
              <text x={point.x} y={height - 10} textAnchor="middle" fill="rgba(255,255,255,.62)" fontSize="12">
                {point.label}
              </text>
              <title>
                {point.label}: {formatTL(point.total)}
              </title>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-xs text-white/50">
        {peak === 0
          ? "Bu aralıkta harcama yok."
          : `7 gün toplamı ${formatTL(sum)} · en yüksek gün ${top?.label ?? ""} ${formatTL(top?.total ?? 0)}`}
      </figcaption>
    </figure>
  );
}
