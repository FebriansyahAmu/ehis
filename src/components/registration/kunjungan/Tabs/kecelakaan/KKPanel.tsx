"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, ShieldCheck, HardHat, Signpost, FileClock, Car, Plus,
  Info, AlertTriangle, CheckCircle2, Landmark, Route, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs/Select";
import { SectionCard, ChipRow, KendaraanCard, lbl, inp } from "./kecelakaanShared";
import type { KecelakaanDraft, KendaraanItem, StatusLaporanKk, StatusPenjaminanKk } from "./kecelakaanTypes";
import {
  JENIS_PEKERJAAN, MEKANISME_KK, LINGKUP_KERJA_OPTS, STATUS_LAPORAN_KK_CONFIG, STATUS_PENJAMINAN_KK_CONFIG,
} from "./kecelakaanTypes";

// ─── Helpers ──────────────────────────────────────────────────

// Badan penyelenggara penjamin kecelakaan — HARUS selaras server deriveLaka (kecelakaanService).
// KK murni → BPJS TK ("2"). PP/dinas berunsur lalu lintas (ada kendaraan) → JR + BPJS TK ("1,2").
function badanDisplay(lingkup: string, kendaraanCount: number): { label: string; kode: string; jr: boolean } {
  const laluLintas = (lingkup === "pp" || lingkup === "dinas") && kendaraanCount > 0;
  return laluLintas
    ? { label: "Jasa Raharja + BPJS Ketenagakerjaan", kode: "1,2", jr: true }
    : { label: "BPJS Ketenagakerjaan (JKK)", kode: "2", jr: false };
}

// Batas Laporan Tahap I (KK1) = kejadian + 2×24 jam (Permenaker 5/2021 jo 1/2025).
type DeadlineTone = "none" | "ok" | "warn" | "over";
function deadlineInfo(tanggal: string, waktu: string): { text: string; tone: DeadlineTone } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return { text: "Tetapkan tanggal kejadian untuk menghitung batas 2×24 jam.", tone: "none" };
  }
  const jam = /^\d{2}:\d{2}$/.test(waktu) ? waktu : "00:00";
  const kejadian = new Date(`${tanggal}T${jam}:00`);
  if (Number.isNaN(kejadian.getTime())) return { text: "Tanggal kejadian tidak valid.", tone: "none" };
  const deadline = new Date(kejadian.getTime() + 48 * 3600 * 1000);
  const fmt = deadline.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  const ms = deadline.getTime() - Date.now();
  if (ms <= 0) return { text: `Batas lapor TERLEWAT — jatuh tempo ${fmt}.`, tone: "over" };
  const jamSisa = Math.floor(ms / 3_600_000);
  const menit = Math.floor((ms % 3_600_000) / 60_000);
  return {
    text: `Sisa ${jamSisa} jam ${menit} mnt — batas ${fmt}.`,
    tone: jamSisa < 12 ? "warn" : "ok",
  };
}

const DEADLINE_TONE: Record<DeadlineTone, string> = {
  none: "border-slate-100 bg-slate-50 text-slate-500",
  ok:   "border-emerald-100 bg-emerald-50 text-emerald-700",
  warn: "border-amber-100 bg-amber-50 text-amber-700",
  over: "border-rose-100 bg-rose-50 text-rose-700",
};

// ─── Sub: Lingkup selector ────────────────────────────────────

