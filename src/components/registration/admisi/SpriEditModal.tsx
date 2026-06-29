"use client";

// Modal Revisi SPRI — edit konten SPRI (DPJP/tgl rencana/jenis/indikasi/keterangan). Submit →
// PATCH /spri/:id → server kirim RencanaKontrol/UpdateSPRI ke BPJS (bila sudah ada No. Referensi)
// lalu perbarui field lokal. WS gagal → tetap di modal + toast error (mirror pola SEP).
// Juga: SpriCancelDialog (Batalkan SPRI → DELETE /spri/:id → RencanaKontrol/Delete + status Batal).

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  X, Loader2, FilePen, Stethoscope, CalendarDays, BedDouble, ClipboardList, Ban, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { DatePicker, Select, type SelectOption } from "@/components/shared/inputs";
import { listDokter, type DokterListItemDTO } from "@/lib/api/dokter";
import { editSpri, cancelSpri, type SpriDTO, type EditSpriInput } from "@/lib/api/spri/spri";

const JENIS_OPTS: EditSpriInput["jenisPerawatan"][] = [
  "Perawatan Biasa", "Perawatan Intensif", "Isolasi", "HCU", "ICU",
];

const labelCls = "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400";
const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

function spriRejectOf(e: unknown): { code: string; message: string } | undefined {
  if (e instanceof ApiError) return (e.details as { spriReject?: { code: string; message: string } } | undefined)?.spriReject;
  return undefined;
}

