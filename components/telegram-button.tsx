"use client";

import { useSiteSettings } from "@/lib/live";

export function TelegramButton() {
  const name = useSiteSettings().telegram.trim();
  if (!name) return null;
  return (
    <a className="tg-fab" href={`https://t.me/${name}`} target="_blank" rel="noopener noreferrer" aria-label={`Telegram ${name}`}>
      <svg viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M21.6 4.2 2.9 11.4c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.1.9.7.9.4 0 .6-.2.9-.5l2.6-2.5 5.4 4c1 .5 1.7.3 1.9-.9l3.5-16.4c.4-1.4-.5-2-1.7-1.4ZM8.4 13.7l9.8-6.2c.5-.3.9-.1.6.2l-8.4 7.6-.3 3.4-1.7-5z"
        />
      </svg>
    </a>
  );
}
