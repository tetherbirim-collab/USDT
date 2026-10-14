"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending || disabled}>
      {pending ? "İşleniyor…" : children}
    </button>
  );
}