function LingkupSelector({
  value, onChange,
}: {
  value: string;
  onChange: (v: KecelakaanDraft["lingkupKerja"]) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {LINGKUP_KERJA_OPTS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col gap-0.5 rounded-xl border p-2.5 text-left transition-all active:scale-[0.97]",
              active
                ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40",
            )}
          >
            <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
            <span className={cn("text-[9px] leading-tight", active ? "opacity-80" : "text-slate-400")}>
              {opt.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── KKPanel ──────────────────────────────────────────────────

export function KKPanel({
  draft,
  setDraft,
}: {
  draft:    KecelakaanDraft;
  setDraft: React.Dispatch<React.SetStateAction<KecelakaanDraft>>;
}) {
  const addKendaraan = () =>
    setDraft((d) => ({ ...d, kendaraan: [...d.kendaraan, { jenis: "", noPol: "", peran: "Korban" }] }));
  const updateKendaraan = (i: number, patch: Partial<KendaraanItem>) =>
    setDraft((d) => ({ ...d, kendaraan: d.kendaraan.map((k, idx) => (idx === i ? { ...k, ...patch } : k)) }));
  const removeKendaraan = (i: number) =>
    setDraft((d) => ({ ...d, kendaraan: d.kendaraan.filter((_, idx) => idx !== i) }));

  const lkStatuses: StatusLaporanKk[] = ["belum", "proses", "terkirim"];
  const penjaminanStatuses: StatusPenjaminanKk[] = ["menunggu", "dijamin", "ditolak"];
  const badan = badanDisplay(draft.lingkupKerja, draft.kendaraan.length);
  const perjalanan = draft.lingkupKerja === "pp" || draft.lingkupKerja === "dinas";
  const deadline = deadlineInfo(draft.tanggal, draft.waktu);

  return (
    <div className="space-y-3">
      {/* ── Widget JKK ── */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 via-emerald-50/40 to-white p-4">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/30 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-emerald-200">
            <HardHat size={19} className="text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12.5px] font-bold text-emerald-900">Dijamin BPJS Ketenagakerjaan — JKK</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                PP 82/2019 · Permenaker 5/2021 jo 1/2025
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {([
                ["Tanpa Batas", "Biaya medis di PLKK (sesuai kebutuhan medis)"],
                ["5 Tahun", "Daluwarsa hak klaim (Pasal 26 PP 82/2019)"],
              ] as [string, string][]).map(([val, cap]) => (
                <div key={cap} className="rounded-xl border border-emerald-100 bg-white/70 px-3 py-2">
                  <p className="text-[14px] font-bold text-emerald-700">{val}</p>
                  <p className="text-[9px] leading-tight text-emerald-600/80">{cap}</p>
                </div>
              ))}
            </div>

            <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-emerald-700">
              <Info size={11} className="mt-0.5 shrink-0" />
              Penjamin utama = <span className="font-semibold">BPJS TK via e-PLKK</span> (BPJS TK tak menerbitkan SEP).
              SEP hanya <span className="font-semibold">jejak penetapan penjamin</span> (PMK 141/2018) bila pasien juga peserta JKN.
            </p>
          </div>
        </div>
      </div>

      {/* ── Baris 1: Data Perusahaan | Lingkup + Badan Penjamin ── */}
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {/* Data Perusahaan */}
        <SectionCard icon={Building2} title="Data Perusahaan & Peserta" accent="emerald">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className={lbl}>Nama Perusahaan Pemberi Kerja</p>
              <input
                className={inp}
                placeholder="PT / CV / UD / Perorangan…"
                value={draft.namaPerusahaan}
                onChange={(e) => setDraft((d) => ({ ...d, namaPerusahaan: e.target.value }))}
              />
            </div>
            <div>
              <p className={lbl}>NPP <span className="font-normal normal-case text-slate-300">— No. Pendaftaran Perusahaan</span></p>
              <input
                className={cn(inp, "font-mono tracking-wide")}
                placeholder="No. Pendaftaran Perusahaan"
                value={draft.npp}
                onChange={(e) => setDraft((d) => ({ ...d, npp: e.target.value }))}
              />
            </div>
            <div>
              <p className={lbl}>No. KPJ <span className="font-normal normal-case text-slate-300">— Kartu Peserta</span></p>
              <input
                className={cn(inp, "font-mono tracking-wide")}
                placeholder="No. Kartu Peserta BPJS TK"
                value={draft.noKpj}
                onChange={(e) => setDraft((d) => ({ ...d, noKpj: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <p className={lbl}>Jenis Pekerjaan</p>
              <Select
                value={draft.jenisPekerjaan}
                onChange={(v) => setDraft((d) => ({ ...d, jenisPekerjaan: v }))}
                options={[...JENIS_PEKERJAAN]}
                icon={HardHat}
                placeholder="Pilih jenis pekerjaan…"
              />
            </div>
            <div className="col-span-2">
              <p className={lbl}>Lokasi / Area Kejadian (di Tempat Kerja)</p>
              <input
                className={inp}
                placeholder="Area produksi / divisi / lokasi proyek…"
                value={draft.lokasiKerja}
                onChange={(e) => setDraft((d) => ({ ...d, lokasiKerja: e.target.value }))}
              />
            </div>
          </div>
        </SectionCard>

        {/* Lingkup + Badan Penjamin */}
        <SectionCard icon={Signpost} title="Lingkup Kejadian" accent="emerald">
          <LingkupSelector
            value={draft.lingkupKerja}
            onChange={(v) => setDraft((d) => ({ ...d, lingkupKerja: v }))}
          />

          <AnimatePresence>
            {perjalanan && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }} className="overflow-hidden"
              >
                <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 p-2.5">
                  <Route size={12} className="mt-0.5 shrink-0 text-sky-500" />
                  <p className="text-[9.5px] leading-relaxed text-sky-700">
                    Kejadian di perjalanan? Bila berupa <span className="font-semibold">kecelakaan lalu lintas</span>, tambahkan
                    kendaraan di bawah → kasus menjadi <span className="font-semibold">KLL + KK</span> (Jasa Raharja menanggung
                    lebih dulu ≤Rp20 jt, sisanya BPJS TK).
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Badan penyelenggara (derivasi) */}
          <div>
            <p className={lbl}><ShieldCheck size={10} /> Badan Penjamin Kecelakaan</p>
            <div className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2",
              badan.jr ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/70",
            )}>
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-lg text-white",
                badan.jr ? "bg-amber-500" : "bg-emerald-600",
              )}>
                <ShieldCheck size={12} />
              </span>
              <div className="min-w-0">
                <p className={cn("text-[11px] font-bold", badan.jr ? "text-amber-800" : "text-emerald-800")}>{badan.label}</p>
                <p className={cn("text-[9px]", badan.jr ? "text-amber-600" : "text-emerald-600")}>
                  {badan.jr ? "Kode SEP penjamin 1,2 (KLL_KK)" : "Kode SEP penjamin 2 · lakaLantas KK"}
                </p>
              </div>
              <span className={cn(
                "ml-auto rounded-full bg-white px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide ring-1",
                badan.jr ? "text-amber-600 ring-amber-200" : "text-emerald-600 ring-emerald-200",
              )}>
                Otomatis
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Baris 2: Mekanisme + PLKK | Pelaporan Tahap I ── */}
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          {/* Mekanisme */}
          <SectionCard icon={AlertTriangle} title="Mekanisme Kecelakaan Kerja" accent="emerald">
            <div>
              <p className={lbl}>Jenis / Mekanisme</p>
              <Select
                value={draft.mekanismeTrauma}
                onChange={(v) => setDraft((d) => ({ ...d, mekanismeTrauma: v }))}
                options={[...MEKANISME_KK]}
                placeholder="Pilih mekanisme…"
              />
            </div>
          </SectionCard>

          {/* PLKK */}
          <SectionCard icon={Landmark} title="Fasilitas PLKK" accent="emerald">
            <div className="grid grid-cols-2 gap-2">
              {([
                [true,  "PLKK (Direct-bill)", "Ditagih langsung ke BPJS TK"],
                [false, "Non-PLKK (Reimburse)", "Bayar dulu → klaim ulang"],
              ] as [boolean, string, string][]).map(([val, label, sub]) => {
                const active = draft.isPlkk === val;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, isPlkk: val }))}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-xl border p-2.5 text-left transition active:scale-[0.97]",
                      active
                        ? (val ? "border-emerald-500 bg-emerald-500 text-white" : "border-amber-500 bg-amber-500 text-white")
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <span className="text-[11px] font-bold leading-tight">{label}</span>
                    <span className={cn("text-[9px] leading-tight", active ? "opacity-80" : "text-slate-400")}>{sub}</span>
                  </button>
                );
              })}
            </div>
            <p className={cn(
              "flex items-start gap-1.5 rounded-lg border px-2.5 py-2 text-[9.5px] leading-relaxed",
              draft.isPlkk ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700",
            )}>
              <Info size={11} className="mt-0.5 shrink-0" />
              {draft.isPlkk
                ? "RS adalah PLKK — biaya perawatan ditagih langsung ke BPJS TK; pasien tidak membayar."
                : "RS bukan PLKK — pasien/pemberi kerja bayar dulu lalu reimburse. Simpan kuitansi & dokumen medis."}
            </p>
          </SectionCard>
        </div>

        <div className="space-y-3">
        {/* Pelaporan Tahap I (KK1) */}
        <SectionCard icon={FileClock} title="Laporan Tahap I (Form KK1)" accent="emerald">
          <div>
            <p className={lbl}>Status Pelaporan</p>
            <ChipRow
              options={lkStatuses}
              config={STATUS_LAPORAN_KK_CONFIG}
              value={draft.statusLaporanKk}
              onChange={(v) => setDraft((d) => ({ ...d, statusLaporanKk: v }))}
            />
          </div>

          {/* Deadline 2×24 jam */}
          <div className={cn("flex items-start gap-2 rounded-lg border px-2.5 py-2", DEADLINE_TONE[deadline.tone])}>
            <Timer size={12} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide">Batas Lapor 2×24 Jam</p>
              <p className="text-[10px] leading-relaxed">{deadline.text}</p>
            </div>
          </div>

          <p className="flex items-start gap-1.5 text-[9.5px] leading-relaxed text-slate-500">
            <Info size={11} className="mt-0.5 shrink-0 text-slate-400" />
            Pemberi kerja <span className="font-semibold">wajib lapor ke BPJS Ketenagakerjaan &amp; Disnaker</span> maks 2×24 jam
            sejak kejadian (Permenaker 1/2025). Tahap II (KK2/KK3) menyusul setelah pasien dinyatakan sembuh.
          </p>
        </SectionCard>

        {/* Penjaminan JKK (e-PLKK) — hasil penetapan BPJS TK (bukan CoB) */}
        <SectionCard icon={ShieldCheck} title="Penjaminan JKK (e-PLKK)" accent="emerald">
          <div>
            <p className={lbl}>Status Penetapan</p>
            <ChipRow
              options={penjaminanStatuses}
              config={STATUS_PENJAMINAN_KK_CONFIG}
              value={draft.statusPenjaminanKk}
              onChange={(v) => setDraft((d) => ({ ...d, statusPenjaminanKk: v }))}
            />
          </div>

          <AnimatePresence>
            {draft.statusPenjaminanKk === "dijamin" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }} className="overflow-hidden"
              >
                <div className="pt-0.5">
                  <p className={lbl}>No. Jaminan / Kasus e-PLKK</p>
                  <input
                    className={cn(inp, "font-mono tracking-wide")}
                    placeholder="No. jaminan dari e-PLKK BPJS TK…"
                    value={draft.noJaminanKk}
                    onChange={(e) => setDraft((d) => ({ ...d, noJaminanKk: e.target.value }))}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {draft.statusPenjaminanKk === "ditolak" ? (
            <p className="flex items-start gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-2 text-[9.5px] leading-relaxed text-rose-700">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              Ditetapkan <span className="font-semibold">bukan KK</span> → jatuh ke jalur JKN (SEP BPJS Kesehatan jadi penjamin). Pastikan SEP aktif.
            </p>
          ) : (
            <p className="flex items-start gap-1.5 text-[9.5px] leading-relaxed text-slate-500">
              <Info size={11} className="mt-0.5 shrink-0 text-slate-400" />
              Penetapan dilakukan <span className="font-semibold">BPJS TK via e-PLKK/eRSTC</span> — RS melapor &amp; merawat. Dijamin → unlimited direct-bill; ditolak → fallback JKN.
            </p>
          )}
        </SectionCard>
        </div>
      </div>

      {/* ── Kendaraan terlibat (hanya saat PP/dinas → deteksi KLL_KK) ── */}
      <AnimatePresence>
        {perjalanan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden"
          >
            <SectionCard
              icon={Car}
              title="Kendaraan Terlibat"
              accent="amber"
              right={
                <button
                  type="button"
                  onClick={addKendaraan}
                  className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-sky-700 active:scale-95"
                >
                  <Plus size={11} /> Tambah
                </button>
              }
            >
              {draft.kendaraan.length === 0 ? (
                <button
                  type="button"
                  onClick={addKendaraan}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 py-6 text-center transition hover:border-sky-300 hover:bg-sky-50/40"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <Car size={16} className="text-slate-400" />
                  </span>
                  <p className="text-[10.5px] font-semibold text-slate-500">Tanpa kendaraan (bukan KLL)</p>
                  <p className="text-[9px] text-slate-400">Tambahkan bila kejadian berupa kecelakaan lalu lintas → KLL_KK</p>
                </button>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {draft.kendaraan.map((k, i) => (
                      <KendaraanCard key={i} item={k} index={i} onUpdate={updateKendaraan} onRemove={removeKendaraan} />
                    ))}
                  </AnimatePresence>
                  <p className="flex items-center gap-1.5 text-[9.5px] font-semibold text-amber-600">
                    <CheckCircle2 size={11} /> Terdeteksi KLL_KK — Jasa Raharja + BPJS TK menanggung berjenjang.
                  </p>
                </div>
              )}
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
