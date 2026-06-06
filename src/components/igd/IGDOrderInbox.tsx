"use client";

import { useState } from "react";
import { Inbox, Check, X, Loader2, BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationNode, BedSubRecord } from "@/components/master/ruangan/ruanganShared";
import PatientCard from "./PatientCard";
import type { IgdOrder } from "./igdBoardApi";

interface IGDOrderInboxProps {
  orders: IgdOrder[];
  /** Ruangan IGD master (untuk pilih bed saat Terima). */
  rooms: LocationNode[];
  /** Bed id yang sudah dipakai (exclude dari pilihan). */
  occupiedBedIds: Set<string>;
  /** id order yang sedang diproses (disable tombol). */
  pendingId: string | null;
  onTerima: (o: IgdOrder, bedId?: string) => void;
  onBatalkan: (o: IgdOrder) => void;
}

/**
 * Inbox order IGD belum diterima (Registered/Queued). Tiap order = PatientCard (desain sama) +
 * aksi Terima (pilih bed → Occupied) / Batalkan (→ Cancelled).
 */
export default function IGDOrderInbox({ orders, rooms, occupiedBedIds, pendingId, onTerima, onBatalkan }: IGDOrderInboxProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
          <Inbox size={14} className="text-amber-600" aria-hidden="true" />
        </span>
        <h2 className="text-sm font-bold text-slate-800">Order Masuk · Menunggu Diterima</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-white/60 py-8 text-center">
          <Inbox size={22} className="text-amber-300" aria-hidden="true" />
          <p className="mt-1.5 text-xs font-medium text-slate-500">Tidak ada order menunggu</p>
          <p className="text-[11px] text-slate-400">Order IGD baru dari pendaftaran akan muncul di sini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((o, i) => {
            const room = rooms.find((r) => r.id === o.ruanganId);
            const availableBeds = room
              ? room.beds.filter((b) => b.status === "active" && !occupiedBedIds.has(b.id))
              : [];
            return (
              <PatientCard
                key={o.id}
                patient={o.patient}
                index={i}
                actions={
                  <OrderActions
                    pending={pendingId === o.id}
                    roomName={room?.name ?? null}
                    availableBeds={availableBeds}
                    onTerima={(bedId) => onTerima(o, bedId)}
                    onBatalkan={() => onBatalkan(o)}
                  />
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Aksi per-order: Terima (pilih bed) / Batalkan (konfirmasi) ──
type Mode = "idle" | "terima" | "cancel";

function OrderActions({
  pending, roomName, availableBeds, onTerima, onBatalkan,
}: {
  pending: boolean;
  roomName: string | null;
  availableBeds: BedSubRecord[];
  onTerima: (bedId?: string) => void;
  onBatalkan: () => void;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [bedId, setBedId] = useState("");

  if (pending) {
    return (
      <div className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-500">
        <Loader2 size={13} className="animate-spin" /> Memproses…
      </div>
    );
  }

  if (mode === "cancel") {
    return (
      <div className="flex w-full items-center gap-2">
        <span className="flex-1 text-[11px] font-medium text-rose-600">Batalkan order ini?</span>
        <button type="button" onClick={onBatalkan} className="cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 active:scale-95">Ya</button>
        <button type="button" onClick={() => setMode("idle")} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Tidak</button>
      </div>
    );
  }

  if (mode === "terima") {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {availableBeds.length > 0 ? (
          <>
            <div className="flex items-center gap-1.5">
              <BedDouble size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
              <select
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                aria-label="Pilih bed"
              >
                <option value="">Pilih bed…</option>
                {availableBeds.map((b) => (
                  <option key={b.id} value={b.id}>{b.kode} — {b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!bedId}
                onClick={() => onTerima(bedId)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white transition active:scale-[0.98]",
                  bedId ? "cursor-pointer bg-emerald-600 hover:bg-emerald-700" : "cursor-not-allowed bg-slate-300",
                )}
              >
                <Check size={13} /> Terima
              </button>
              <button type="button" onClick={() => { setMode("idle"); setBedId(""); }} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Batal</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] text-amber-700">
              {roomName ? `Tak ada bed tersedia di ${roomName}.` : "Ruangan belum dipilih."} Terima tanpa bed?
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onTerima(undefined)} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]">
                <Check size={13} /> Terima tanpa bed
              </button>
              <button type="button" onClick={() => setMode("idle")} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Batal</button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <button
        type="button"
        onClick={() => setMode("terima")}
        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
      >
        <Check size={13} /> Terima
      </button>
      <button
        type="button"
        onClick={() => setMode("cancel")}
        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95"
      >
        <X size={13} /> Batalkan
      </button>
    </div>
  );
}
