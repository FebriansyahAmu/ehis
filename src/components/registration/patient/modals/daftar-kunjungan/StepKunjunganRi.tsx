"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { DoorOpen, BedDouble, Loader2, AlertCircle, LayoutGrid, X, Stethoscope, UserX, AlertTriangle, ShieldCheck, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs";
import { getTree } from "@/lib/api/ruangan";
import { listActiveBedAllocations, type BedAllocationDTO } from "@/lib/api/bedAllocation";
import { listDokter, type DokterListItemDTO } from "@/lib/api/dokter";
import type { LocationNode } from "@/components/master/ruangan/ruanganShared";
import { labelCls, type KunjunganForm, type SpriDpjpHint } from "./config";
import { BedMapModal } from "./BedMapModal";

// Normalisasi nama dokter untuk pencocokan SPRI ↔ pilihan (abaikan kapital/tanda/spasi).
const normName = (s: string): string => s.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
function namesMatch(a: string, b: string): boolean {
  const x = normName(a), y = normName(b);
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
}

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";
const RI_TYPES = new Set(["Rawat_Inap", "ICU", "HCU", "Isolasi"]);

/** Kelas efektif sebuah ruangan RI (RIKelas) — placement fisik untuk kunjungan.kelas. */
function roomKelas(r: LocationNode): string {
  if (r.locationType === "ICU") return "ICU";
  if (r.locationType === "HCU") return "HCU";
  if (r.locationType === "Isolasi") return "Isolasi";
  return r.kelas && r.kelas !== "—" ? r.kelas : "Kelas_3";
}

/**
 * Detail Rawat Inap: pilih ruangan (master Location tipe RI) + bed lewat PETA VISUAL (modal
 * fullscreen, bukan dropdown). Bed terpilih di-RESERVE saat pendaftaran (Kunjungan.bedId).
 */
