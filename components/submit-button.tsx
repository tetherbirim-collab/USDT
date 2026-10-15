"use client";

import { useFormStatus } from "react-dom";
import { Boot } from "@/lib/live";

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
    <>
      {pending && (
        <div className="fixed inset-0 z-[80] bg-[#07060b]">
          <Boot />
        </div>
      )}
      <button className={className} disabled={pending || disabled}>
        {children}
      </button>
    </>
  );
}
