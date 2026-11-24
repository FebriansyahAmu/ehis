"use client";

// Form ajukan mutasi: ruangan + bed tujuan (peta) → alasan → "Reservasi bed". Validasi saat submit
// (fokus ke field pertama yang bermasalah); tombol hanya nonaktif saat sedang mengirim.

import { useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, BedDouble, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { AutoTextarea } from "../cppt/AutoTextarea";
import type { AjukanMutasiInput, LokasiDTO, MutasiRoomDTO } from "@/lib/api/mutasi";
import { BedPicker } from "./BedPicker";
import { ALASAN_PRESET, BTN, isRiRoomType, kelasLabel, lokasiLabel } from "./mutasiUi";

type Errors = Partial<Record<"room" | "bed" | "alasan", string>>;

export function AjukanMutasiForm({
  rooms, lokasi, unit, busy, onSubmit,
}: {
  rooms: MutasiRoomDTO[];
  lokasi: LokasiDTO;
  /** Unit kunjungan ("IGD" | "RawatInap"). */
  unit: string;
  busy: boolean;
  onSubmit: (input: AjukanMutasiInput) => void;
}) {
  const uid = useId();
  const [roomId, setRoomId] = useState("");
  const [bedId, setBedId] = useState("");
  const [alasan, setAlasan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [attempted, setAttempted] = useState(false);
  const bedRef = useRef<HTMLInputElement | null>(null);
  const alasanRef = useRef<HTMLInputElement>(null);
  const roomWrap = useRef<HTMLDivElement>(null);

  const room = rooms.find((r) => r.id === roomId);
  const bed = room?.beds.find((b) => b.id === bedId);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!room) e.room = "Pilih ruangan tujuan.";
    else if (room.beds.length > 0 && !bed) {
      e.bed = room.tersedia > 0 ? "Pilih bed kosong di ruangan tujuan." : "Tidak ada bed kosong — pilih ruangan lain.";
    } else if (room.beds.length === 0 && room.id === lokasi.ruanganId) {
      e.room = "Pasien sudah berada di ruangan ini.";
    }
    if (alasan.trim().length < 3) e.alasan = "Tuliskan alasan mutasi.";
    return e;
  };
  const errors: Errors = attempted ? validate() : {};

  const submit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (busy) return;
    const e = validate();
    if (e.room || e.bed || e.alasan) {
      setAttempted(true);
      if (e.room) roomWrap.current?.querySelector<HTMLButtonElement>("button")?.focus();
      else if (e.bed) bedRef.current?.focus();
      else alasanRef.current?.focus();
      return;
    }
    setAttempted(false);
    onSubmit({ keRuanganId: roomId, keBedId: bedId || undefined, alasan: alasan.trim(), catatan: catatan.trim() || undefined });
  };

  // Kelas hanya berarti untuk kunjungan RI (tagihan akomodasi). IGD → ruang RI = penempatan saja.
  const kelasBerubah = unit === "RawatInap" && !!room?.kelas && !!lokasi.kelas && room.kelas !== lokasi.kelas;
  const igdKeRanap = unit === "IGD" && !!room && isRiRoomType(room.locationType);

  return (
    <form noValidate onSubmit={submit} aria-labelledby={`${uid}-title`} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 sm:px-5">
        <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <BedDouble className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 id={`${uid}-title`} className="m-sm font-semibold text-slate-900">Ajukan mutasi</h3>
          <p className="m-tiny text-slate-500">Bed tujuan direservasi dulu — bed asal dilepas saat pasien dikonfirmasi pindah.</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <div ref={roomWrap}>
          <BedPicker
            rooms={rooms}
            roomId={roomId}
            bedId={bedId}
            onRoom={(id) => { setRoomId(id); setBedId(""); }}
            onBed={setBedId}
            roomError={errors.room}
            bedError={errors.bed}
            bedRef={(el) => { bedRef.current = el; }}
          />
          {igdKeRanap && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 px-3.5 py-2.5 m-xs text-sky-950 ring-1 ring-inset ring-sky-200">
              <Info className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden="true" />
              <span>
                Pasien hanya <b className="font-semibold">dipindahkan tempatnya</b> — kunjungan tetap IGD dan belum masuk sensus
                rawat inap. Admisi rawat inap tetap lewat SPRI; bed ini dilepas saat kunjungan IGD diselesaikan sehingga dapat
                direservasi admisi.
              </span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${uid}-alasan`} className="mb-1.5 block m-xs font-medium text-slate-700">
            Alasan mutasi <span aria-hidden="true" className="text-rose-600">*</span>
          </label>
          <input
            ref={alasanRef}
            id={`${uid}-alasan`}
            name="alasan"
            type="text"
            required
            maxLength={300}
            autoComplete="off"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            aria-invalid={!!errors.alasan || undefined}
            aria-describedby={`${uid}-alasan-hint${errors.alasan ? ` ${uid}-alasan-err` : ""}`}
            className={cn(
              "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 transition sm:text-sm",
              "placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky-500/15",
              "aria-invalid:border-rose-500",
            )}
          />
          <p id={`${uid}-alasan-hint`} className="mt-1 m-tiny text-slate-500">Pilih cepat:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {ALASAN_PRESET.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAlasan(a)}
                aria-pressed={alasan === a}
                className={cn(
                  "rounded-full border px-2.5 py-1 m-tiny font-medium transition focus-visible:outline-2 focus-visible:outline-sky-600",
                  alasan === a ? "border-sky-400 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {a}
              </button>
            ))}
          </div>
          {errors.alasan && <p id={`${uid}-alasan-err`} className="mt-1 m-xs font-medium text-rose-700">{errors.alasan}</p>}
        </div>

        <div>
          <label htmlFor={`${uid}-catatan`} className="mb-1.5 flex items-baseline gap-1.5 m-xs font-medium text-slate-700">
            Catatan <span className="m-tiny font-normal text-slate-500">(opsional)</span>
          </label>
          <AutoTextarea
            id={`${uid}-catatan`}
            name="catatan"
            value={catatan}
            maxLength={1000}
            onChange={(e) => setCatatan(e.target.value)}
            className="min-h-[calc(2lh+1rem)] max-h-60 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base leading-relaxed text-slate-900 transition hover:border-slate-400 focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky-500/15 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
        <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 m-xs text-slate-600">
          <span className="truncate font-medium text-slate-800">{lokasiLabel(lokasi)}</span>
          <ArrowRight className="size-3.5 shrink-0 text-slate-400" role="img" aria-label="ke" />
          <span className={cn("truncate font-semibold", room ? "text-sky-800" : "text-slate-400")}>
            {room ? `${room.nama}${bed ? ` · Bed ${bed.kode}` : ""}` : "pilih tujuan"}
          </span>
          {kelasBerubah && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 m-tiny font-semibold text-amber-900">
              Kelas {kelasLabel(lokasi.kelas)} → {kelasLabel(room?.kelas)}
            </span>
          )}
        </p>
        <button
          type="submit"
          disabled={busy}
          className={cn(BTN, "shrink-0 self-end bg-sky-600 text-white shadow-sm hover:bg-sky-700 focus-visible:outline-sky-600 sm:self-auto")}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <BedDouble className="size-3.5" aria-hidden="true" />}
          {busy ? "Mereservasi…" : "Reservasi bed"}
        </button>
      </div>
    </form>
  );
}
