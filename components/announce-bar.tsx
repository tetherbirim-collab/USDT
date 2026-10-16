"use client";

import { useSiteSettings } from "@/lib/live";

export function AnnounceBar() {
  const settings = useSiteSettings();
  const row = settings.announcement;
  const title = typeof row?.title === "string" ? row.title.trim() : "";
  const body = typeof row?.body === "string" ? row.body.trim() : "";
  if (!row?.on || !title) return null;
  return (
    <aside className="announce-bar" aria-label="Duyuru">
      <p className="announce-kicker">DUYURU</p>
      <div>
        <p className="announce-title">{title}</p>
        {body ? <p className="announce-body">{body}</p> : null}
      </div>
    </aside>
  );
}
