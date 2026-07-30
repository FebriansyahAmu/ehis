"use client";

// Rujukan Internal — peserta dengan SEP aktif dirujuk ke poli/spesialis LAIN di dalam RS yang
// sama (tanpa rujukan FKTP baru). Menghasilkan No. Rujukan Internal yang tertaut ke SEP aktif.
// Selaras BPJS "Rujuk Internal" (V-Claim). Mock/FE — sumber asal diturunkan dari kunjungan berjalan.

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Building2, FileText, Stethoscope, TriangleAlert, User, Waypoints } from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { Select } from "@/components/shared/inputs/Select";
import { DiagnosaCombobox } from "./DiagnosaCombobox";
import {
  Badge, SectionLabel, FieldCard, ReadinessBanner,
  RujukanConfirmPanel, RujukanSuccessState,
} from "./rujukanFormShared";
import { KODE_RS, SMF_LIST, type IcdOption } from "./rujukanTypes";

// ─── SEP asal card ────────────────────────────────────────────

function SepAsalCard({ noSEP, poliAsal }: { noSEP: string | null; poliAsal: string }) {
  if (!noSEP) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
        <TriangleAlert size={13} className="mt-px shrink-0 text-amber-600" />
        <p className="text-[10.5px] leading-relaxed text-amber-700">
          Belum ada SEP aktif pada kunjungan ini. Terbitkan SEP di tab <strong>SEP</strong> lebih dulu sebelum membuat rujukan internal.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-100 ring-1 ring-sky-200">
          <FileText size={10} className="text-sky-600" />
        </span>
        <span className="font-mono text-[11px] font-bold text-slate-700">{noSEP}</span>
        <span className="ml-auto rounded-full bg-sky-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-sky-700 ring-1 ring-sky-200">
          SEP Aktif
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 pl-6.5 text-[10px] text-slate-500">
        <Building2 size={10} className="shrink-0 text-slate-400" />
        <span>Poli asal:</span>
        <span className="font-semibold text-slate-700">{poliAsal}</span>
      </div>
    </div>
  );
}

// ─── Unit asal info ───────────────────────────────────────────

function AsalInfoBar({ poliAsal, dokter }: { poliAsal: string; dokter: string }) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Building2 size={12} className="shrink-0 text-sky-400" />
        <span className="text-[10.5px] text-slate-400">Poli / SMF Asal</span>
        <span className="ml-auto text-[10.5px] font-semibold text-slate-700">{poliAsal}</span>
      </div>
      <div className="h-px bg-slate-200" />
      <div className="flex items-center gap-2">
        <User size={12} className="shrink-0 text-sky-400" />
        <span className="text-[10.5px] text-slate-400">DPJP Asal</span>
        <span className="ml-auto truncate text-[10.5px] font-semibold text-slate-600">{dokter}</span>
      </div>
    </div>
  );
}

// ─── RujukanInternalPanel ─────────────────────────────────────