export function StepKunjunganRi({
  form, setForm, spriDpjp,
}: {
  form: KunjunganForm;
  setForm: React.Dispatch<React.SetStateAction<KunjunganForm>>;
  /** DPJP yang ditetapkan SPRI → peringatan bila DPJP terpilih berbeda. */
  spriDpjp?: SpriDpjpHint;
}) {
  const [rooms, setRooms] = useState<LocationNode[]>([]);
  // bedId → alokasi aktif (untuk tandai terisi + nama pemakai di peta bed).
  const [allocByBed, setAllocByBed] = useState<Map<string, BedAllocationDTO>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showMap, setShowMap] = useState(false);
  // DPJP ter-assign ke ruangan terpilih (master.PenugasanRuangan), seperti IGD.
  const [dokter, setDokter] = useState<DokterListItemDTO[]>([]);
  const [dokterLoading, setDokterLoading] = useState(false);

  useEffect(() => {
    // State awal sudah loading=true/error=false → tak perlu set sinkron di sini (effect
    // jalan sekali saat mount; hindari cascading-render). Set hanya di callback async.
    const ctrl = new AbortController();
    let cancelled = false;
    Promise.all([getTree(ctrl.signal), listActiveBedAllocations(undefined, ctrl.signal)])
      .then(([tree, allocs]) => {
        if (cancelled) return;
        const ri = tree.filter(
          (n): n is LocationNode => n.type === "Location" && RI_TYPES.has((n as LocationNode).locationType),
        );
        setRooms(ri);
        setAllocByBed(new Map(allocs.map((a) => [a.bedId, a])));
      })
      .catch((e) => { if (!cancelled && !isAbort(e)) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; ctrl.abort(); };
  }, []);

  // Dokter ter-assign ke ruangan RI terpilih → daftar DPJP. Auto-pilih bila hanya satu.
  // Loading di-set di onPickRuangan (event handler), bukan sinkron di effect (anti
  // cascading-render). Tanpa ruangan → return (UI ter-guard `!form.ruanganId`).
  useEffect(() => {
    if (!form.ruanganId) return;
    const ctrl = new AbortController();
    let cancelled = false;
    listDokter({ locationId: form.ruanganId, status: "Aktif", limit: 50 }, ctrl.signal)
      .then(({ items }) => {
        if (cancelled) return;
        setDokter(items);
        if (items.length === 1) {
          setForm((f) => ({ ...f, dpjpId: items[0].id, dpjpNama: items[0].namaTampil }));
        }
      })
      .catch((e) => { if (!cancelled && !isAbort(e)) setDokter([]); })
      .finally(() => { if (!cancelled) setDokterLoading(false); });
    return () => { cancelled = true; ctrl.abort(); };
  }, [form.ruanganId, setForm]);

  const room = rooms.find((r) => r.id === form.ruanganId);
  const availableCount = useMemo(
    () => (room ? room.beds.filter((b) => b.status === "active" && !allocByBed.has(b.id)).length : 0),
    [room, allocByBed],
  );

  // Cocokkan DPJP terpilih dengan DPJP yang ditetapkan SPRI (peringatan, tidak memblokir).
  const expectedDpjp = spriDpjp?.nama?.trim();
  const selectedDpjp = form.dpjpNama?.trim();
  const dpjpMatchesSpri = !!(expectedDpjp && selectedDpjp && namesMatch(selectedDpjp, expectedDpjp));
  const dpjpMismatch = !!(expectedDpjp && selectedDpjp && !dpjpMatchesSpri);

  const onPickRuangan = (id: string) => {
    if (id === form.ruanganId) return; // pilih ruangan sama → no-op (jangan reset/stuck loading)
    const r = rooms.find((x) => x.id === id);
    // Ganti ruangan → reset bed + DPJP terpilih (daftar dokter & bed berubah). kelasKamar ikut
    // ruangan (placement fisik → kunjungan.kelas; basis cek titipan vs hak kelas).
    setForm((f) => ({ ...f, ruanganId: id, ruanganNama: r?.name ?? "", kelasKamar: r ? roomKelas(r) : "", bedId: "", bedNama: "", dpjpId: "", dpjpNama: "" }));
    setDokter([]);          // buang dokter ruangan lama (hindari flash stale)
    setDokterLoading(true); // tampilkan loading sampai fetch effect selesai
  };
  const onPickDokter = (id: string) => {
    const d = dokter.find((x) => x.id === id);
    setForm((f) => ({ ...f, dpjpId: id, dpjpNama: d?.namaTampil ?? "" }));
  };

  return (
    <>
      {/* Ruangan RI */}
      <div>
        <label className={labelCls}>Ruangan Rawat Inap</label>
        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Memuat ruangan…
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">
            <AlertCircle size={13} /> Gagal memuat ruangan rawat inap.
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
            <AlertCircle size={13} /> Belum ada ruangan rawat inap di master.
          </div>
        ) : (
          <Select
            value={form.ruanganId}
            onChange={onPickRuangan}
            options={rooms.map((r) => ({ value: r.id, label: `${r.name} · ${r.kode}` }))}
            icon={DoorOpen}
            placeholder="Pilih ruangan…"
          />
        )}
      </div>

      {/* Bed — reservasi via peta visual */}
      <div>
        <label className={labelCls}>Bed (di-reserve saat daftar)</label>
        {!form.ruanganId ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-400">
            Pilih ruangan dulu untuk membuka peta bed.
          </div>
        ) : (
          <>
            <div className="flex items-stretch gap-2">
              {/* Nomor reservasi (bed terpilih) — read-only, diisi dari peta */}
              <div className="relative flex-1">
                <BedDouble size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  readOnly
                  value={form.bedNama ? `Bed ${form.bedNama}` : ""}
                  placeholder="Belum ada bed di-reserve…"
                  onClick={() => setShowMap(true)}
                  className={cnInput(!!form.bedNama)}
                />
                {form.bedId && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, bedId: "", bedNama: "" }))}
                    aria-label="Hapus bed terpilih"
                    className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              {/* Tombol Reservasi → buka peta bed fullscreen */}
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
              >
                <LayoutGrid size={14} /> Reservasi
              </button>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
              <BedDouble size={10} />
              {availableCount} bed tersedia di {room?.name ?? "ruangan ini"} · ketuk Reservasi untuk peta bed
            </p>
          </>
        )}
      </div>

      {/* DPJP — dokter ter-assign ke ruangan RI terpilih (search dropdown) */}
      <div>
        <label className={labelCls}>Dokter Penanggung Jawab (DPJP)</label>
        {!form.ruanganId ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-400">
            Pilih ruangan dulu untuk melihat dokter yang bertugas.
          </div>
        ) : dokterLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Memuat dokter ruangan…
          </div>
        ) : dokter.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
            <UserX size={13} className="mt-px shrink-0" />
            <span>Belum ada dokter ditugaskan ke ruangan ini. Atur di Master → Mapping Hub → SDM Assignment.</span>
          </div>
        ) : (
          <>
            <Select
              value={form.dpjpId}
              onChange={onPickDokter}
              options={dokter.map((d) => ({ value: d.id, label: `${d.namaTampil} — ${d.spesialisLabel}` }))}
              icon={Stethoscope}
              searchable
              placeholder="Cari & pilih DPJP…"
            />
            <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
              <Stethoscope size={10} />
              {dokter.length} dokter bertugas di ruangan ini
            </p>
          </>
        )}

        {/* Peringatan / konfirmasi kecocokan DPJP terhadap SPRI (admisi RI dari worklist) */}
        {expectedDpjp && (
          <div
            className={cn(
              "mt-2 flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[11px]",
              dpjpMismatch
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : dpjpMatchesSpri
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500",
            )}
          >
            {dpjpMismatch ? (
              <AlertTriangle size={13} className="mt-px shrink-0 text-amber-500" />
            ) : dpjpMatchesSpri ? (
              <ShieldCheck size={13} className="mt-px shrink-0 text-emerald-500" />
            ) : (
              <ClipboardList size={13} className="mt-px shrink-0 text-slate-400" />
            )}
            <div className="min-w-0">
              {dpjpMismatch ? (
                <p className="font-semibold">
                  DPJP berbeda dari SPRI
                </p>
              ) : dpjpMatchesSpri ? (
                <p className="font-semibold">DPJP sesuai SPRI</p>
              ) : (
                <p className="font-semibold text-slate-600">DPJP ditetapkan SPRI</p>
              )}
              <p className="mt-0.5 leading-snug">
                SPRI menetapkan{" "}
                <span className="font-semibold">{expectedDpjp}</span>
                {spriDpjp?.smf ? <span className="text-slate-400"> · SMF {spriDpjp.smf}</span> : null}
                {dpjpMismatch && (
                  <> — Anda memilih <span className="font-semibold">{selectedDpjp}</span>. Pastikan perubahan DPJP ini disengaja.</>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AnimatePresence → exit (fade backdrop + scale panel) main saat tutup. */}
      <AnimatePresence>
        {showMap && room && (
          <BedMapModal
            key="bedmap"
            room={room}
            allocByBed={allocByBed}
            selectedBedId={form.bedId}
            onSelect={(bed) => setForm((f) => ({ ...f, bedId: bed.id, bedNama: bed.kode }))}
            onClose={() => setShowMap(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function cnInput(filled: boolean): string {
  return [
    "w-full cursor-pointer rounded-lg border bg-white py-2 pl-8 pr-8 text-xs outline-none transition hover:border-slate-300",
    filled ? "border-emerald-300 font-semibold text-emerald-700" : "border-slate-200 text-slate-700",
  ].join(" ");
}
