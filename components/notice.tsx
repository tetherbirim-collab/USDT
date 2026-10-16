import { noticeText } from "@/lib/catalog";

export function Notice({ code, text }: { code?: string; text?: string }) {
  const mapped = noticeText(code);
  const line = code?.startsWith("e-kripicard") && text?.trim() ? text.trim() : mapped;
  if (!line) return null;
  const bad = code?.startsWith("e-");
  return (
    <p role="status" className={bad ? "banner-bad" : "banner-ok"}>
      {line}
    </p>
  );
}
