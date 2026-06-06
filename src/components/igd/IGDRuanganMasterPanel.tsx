"use client";

import { DoorOpen, BedDouble, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BED_STATUS_CFG, type LocationNode } from "@/components/master/ruangan/ruanganShared";

interface IGDRuanganMasterPanelProps {
  rooms: LocationNode[];
  /** Bed id yang sedang dipakai (alokasi Reserved/Occupied) — sumber okupansi operasional. */
  occupiedBedIds?: Set<string>;
  loading?: boolean;
  error?: boolean;
}

/**
 * Klasifikasi Ruangan IGD dari master (Location tipe IGD + bed-nya). Status master =
 * eksistensi/maintenance (Aktif/Maintenance); okupansi (Terisi/Tersedia) dari alokasi bed.
 */
export default function IGDRuanganMasterPanel({ rooms, occupiedBedIds, loading, error }: IGDRuanganMasterPanelProps) {
  const occ = occupiedBedIds ?? new Set<string>();
  const beds = rooms.flatMap((r) => r.beds);
  const aktif = beds.filter((b) => b.status === "active").length;
  const maintenance = beds.filter((b) => b.status === "suspended").length;
  const terisi = beds.filter((b) => b.status === "active" && occ.has(b.id)).length;
  const tersedia = aktif - terisi;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100">
            <DoorOpen size={14} className="text-teal-600" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Klasifikasi Ruangan IGD</h2>
            <p className="text-[11px] text-slate-400">Sumber: Master Ruangan (Location tipe IGD)</p>
          </div>
        </div>
        {!loading && !error && rooms.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">{tersedia} tersedia</span>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 ring-1 ring-rose-200">{terisi} terisi</span>
            {maintenance > 0 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 ring-1 ring-amber-200">{maintenance} maintenance</span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin" /> Memuat ruangan IGD…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs font-medium text-rose-600">
          <AlertCircle size={14} /> Gagal memuat ruangan IGD dari master.
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <DoorOpen size={22} className="text-slate-200" aria-hidden="true" />
          <p className="mt-1.5 text-xs font-medium text-slate-500">Belum ada ruangan IGD di master</p>
          <p className="text-[11px] text-slate-400">Tambahkan di Master → Ruangan (tipe IGD).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <div key={room.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-slate-800">{room.name}</p>
                  <p className="font-mono text-[10px] text-slate-400">{room.kode}</p>
                </div>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  Kapasitas {room.kapasitas}
                </span>
              </div>

              {room.beds.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {room.beds.map((bed) => {
                    // Bed aktif yang sedang dipakai → Terisi (rose). Selain itu pakai status master.
                    const isOccupied = bed.status === "active" && occ.has(bed.id);
                    const cfg = BED_STATUS_CFG[bed.status];
                    const cls = isOccupied
                      ? { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", label: "Terisi" }
                      : cfg;
                    return (
                      <span
                        key={bed.id}
                        title={`${bed.name} · ${cls.label}`}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                          cls.bg, cls.text, cls.ring,
                        )}
                      >
                        <BedDouble size={9} aria-hidden="true" />
                        {bed.kode}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <BedDouble size={11} aria-hidden="true" /> Tanpa bed terdaftar
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
