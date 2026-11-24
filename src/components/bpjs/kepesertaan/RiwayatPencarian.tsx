"use client";

// Riwayat pencarian SESI INI (hanya di memori — berisi NIK/no. kartu, sengaja tidak disimpan
// ke browser). Klik baris = isi ulang form & cek lagi. Status ditulis sebagai teks, bukan
// warna titik saja.

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/utils";
import { LABEL_MODE, type RiwayatItem } from "./kepesertaanShared";

function jam(ms: number) {
  return new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function RiwayatPencarian({
  items,
  onPilih,
  onHapus,
}: {
  items: RiwayatItem[];
  onPilih: (r: RiwayatItem) => void;
  onHapus: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="riwayat-judul" className="rounded-xl bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <h2 id="riwayat-judul" className="text-xs font-semibold text-foreground">
          Riwayat sesi ini
        </h2>
        <Button variant="ghost" size="xs" onClick={onHapus} className="text-muted-foreground">
          Hapus
        </Button>
      </div>
      <ul className="p-1.5">
        <AnimatePresence initial={false}>
          {items.map((r) => {
            const status = r.aktif === true ? "Aktif" : r.aktif === false ? "Tidak aktif" : "Gagal";
            return (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <button
                  type="button"
                  onClick={() => onPilih(r)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-foreground">{r.nama ?? r.pesan ?? "—"}</span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                      {LABEL_MODE[r.mode]} {r.value}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={cn(
                        "flex items-center justify-end gap-1 text-[11px] font-medium",
                        r.aktif === true ? "text-emerald-700" : r.aktif === false ? "text-rose-700" : "text-muted-foreground",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-1.5 rounded-full",
                          r.aktif === true ? "bg-emerald-500" : r.aktif === false ? "bg-rose-500" : "bg-slate-300",
                        )}
                      />
                      {status}
                    </span>
                    <span className="block text-[11px] tabular-nums text-muted-foreground">{jam(r.at)}</span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}
