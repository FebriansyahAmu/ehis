"use client";

// Pilih ruangan tujuan + bed lewat peta (gaya reservasi bed admisi RI). Bed = radio native dalam
// <fieldset>: hanya bed KOSONG yang bisa dipilih (lainnya disabled → tak masuk urutan Tab); status
// tiap bed tertulis (bukan warna saja) + nama pasien pemakai.

import { useId, useMemo, useState } from "react";
import { BedSingle, Check, DoorOpen, Info } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Select } from "@/components/shared/inputs";
import type { MutasiRoomDTO } from "@/lib/api/mutasi";
import { BED_STATE, LOCATION_TYPE_LABEL, kelasLabel } from "./mutasiUi";

export function BedPicker({
  rooms, roomId, bedId, onRoom, onBed, roomError, bedError, bedRef,
}: {
  rooms: MutasiRoomDTO[];
  roomId: string;
  bedId: string;
  onRoom: (id: string) => void;
  onBed: (id: string) => void;
  roomError?: string;
  bedError?: string;
  /** Radio bed pertama yang bisa dipilih — target fokus saat validasi gagal. */
  bedRef?: (el: HTMLInputElement | null) => void;
}) {
  const uid = useId();
  const [onlyFree, setOnlyFree] = useState(false);
  const room = rooms.find((r) => r.id === roomId);
  const beds = useMemo(
    () => (room ? (onlyFree ? room.beds.filter((b) => b.state === "available") : room.beds) : []),
    [room, onlyFree],
  );
  const firstFreeId = beds.find((b) => b.state === "available")?.id;
  // Jenis ruangan campur (mis. IGD + rawat inap) → cantumkan jenis di label pilihan.
  const mixed = new Set(rooms.map((r) => r.locationType)).size > 1;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor={`${uid}-room`} className="mb-1.5 block m-xs font-medium text-slate-700">
          Ruangan tujuan <span aria-hidden="true" className="text-rose-600">*</span>
        </label>
        <Select
          id={`${uid}-room`}
          value={roomId}
          onChange={onRoom}
          icon={DoorOpen}
          placeholder="Pilih ruangan…"
          options={rooms.map((r) => ({
            value: r.id,
            label: [
              mixed ? `[${LOCATION_TYPE_LABEL[r.locationType] ?? r.locationType}]` : null,
              r.nama,
              r.kelas && r.locationType === "Rawat_Inap" ? kelasLabel(r.kelas) : null,
              r.beds.length ? `${r.tersedia} bed kosong` : "tanpa bed",
            ].filter(Boolean).join(" · "),
          }))}
        />
        {roomError && <p id={`${uid}-room-err`} role="alert" className="mt-1 m-xs font-medium text-rose-700">{roomError}</p>}
      </div>

      {room && (
        <fieldset className="min-w-0" aria-describedby={bedError ? `${uid}-bed-err` : undefined}>
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <legend className="m-xs font-medium text-slate-700">
              Bed tujuan {room.beds.length > 0 && <span aria-hidden="true" className="text-rose-600">*</span>}
            </legend>
            {room.beds.length > 0 && (
              <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 m-tiny text-slate-600">
                <input
                  type="checkbox"
                  checked={onlyFree}
                  onChange={(e) => setOnlyFree(e.target.checked)}
                  className="size-3.5 accent-emerald-600"
                />
                Hanya bed kosong
              </label>
            )}
          </div>

          {room.beds.length === 0 ? (
            <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 m-xs text-slate-600 ring-1 ring-inset ring-slate-200">
              <Info className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
              Ruangan ini tidak memiliki bed terdaftar — pasien dipindah ke ruangan saja.
            </p>
          ) : beds.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center m-xs text-slate-500">
              Tidak ada bed kosong di ruangan ini.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {beds.map((b) => {
                const s = BED_STATE[b.state];
                const free = b.state === "available";
                const on = bedId === b.id;
                return (
                  <label
                    key={b.id}
                    className={cn(
                      "relative flex min-h-16 flex-col justify-between gap-1 rounded-xl border-2 px-3 py-2 transition-[border-color,box-shadow,background-color]",
                      free ? "cursor-pointer" : "cursor-not-allowed",
                      "has-focus-visible:ring-2 has-focus-visible:ring-sky-600 has-focus-visible:ring-offset-1",
                      on ? "border-emerald-600 bg-emerald-100 text-emerald-950 shadow-sm" : s.card,
                    )}
                  >
                    <input
                      ref={b.id === firstFreeId ? bedRef : undefined}
                      type="radio"
                      name={`${uid}-bed`}
                      value={b.id}
                      checked={on}
                      disabled={!free}
                      onChange={() => onBed(b.id)}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between gap-1.5">
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <BedSingle className="size-4 shrink-0" aria-hidden="true" />
                        <span className="truncate m-sm font-bold tabular-nums">{b.kode}</span>
                      </span>
                      {on ? (
                        <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      ) : (
                        <span aria-hidden="true" className={cn("size-2 rounded-full", s.dot)} />
                      )}
                    </span>
                    <span className="truncate m-tiny">
                      {on ? "Dipilih" : s.label}
                      {b.pasienNama && <span className="font-semibold"> · {b.pasienNama}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {bedError && <p id={`${uid}-bed-err`} className="mt-1.5 m-xs font-medium text-rose-700">{bedError}</p>}

          {room.beds.length > 0 && (
            <ul aria-label="Keterangan warna bed" className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 m-tiny text-slate-600">
              {(["available", "occupied", "reserved", "current", "unavailable"] as const).map((k) => (
                <li key={k} className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className={cn("size-2 rounded-full", BED_STATE[k].dot)} />
                  {BED_STATE[k].label}
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}
    </div>
  );
}
