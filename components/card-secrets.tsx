"use client";

import { useState } from "react";
import { VirtualCard } from "./virtual-card";
import type { Card } from "@/lib/types";

export function CardSecrets({ card }: { card: Card }) {
  const [showCvv, setShowCvv] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyPan() {
    const digits = card.pan;
    try {
      await navigator.clipboard.writeText(digits);
    } catch {
      const field = document.createElement("textarea");
      field.value = digits;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
  }

  return (
    <div>
      <VirtualCard card={{ ...card, hideCvv: !showCvv }} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost" onClick={copyPan}>
          {copied ? "Kopyalandı" : "Numarayı kopyala"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setShowCvv((value) => !value)}>
          {showCvv ? "CVV gizle" : "CVV göster"}
        </button>
      </div>
    </div>
  );
}
