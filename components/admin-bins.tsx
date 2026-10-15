import { adminBinAddAction, adminBinPasteAction, adminBinRemoveAction, adminBinSaveAction } from "@/lib/actions";
import { CARD_TYPE_ORDER, CARD_TYPES } from "@/lib/catalog";
import type { BinRow } from "@/lib/types";

export function AdminBins({ bins }: { bins: BinRow[] }) {
  return (
    <section id="binler" className="glass rounded-[28px] p-5">
      <h2 className="font-display text-2xl font-bold">BIN listeleri</h2>
      <p className="mt-1 max-w-2xl text-sm text-white/60">
        Her türde ayrılmış test öneki 400000 hazır durur. Türün listesi tamamen silinirse bu satır
        yeniden yazılır. Gerçek BIN tablosu burada yoktur. Kendi satırlarınızı tek tek veya satır satır
        yapıştırarak eklersiniz. Numara sorgulama yoktur.
      </p>
      <div className="mt-4 grid gap-4">
        {CARD_TYPE_ORDER.map((type) => {
          const rows = bins.filter((row) => row.type === type);
          return (
            <article key={type} className="rounded-2xl border border-white/10 p-4">
              <h3 className="font-display text-xl font-bold">{CARD_TYPES[type].name}</h3>
              {rows.length === 0 ? (
                <p className="mt-2 text-sm text-white/55">Bu türde henüz BIN yok. Değerler sonra eklenecek.</p>
              ) : (
                <ul className="mt-3 grid gap-2">
                  {rows.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-end gap-2 rounded-2xl bg-black/25 p-3">
                      <form action={adminBinSaveAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={row.id} />
                        <label className="grid gap-1 text-xs">
                          Etiket
                          <input className="field w-40" name="etiket" defaultValue={row.label} required minLength={2} maxLength={40} />
                        </label>
                        <label className="grid gap-1 text-xs">
                          BIN
                          <input className="field w-32 font-mono" name="rakam" inputMode="numeric" defaultValue={row.digits} required pattern="\d{6,8}" />
                        </label>
                        <button className="btn btn-gold">Kaydet</button>
                      </form>
                      <form action={adminBinRemoveAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <button className="btn btn-danger">Sil</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <form action={adminBinAddAction} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="tur" value={type} />
                <label className="grid gap-1 text-xs">
                  Yeni etiket
                  <input className="field w-40" name="etiket" required minLength={2} maxLength={40} placeholder="Liste adı" />
                </label>
                <label className="grid gap-1 text-xs">
                  BIN rakamları
                  <input className="field w-32 font-mono" name="rakam" inputMode="numeric" required pattern="\d{6,8}" placeholder="6–8 rakam" />
                </label>
                <button className="btn btn-ghost">Ekle</button>
              </form>
              <form action={adminBinPasteAction} className="mt-3 grid gap-2">
                <input type="hidden" name="tur" value={type} />
                <label className="grid gap-1 text-xs">
                  Toplu yapıştır
                  <textarea
                    className="field min-h-24 font-mono"
                    name="yigin"
                    placeholder={"Liste adı 400000\nBaşka etiket|400001"}
                  />
                </label>
                <p className="text-xs text-white/45">Her satır etiket ve 6–8 rakam. Aynı türde yinelenen rakam atlanır.</p>
                <button className="btn btn-ghost w-fit">Satırları ekle</button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
