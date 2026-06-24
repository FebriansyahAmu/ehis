"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble, Stethoscope, Loader2, CheckCircle2,
  Copy, Check, RefreshCw, ShieldCheck, Hash, Info,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { useSession } from "@/contexts/SessionContext";
import { Select, DatePicker } from "@/components/shared/inputs";
import { toast } from "@/lib/ui/toastStore";
import { cn } from "@/lib/utils";
import { Field, SectionHeader, textareaCls } from "./pasienPulangShared";
import { terbitkanSPRI, type SPRIRequest, type SPRIResult } from "./spriMock";

// Jenis ruang perawatan (selaras RIKelas — hak kelas / tipe ruang rawat inap).
const RUANG_OPTS = ["VIP", "Kelas 1", "Kelas 2", "Kelas 3", "ICU", "HCU", "Isolasi"];

function todayYmd(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

interface Props {
  patient: IGDPatientDetail;
  /** Opsi DPJP dari roster ruangan (dihitung di parent — sama pool dgn Dokter Pemulang). */
  dokterOptions: string[];
  /** Gerbang submit parent: true setelah SPRI terbit. */
  onIssuedChange: (v: boolean) => void;
}

export default function SPRIPanel({ patient, dokterOptions, onIssuedChange }: Props) {
  const { session } = useSession();
  const userName = session?.namaTampil ?? "Petugas IGD";

  const [dpjp, setDpjp]               = useState(patient.doctor);
  const [tglRawat, setTglRawat]       = useState(todayYmd); // default hari ini, bisa dipilih
  const [ruang, setRuang]             = useState("");
  const [indikasi, setIndikasi]       = useState("");
  const [keterangan, setKeterangan]   = useState("");

  const [issuing, setIssuing]         = useState(false);
  const [result, setResult]           = useState<SPRIResult | null>(null);
  const [copied, setCopied]           = useState(false);

  const noKartu = patient.noBpjs ?? "";
  const canIssue =
    dpjp.trim() !== "" && ruang.trim() !== "" && tglRawat.trim() !== "" && indikasi.trim() !== "" && !issuing;

  async function handleIssue() {
    if (!canIssue) return;
    const req: SPRIRequest = {
      noKartu,
      kodeDokter: dpjp,            // TODO produksi: map nama DPJP → kode dokter BPJS
      poliKontrol: ruang,          // TODO produksi: kode poli/spesialistik tujuan rawat (lihat doc)
      tglRencanaKontrol: tglRawat,
      user: userName,
    };
    setIssuing(true);
    try {
      const res = await terbitkanSPRI(req);
      setResult(res);
      onIssuedChange(true);
      toast.success("SPRI berhasil diterbitkan", `No. Referensi ${res.noReferensi}`);
    } catch {
      toast.error("Gagal menerbitkan SPRI", "Coba lagi.");
    } finally {
      setIssuing(false);
    }
  }

  function resetIssue() {
    setResult(null);
    setCopied(false);
    onIssuedChange(false);
  }

  async function copyRef() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.noReferensi);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard tak tersedia — abaikan */ }
  }

  const issued = result !== null;

  return (
    <div className="flex flex-col gap-4">

      {/* Header + mode demo */}
      <div className="overflow-hidden rounded-xl border border-violet-200 shadow-sm">
        <SectionHeader icon={BedDouble} title="Penerbitan SPRI — Surat Perintah Rawat Inap" />
        <div className="flex flex-col gap-4 bg-white p-4">

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <Info size={13} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-[11px] leading-snug text-amber-700">
              <span className="font-semibold">Mode Demo · Mock SPRI.</span>{" "}
              Penerbitan selalu berhasil & mengembalikan nomor referensi tiruan. Integrasi
              V-Claim BPJS menyusul.
            </p>
          </div>

          {/* Peserta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="shrink-0 text-violet-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">No. Kartu BPJS</span>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-700">
              {noKartu || "— (penjamin non-BPJS)"}
            </span>
          </div>

          {/* DPJP + Tanggal rencana rawat */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="DPJP Rawat Inap" required hint="Dipilih dari dokter yang ditugaskan ke ruangan ini.">
              <Select
                value={dpjp}
                onChange={setDpjp}
                options={dokterOptions}
                icon={Stethoscope}
                searchable
                placeholder="— Pilih DPJP penerima —"
              />
            </Field>
            <Field label="Tanggal Rencana Rawat Inap" required>
              <DatePicker
                value={tglRawat}
                onChange={setTglRawat}
                clearable={false}
                placeholder="Pilih tanggal"
              />
            </Field>
          </div>

          {/* Jenis ruang perawatan */}
          <Field label="Jenis Ruang Perawatan" required>
            <Select
              value={ruang}
              onChange={setRuang}
              options={RUANG_OPTS}
              icon={BedDouble}
              placeholder="— Pilih jenis ruang —"
            />
          </Field>

          {/* Indikasi */}
          <Field label="Indikasi Rawat Inap" required>
            <textarea
              value={indikasi}
              onChange={(e) => setIndikasi(e.target.value)}
              rows={3}
              placeholder="Indikasi medis pasien perlu rawat inap: mis. GJK NYHA III eksaserbasi akut, perlu monitoring hemodinamik & terapi IV lanjutan..."
              className={textareaCls}
              disabled={issued}
            />
          </Field>

          {/* Keterangan */}
          <Field label="Keterangan">
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={2}
              placeholder="Catatan tambahan (opsional)…"
              className={textareaCls}
              disabled={issued}
            />
          </Field>

          {/* Nomor Referensi (response BPJS) */}
          <Field label="Nomor Referensi SPRI">
            <AnimatePresence mode="wait" initial={false}>
              {issued ? (
                <motion.div
                  key="ref"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5"
                >
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                  <span className="min-w-0 flex-1 font-mono text-sm font-bold tracking-wide text-emerald-800">
                    {result!.noReferensi}
                  </span>
                  <button
                    type="button"
                    onClick={copyRef}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-600 transition hover:bg-emerald-100"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? "Tersalin" : "Salin"}
                  </button>
                </motion.div>
              ) : (
                <div
                  key="empty"
                  className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-400"
                >
                  <Hash size={13} className="shrink-0" />
                  Akan terbit otomatis setelah SPRI diterbitkan.
                </div>
              )}
            </AnimatePresence>
          </Field>

          {/* Aksi terbit / terbit ulang */}
          {issued ? (
            <button
              type="button"
              onClick={resetIssue}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={13} /> Terbitkan Ulang
            </button>
          ) : (
            <button
              type="button"
              onClick={handleIssue}
              disabled={!canIssue}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40",
                "bg-violet-600 hover:bg-violet-700",
              )}
            >
              {issuing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {issuing ? "Menerbitkan SPRI…" : "Terbitkan SPRI"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
