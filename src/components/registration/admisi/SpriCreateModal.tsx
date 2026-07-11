"use client";

// Modal "Buat SPRI Baru" — worklist Admisi Registrasi. Petugas menerbitkan SPRI (Surat Perintah
// Rawat Inap) untuk pasien yang perlu rawat inap TERENCANA (bukan dari IGD). Form penerbitan =
// KOMPONEN SAMA dengan IGD ([SPRIPanel]) → tampilan persis identik; modal hanya menambah pemilihan
// pasien + kunjungan sumber (konteks yang di IGD sudah implisit). SPRI ditautkan ke KUNJUNGAN
// SUMBER (poliklinik/RJ). Submit → POST /api/v1/spri → server terbitkan No. Referensi (mock BPJS)
// + simpan → kartu muncul di worklist. No. Kartu di-resolusi server dari penjamin (anti-spoof).

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  X, Loader2, BedDouble, Search, User, ChevronRight, FileStack, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, type SelectOption } from "@/components/shared/inputs";
import { searchPatients, type PatientDTO } from "@/lib/api/patients";
import { listKunjungan, type KunjunganListItemDTO } from "@/lib/api/kunjungan";
import { createSpri, type CreateSpriInput } from "@/lib/api/spri/spri";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import type { SpriInput } from "@/lib/schemas/disposisi/disposisi";
import type { PulangPatient } from "@/components/igd/tabs/pasienPulang/pasienPulangShared";
import SpriIssuePanel from "@/components/shared/spri/SpriIssuePanel";

