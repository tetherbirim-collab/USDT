import type { Metadata } from "next";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";
import "@fontsource/syne/800.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SanalKart — simülasyon sanal kart",
    template: "%s · SanalKart",
  },
  description:
    "Reklam, alışveriş, abonelik ve seyahat senaryoları için simülasyon sanal kart paneli. Gerçek tahsilat ve kart ihracı yoktur.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div
          className="pointer-events-none fixed inset-0 z-[70] opacity-[0.14]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            mixBlendMode: "overlay",
          }}
        />
        {children}
      </body>
    </html>
  );
}
