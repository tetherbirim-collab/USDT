"use client";

import { useSiteSettings } from "@/lib/live";

export function AnnounceBar() {
  const settings = useSiteSettings();
  const row = settings.announcement;
  if (!row?.on || !row.title.trim()) return null;
  return (
    <aside className="announce-bar" aria-label="Duyuru">
      <p className="announce-kicker">DUYURU</p>
      <div>
        <p className="announce-title">{row.title}</p>
        {row.body.trim() ? <p className="announce-body">{row.body}</p> : null}
      </div>
    </aside>
  );
}
