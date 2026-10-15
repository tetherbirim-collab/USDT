export function DeskArrival({
  tone,
  kicker,
  title,
  line,
}: {
  tone: "orders" | "payments";
  kicker: string;
  title: string;
  line: string;
}) {
  return (
    <div className={`desk-arrival desk-arrival-${tone}`}>
      <p className="desk-arrival-kicker">{kicker}</p>
      <h1 className="font-display text-4xl font-extrabold">{title}</h1>
      <p className="mt-2 max-w-xl text-white/70">{line}</p>
    </div>
  );
}
