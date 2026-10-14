import { noticeText } from "@/lib/catalog";

export function Notice({ code }: { code?: string }) {
  const text = noticeText(code);
  if (!text) return null;
  const bad = code?.startsWith("e-");
  return (
    <p role="status" className={bad ? "banner-bad" : "banner-ok"}>
      {text}
    </p>
  );
}
