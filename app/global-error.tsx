"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#07060b", color: "#fff", fontFamily: "Inter, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem" }}>
          <div style={{ maxWidth: "28rem" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Sayfa açılmadı</h1>
            <p style={{ color: "rgba(255,255,255,.72)" }}>Bağlantı yenilenince panele dönersin.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{ border: 0, borderRadius: "999px", background: "#e0152b", color: "#fff", fontWeight: 700, padding: "0.8rem 1.2rem" }}
              >
                Yeniden dene
              </button>
              <a href="/panel/" style={{ borderRadius: "999px", color: "#fff", fontWeight: 700, padding: "0.8rem 1.2rem" }}>
                Panele dön
              </a>
              <a href="/" style={{ borderRadius: "999px", color: "#fff", fontWeight: 700, padding: "0.8rem 1.2rem" }}>
                Ana sayfa
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
