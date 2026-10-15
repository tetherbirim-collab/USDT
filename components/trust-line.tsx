"use client";

import { siteText } from "@/lib/copy";
import { useSiteSettings } from "@/lib/live";

export function TrustLine({ className = "" }: { className?: string }) {
  const settings = useSiteSettings();
  return (
    <p className={`trust-line ${className}`.trim()}>
      <span>{siteText(settings, "sloganKyc")}</span>
      <span className="trust-hot">{siteText(settings, "sloganLog")}</span>
      <span>{siteText(settings, "sloganSafe")}</span>
    </p>
  );
}

export function AnnouncementStrip() {
  const settings = useSiteSettings();
  const row = settings.announcement;
  if (!row?.on || !row.title.trim()) return null;
  return (
    <p className="mx-auto mt-4 max-w-6xl rounded-2xl border border-gold/40 bg-black/40 px-4 py-3 text-sm text-white">
      <span className="font-bold text-gold">{row.title}</span>
      {row.body.trim() ? <span className="text-white/80"> · {row.body}</span> : null}
    </p>
  );
}