const UNIT_LABEL: Record<string, string> = {
  RawatJalan: "Rawat Jalan", IGD: "IGD", RawatInap: "Rawat Inap",
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

/** No. Kartu BPJS ter-mask untuk display peserta (SPRIPanel). Server tetap resolusi nilai penuh. */
function bpjsNomorMasked(p: PatientDTO): string | undefined {
  const bp = p.penjamin.find((x) => x.tipe === "BPJS_Non_PBI" || x.tipe === "BPJS_PBI");
  return bp?.nomorMasked ?? undefined;
}

export default function SpriCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const reduce = useReducedMotion();

  // ── Step 1: pasien + kunjungan sumber ──
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<PatientDTO | null>(null);

  const [kunjungan, setKunjungan] = useState<KunjunganListItemDTO[]>([]);
  const [kunjunganLoading, setKunjunganLoading] = useState(false);
  const [sourceId, setSourceId] = useState("");

  // ── Step 2: form SPRI (dikelola SpriIssuePanel/SPRIPanel — komponen IGD; emit SpriInput) ──
  const [spriForm, setSpriForm] = useState<SpriInput | null>(null);
  const [busy, setBusy] = useState(false);

  // Escape → tutup.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  // Cari pasien (debounce 300ms) — hanya saat belum ada pasien terpilih.
  useEffect(() => {
    const q = query.trim();
    if (patient || q.length < 2) { setResults([]); return; }
    const ac = new AbortController();
    setSearching(true);
    const t = setTimeout(() => {
      const by = /^\d+$/.test(q) ? "rm" : "nama";
      searchPatients({ q, by, limit: 8 }, ac.signal)
        .then((r) => setResults(r.items))
        .catch(() => { /* abaikan */ })
        .finally(() => setSearching(false));
    }, 300);
    return () => { ac.abort(); clearTimeout(t); };
  }, [query, patient]);

  // Pilih pasien → muat kunjungan sumber (semua status; terbaru dulu).
  function onPickPatient(p: PatientDTO) {
    setPatient(p);
    setResults([]);
    setQuery("");
    setKunjunganLoading(true);
    setSourceId("");
    listKunjungan({ patientId: p.id, limit: 15 })
      .then(({ items }) => {
        setKunjungan(items);
        if (items.length > 0) setSourceId(items[0].id); // default = kunjungan terbaru
      })
      .catch(() => setKunjungan([]))
      .finally(() => setKunjunganLoading(false));
  }

  function resetPatient() {
    setPatient(null);
    setKunjungan([]);
    setSourceId("");
    setSpriForm(null);
  }

  const kunjunganOptions = useMemo<SelectOption[]>(
    () => kunjungan.map((k) => ({
      value: k.id,
      label: `${k.noKunjungan} · ${UNIT_LABEL[k.unit] ?? k.unit}${k.poli ? ` · ${k.poli}` : ""} · ${fmtDateTime(k.waktuKunjungan)}`,
    })),
    [kunjungan],
  );

  // Pasien sempit untuk SPRIPanel (hanya `doctor` + `noBpjs` yang dipakai; sisanya placeholder).
  const pulangPatient = useMemo<PulangPatient | null>(() => {
    if (!patient) return null;
    const src = kunjungan.find((k) => k.id === sourceId) ?? null;
    return {
      id: patient.id,
      noRM: patient.noRm,
      noKunjungan: src?.noKunjungan ?? "",
      name: patient.nama,
      age: patient.umur ?? 0,
      gender: patient.gender,
      doctor: "",
      diagnosa: [],
      tglKunjungan: src?.waktuKunjungan?.slice(0, 10) ?? "",
      arrivalTime: "",
      noBpjs: bpjsNomorMasked(patient),
      namaKeluarga: "",
      hubunganKeluarga: "",
      noHp: patient.noHp ?? "",
    };
  }, [patient, kunjungan, sourceId]);

  const canSubmit = !!patient && !!sourceId && !!spriForm && !busy;

  async function submit() {
    if (!canSubmit || !spriForm) return;
    setBusy(true);
    try {
      const input: CreateSpriInput = {
        ...spriForm,
        kunjunganId: sourceId,
        noKartu: "", // server-authoritative (resolusi dari penjamin pasien)
      };
      const dto = await createSpri(input);
      toast.success(
        "SPRI diterbitkan",
        dto.noReferensi ? `No. Ref ${dto.noReferensi}` : "Menunggu No. Referensi BPJS",
      );
      onCreated();
    } catch (e) {
      toast.error("Gagal menerbitkan SPRI", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  const card = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.96, y: 14 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: 8 } };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
        onClick={() => !busy && onClose()}
      />
      <motion.div
        role="dialog" aria-modal="true" aria-label="Buat SPRI Baru"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} {...card}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-teal-50 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-teal-200">
            <BedDouble size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-teal-800">Buat SPRI Baru</p>
            <p className="truncate text-[11px] text-teal-600">Surat Perintah Rawat Inap — admisi terencana</p>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Tutup"
            className="rounded-lg p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 disabled:opacity-40">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* ── 1. Pasien ── */}
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <User size={12} className="text-teal-500" /> 1 · Pasien
            </p>
            {patient ? (
              <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[10px] font-black text-teal-700">
                  {patient.nama.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-800">{patient.nama}</p>
                  <p className="font-mono text-[10px] text-slate-400">
                    RM {patient.noRm} · {patient.gender === "L" ? "♂" : "♀"}
                    {patient.umur != null && ` · ${patient.umur} th`}
                  </p>
                </div>
                <button onClick={resetPatient} disabled={busy}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40">
                  Ganti
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari pasien — nama / No. RM…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                {searching && <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-teal-500" />}
                {results.length > 0 && (
                  <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="max-h-56 divide-y divide-slate-50 overflow-y-auto">
                      {results.map((p) => (
                        <button
                          key={p.id} onClick={() => onPickPatient(p)}
                          className="group flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-teal-50/60"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-700">
                            {p.nama.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-700">{p.nama}</p>
                            <p className="font-mono text-[10px] text-slate-400">RM {p.noRm}</p>
                          </div>
                          <ChevronRight size={13} className="shrink-0 text-slate-300 group-hover:text-teal-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {query.trim().length >= 2 && !searching && results.length === 0 && (
                  <p className="mt-1.5 px-1 text-[11px] text-slate-400">Tidak ada pasien cocok.</p>
                )}
              </div>
            )}
          </section>

          {patient && (
            <>
              {/* ── 2. Kunjungan sumber ── */}
              <section>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <FileStack size={12} className="text-teal-500" /> 2 · Kunjungan Sumber
                </p>
                {kunjunganLoading ? (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-400">
                    <Loader2 size={13} className="animate-spin text-teal-500" /> Memuat kunjungan pasien…
                  </div>
                ) : kunjungan.length === 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                    <p className="text-[11px] leading-snug text-amber-700">
                      Pasien belum memiliki kunjungan. Daftarkan kunjungan (poliklinik) lebih dulu, lalu terbitkan SPRI dari sana.
                    </p>
                  </div>
                ) : (
                  <>
                    <Select
                      value={sourceId} onChange={setSourceId} options={kunjunganOptions}
                      icon={FileStack} searchable placeholder="— Pilih kunjungan asal —"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      SPRI ditautkan ke kunjungan ini (sumber provenance &amp; diagnosa awal SEP rawat inap).
                    </p>
                  </>
                )}
              </section>

              {/* ── 3. Penerbitan SPRI — form IDENTIK IGD (SPRIPanel via SpriIssuePanel) ── */}
              {kunjungan.length > 0 && pulangPatient && (
                <SpriIssuePanel
                  key={patient.id}
                  patient={pulangPatient}
                  dpjpScope="loket"
                  onChange={setSpriForm}
                  submitHint={
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Info size={11} className="shrink-0" />
                      SPRI terbit saat menekan <span className="font-semibold text-slate-500">Terbitkan SPRI</span>.
                    </p>
                  }
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50">
            Batal
          </button>
          <button onClick={submit} disabled={!canSubmit}
            className={cn("flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition active:scale-95",
              canSubmit ? "bg-teal-600 hover:bg-teal-700" : "cursor-not-allowed bg-slate-300")}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {busy ? "Menerbitkan…" : "Terbitkan SPRI"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