export function SpriEditModal({ spri, onClose, onSaved }: { spri: SpriDTO; onClose: () => void; onSaved: () => void }) {
  const reduce = useReducedMotion();
  const [dokter, setDokter] = useState<DokterListItemDTO[]>([]);
  const [tgl, setTgl] = useState(spri.tglRencanaRawat);
  const [dpjpId, setDpjpId] = useState(spri.dpjpPegawaiId ?? "");
  const [dpjpNama, setDpjpNama] = useState(spri.dpjpNama);
  const [smf, setSmf] = useState(spri.smfSpesialistik ?? "");
  const [jenis, setJenis] = useState<EditSpriInput["jenisPerawatan"]>(
    (JENIS_OPTS.find((j) => j === spri.jenisPerawatan) ?? "Perawatan Biasa"),
  );
  const [indikasi, setIndikasi] = useState(spri.indikasi);
  const [keterangan, setKeterangan] = useState(spri.keterangan ?? "");
  const [busy, setBusy] = useState(false);

  const dpjpOptions = useMemo<SelectOption[]>(
    () => dokter.map((d) => ({ value: d.id, label: d.spesialisLabel ? `${d.namaTampil} · ${d.spesialisLabel}` : d.namaTampil })),
    [dokter],
  );

  useEffect(() => {
    const ac = new AbortController();
    listDokter({ status: "Aktif", limit: 200 }, ac.signal)
      .then((r) => setDokter(r.items))
      .catch(() => { /* dropdown DPJP opsional → fallback nama saat ini */ });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { ac.abort(); document.removeEventListener("keydown", onKey); };
  }, [busy, onClose]);

  function onPickDpjp(id: string) {
    setDpjpId(id);
    const d = dokter.find((x) => x.id === id);
    if (d) { setDpjpNama(d.namaTampil); setSmf(d.spesialisLabel ?? ""); }
  }

  async function submit() {
    if (busy) return;
    if (!indikasi.trim()) { toast.error("Indikasi wajib diisi"); return; }
    setBusy(true);
    try {
      const input: EditSpriInput = {
        dpjpNama: dpjpNama.trim() || spri.dpjpNama,
        dpjpPegawaiId: dpjpId || undefined,
        smfSpesialistik: smf.trim() || undefined,
        poliKode: spri.poliKode ?? undefined,
        poliNama: spri.poliNama ?? undefined,
        tglRencanaRawat: tgl,
        jenisPerawatan: jenis,
        indikasi: indikasi.trim(),
        keterangan: keterangan.trim() || undefined,
        version: spri.version,
      };
      await editSpri(spri.id, input);
      toast.success("SPRI diperbarui", spri.namaPasien);
      onSaved();
    } catch (e) {
      const sr = spriRejectOf(e);
      toast.error("Gagal memperbarui SPRI", sr ? `BPJS ${sr.code}: ${sr.message}` : e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.96, y: 14 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: 8 } };

  if (typeof document === "undefined") return null;
  // z-50: sejajar konvensi modal app supaya popover picker (DatePicker/Select, zIndex 60 via portal)
  // tampil DI ATAS modal, bukan di belakangnya.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
        onClick={() => !busy && onClose()}
      />
      <motion.div
        role="dialog" aria-modal="true" aria-label="Revisi SPRI"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} {...card}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-teal-50 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-teal-200">
            <FilePen size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-teal-800">Revisi SPRI</p>
            <p className="truncate text-[11px] text-teal-600">
              {spri.namaPasien} · RM {spri.noRM}
              {spri.noReferensi ? <> · Ref {spri.noReferensi}</> : <> · belum ada No. Ref</>}
            </p>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Tutup"
            className="rounded-lg p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 disabled:opacity-40">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {spri.noReferensi && (
            <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-700">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-sky-500" />
              Perubahan akan dikirim ke BPJS (RencanaKontrol/UpdateSPRI) sebelum disimpan.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}><CalendarDays size={10} className="mr-1 inline" />Tgl Rencana Rawat</label>
              <DatePicker value={tgl} onChange={setTgl} clearable={false} placeholder="Pilih tanggal" />
            </div>
            <div>
              <label className={labelCls}><BedDouble size={10} className="mr-1 inline" />Jenis Perawatan</label>
              <Select
                value={jenis}
                onChange={(v) => setJenis(v as EditSpriInput["jenisPerawatan"])}
                options={JENIS_OPTS}
                icon={BedDouble}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}><Stethoscope size={10} className="mr-1 inline" />DPJP</label>
            <Select
              value={dpjpId}
              onChange={onPickDpjp}
              options={dpjpOptions}
              icon={Stethoscope}
              searchable
              placeholder={`${spri.dpjpNama} (saat ini)`}
            />
            {smf && <p className="mt-1 text-[10px] text-slate-400">SMF: {smf}</p>}
          </div>

          <div>
            <label className={labelCls}><ClipboardList size={10} className="mr-1 inline" />Indikasi Rawat Inap</label>
            <textarea value={indikasi} onChange={(e) => setIndikasi(e.target.value)} rows={2}
              className={cn(inputCls, "resize-none")} placeholder="Indikasi medis rawat inap…" />
          </div>
          <div>
            <label className={labelCls}>Keterangan (opsional)</label>
            <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={2}
              className={cn(inputCls, "resize-none")} placeholder="Catatan tambahan…" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50">
            Batal
          </button>
          <button onClick={submit} disabled={busy}
            className={cn("flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition active:scale-95",
              busy ? "cursor-not-allowed bg-teal-400" : "bg-teal-600 hover:bg-teal-700")}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <FilePen size={14} />}
            {busy ? "Menyimpan…" : "Simpan Revisi"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

// ── Konfirmasi Batalkan SPRI ──────────────────────────────────────────────────────
export function SpriCancelDialog({ spri, onClose, onCancelled }: { spri: SpriDTO; onClose: () => void; onCancelled: () => void }) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [busy, onClose]);

  async function doCancel() {
    if (busy) return;
    setBusy(true);
    try {
      await cancelSpri(spri.id);
      toast.success("SPRI dibatalkan", spri.namaPasien);
      onCancelled();
    } catch (e) {
      const sr = spriRejectOf(e);
      toast.error("Gagal membatalkan SPRI", sr ? `BPJS ${sr.code}: ${sr.message}` : e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.92, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 8 } };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
        onClick={() => !busy && onClose()} />
      <motion.div role="dialog" aria-modal="true" aria-label="Batalkan SPRI"
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} {...card}>
        <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-rose-200">
            <Ban size={17} className="text-rose-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-rose-700">Batalkan SPRI?</p>
            <p className="text-[11px] text-rose-400">{spri.noReferensi ? "Pembatalan dikirim ke BPJS (Delete)" : "SPRI belum ber-No. Ref"}</p>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Tutup"
            className="rounded-lg p-1 text-rose-300 transition hover:bg-rose-100 hover:text-rose-500 disabled:opacity-40">
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="truncate text-[13px] font-bold text-slate-800">{spri.namaPasien}</p>
            <p className="font-mono text-[10px] text-slate-400">RM {spri.noRM} · {spri.noKunjungan}</p>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
            SPRI ini akan <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600 ring-1 ring-rose-100">dibatalkan</span>
            {spri.noReferensi ? <> dan dihapus di BPJS</> : null}. SPRI hilang dari worklist admisi.
          </p>
        </div>
        <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
          <button ref={cancelRef} onClick={onClose} disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50">
            Tidak
          </button>
          <button onClick={doCancel} disabled={busy}
            className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm transition active:scale-95",
              busy ? "cursor-not-allowed bg-rose-400" : "bg-rose-600 hover:bg-rose-700")}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={13} />}
            {busy ? "Membatalkan…" : "Ya, Batalkan SPRI"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
