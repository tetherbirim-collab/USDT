"use client";

import { useRef } from "react";

export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function move(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || reduced()) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    el.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 12}deg)`;
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "rotateY(-10deg) rotateX(7deg)";
  }

  return (
    <div className="floaty [perspective:1200px]" onMouseMove={move} onMouseLeave={leave}>
      <div
        ref={ref}
        className="transition-transform duration-200 ease-out"
        style={{ transform: "rotateY(-10deg) rotateX(7deg)" }}
      >
        {children}
      </div>
    </div>
  );
}
