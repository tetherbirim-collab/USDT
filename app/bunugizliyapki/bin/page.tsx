"use client";

import { AdminBins } from "@/components/admin-bins";
import { Notice } from "@/components/notice";
import { Boot, useQuery } from "@/lib/live";
import { snapshot } from "@/lib/store";

export default function AdminBinPage() {
  const query = useQuery();
  if (!query) return <Boot />;
  const db = snapshot();
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-gold">BIN</p>
        <h1 className="font-display text-4xl font-extrabold">BIN listeleri</h1>
      </div>
      <Notice code={query.get("bildirim") || undefined} />
      <AdminBins bins={db.bins} />
    </div>
  );
}
