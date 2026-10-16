import type { Metadata } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-ext-700.css";
import "./globals.css";
import { ChromeProvider } from "@/components/chrome-controls";
import { TelegramButton } from "@/components/telegram-button";

const themeBoot = `(function(){try{var t=localStorage.getItem("clay-theme");var l=localStorage.getItem("clay-lang");var root=document.documentElement;if(t==="light")root.classList.add("light");if(l==="en")root.lang="en";}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "CLAY Sanal Kart Hizmetleri",
    template: "%s · CLAY",
  },
  description:
    "CLAY Sanal Kart Hizmetleri. Facebook Ads, TikTok, Google Ads ve Ultima kartları. Tutar dolar olarak girilir, bakiyede canlı kurun TL karşılığı durur.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <ChromeProvider>
        <div
          className="pointer-events-none fixed inset-0 z-[70] opacity-[0.14]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            mixBlendMode: "overlay",
          }}
        />
        {children}
        <TelegramButton />
        <link rel="stylesheet" href="/glass.css" />
        </ChromeProvider>
      </body>
    </html>
  );
}
