export default function PanelLoading() {
  return (
    <div className="grid gap-4">
      <div className="glass h-40 animate-pulse rounded-[28px]" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass h-28 animate-pulse rounded-[24px]" />
        <div className="glass h-28 animate-pulse rounded-[24px]" />
        <div className="glass h-28 animate-pulse rounded-[24px]" />
      </div>
    </div>
  );
}