export function RujukanInternalPanel({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const [smfTujuan, setSmfTujuan] = useState("");
  const [diagnosa,  setDiagnosa]  = useState<IcdOption | null>(null);
  const [catatan,   setCatatan]   = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [noRujukan,  setNoRujukan]  = useState("");

  const noSEP    = kunjungan.noSEP ?? null;
  const poliAsal = kunjungan.poli ?? "—";
  const dokter   = kunjungan.dokter ?? "—";

  const tujuanReady = smfTujuan !== "";
  const dxReady     = diagnosa !== null;
  const canSubmit   = tujuanReady && dxReady;

  const handleConfirm = () => {
    const ts = Date.now().toString().slice(-6);
    const d  = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setNoRujukan(`${KODE_RS}${dd}${mm}${yy}I${ts}`);
    setConfirming(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSmfTujuan("");
    setDiagnosa(null);
    setCatatan("");
    setConfirming(false);
    setSubmitted(false);
    setNoRujukan("");
  };

  if (submitted) {
    return (
      <RujukanSuccessState
        title="Rujukan Internal Berhasil Dibuat"
        noRujukan={noRujukan}
        pickedLabel="Tercatat pada SEP aktif — dirujuk ke poli tujuan"
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Readiness overview */}
      <ReadinessBanner
        reqs={[{ ok: tujuanReady, label: "Poli Tujuan" }, { ok: dxReady, label: "Diagnosa" }]}
        readyLabel="Siap membuat rujukan internal"
        pendingLabel="Lengkapi data wajib terlebih dahulu"
      />

      {/* Alur asal → tujuan */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
        <Waypoints size={14} className="shrink-0 text-sky-500" />
        <span className="truncate rounded-md bg-slate-100 px-2 py-1 text-[10.5px] font-semibold text-slate-600">{poliAsal}</span>
        <ArrowRight size={13} className="shrink-0 text-slate-400" />
        <span className={smfTujuan
          ? "truncate rounded-md bg-emerald-50 px-2 py-1 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200"
          : "truncate rounded-md border border-dashed border-slate-300 px-2 py-1 text-[10.5px] font-medium text-slate-400"}>
          {smfTujuan || "Pilih poli tujuan…"}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Left: sumber (asal) ── */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <SectionLabel badge={<Badge tone="sumber">Sumber</Badge>} hint="SEP kunjungan berjalan" done={!!noSEP}>
              SEP Aktif
            </SectionLabel>
            <SepAsalCard noSEP={noSEP} poliAsal={poliAsal} />
          </div>

          <div className="space-y-1.5">
            <SectionLabel badge={<Badge tone="otomatis">Otomatis</Badge>}>Unit Asal</SectionLabel>
            <AsalInfoBar poliAsal={poliAsal} dokter={dokter} />
          </div>
        </div>

        {/* ── Right: tujuan rujukan ── */}
        <div className="space-y-4">
          <FieldCard label="Poli / SMF Tujuan" hint="dalam RS yang sama" badge={<Badge tone="wajib">Wajib</Badge>} done={tujuanReady}>
            <Select
              value={smfTujuan}
              onChange={setSmfTujuan}
              options={SMF_LIST}
              icon={Stethoscope}
              placeholder="Pilih poli / SMF tujuan…"
            />
          </FieldCard>

          <FieldCard label="Diagnosa" hint="ICD-10" badge={<Badge tone="wajib">Wajib</Badge>} done={dxReady}>
            <DiagnosaCombobox value={diagnosa} onChange={setDiagnosa} />
          </FieldCard>

          <FieldCard label="Catatan Rujukan" badge={<Badge tone="opsional">Opsional</Badge>} done={catatan.trim().length > 0}>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Alasan konsultasi / keterangan untuk poli tujuan…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </FieldCard>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="text-[10px] text-slate-400">
          {!tujuanReady && "Pilih poli / SMF tujuan terlebih dahulu"}
          {tujuanReady && !dxReady && "Diagnosa ICD-10 wajib diisi"}
          {canSubmit && "Semua syarat terpenuhi — siap dibuat"}
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-[12px] font-bold text-white shadow-sm shadow-sky-200/70 transition hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <Waypoints size={13} />
          Buat Rujukan Internal
        </button>
      </div>

      {/* Confirm panel (inline) */}
      <AnimatePresence>
        {confirming && diagnosa && (
          <RujukanConfirmPanel
            key="confirm"
            title="Konfirmasi Rujukan Internal"
            subtitle="Rujukan internal akan dibuat dan tertaut ke SEP aktif peserta"
            rows={[
              ["Kode RS",     KODE_RS],
              ["No. SEP",     noSEP ?? "—"],
              ["Poli Asal",   poliAsal],
              ["Poli Tujuan", smfTujuan],
              ["Diagnosa",    `${diagnosa.code} — ${diagnosa.name}`],
            ]}
            warning={<>Poli tujuan harus <strong>berbeda</strong> dari poli asal dan berada di <strong>RS yang sama</strong>. Rujukan internal tercatat pada SEP aktif peserta.</>}
            confirmLabel="Ya, Buat Rujukan"
            onConfirm={handleConfirm}
            onCancel={() => setConfirming(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
