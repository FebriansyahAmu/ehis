"use client";

// Tab "Ubah Penjamin" — 2 langkah + bilah aksi lengket:
//   Ringkasan  "Saat ini → Akan menjadi" (amber = perubahan belum disimpan).
//   Langkah 1  pilih jenis (radio native ber-fieldset).
//   Langkah 2  BPJS: cek kepesertaan → kartu peserta → Terbitkan SEP (modal adaptif per unit).
//              Non-BPJS: isian ringkas → Simpan (changePenjamin, issueSep=false).
// Panel tiap jenis tetap terpasang (atribut `hidden`) → isian & hasil cek tidak hilang saat berpindah.
// Sesudah simpan/terbit SEP → `onSaved(patch)` memperbarui data kunjungan di KunjunganTabs (tab
// Ringkasan ikut berubah) tanpa memuat ulang halaman.

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { MotionConfig } from "framer-motion";
import {
  ArrowRight, BadgeCheck, Ban, Check, CircleDashed, CreditCard, FileCheck, Hash, Loader2, Search, Undo2,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { KunjunganRecord, PatientMaster } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { changePenjamin, type KunjunganDTO } from "@/lib/api/kunjungan";
import { getPatientNoKartu } from "@/lib/api/patients";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import { dtoDetailToKunjunganRecord } from "../../patient/kunjunganRiwayatApi";
import type { KunjunganTabId } from "../KunjunganTabs";
import { UbahPenjaminSepModal } from "./sep/UbahPenjaminSepModal";
import type { BpjsData } from "./sep/sepTypes";
import {
  NONBPJS_TIPE, groupDigits, isFullNoKartu, optOf, savedLabel, typeOf, type PenjaminType,
} from "./penjamin/penjaminConfig";
import { Callout, DetailChip, StepTitle } from "./penjamin/penjaminUi";
import { PenjaminCompare, type CompareSide } from "./penjamin/PenjaminCompare";
import { PenjaminTypePicker } from "./penjamin/PenjaminTypePicker";
import { BpjsKepesertaanPanel } from "./penjamin/BpjsKepesertaanPanel";
import { AsuransiPanel, NakerPanel, UmumPanel } from "./penjamin/NonBpjsPanels";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAKER_NAMA = "BPJS Ketenagakerjaan";

/** Field kunjungan yang berubah sesudah penjamin disimpan / SEP terbit. */
export type PenjaminPatch = Pick<KunjunganRecord, "penjamin" | "noPenjamin" | "noSEP">;

const STEP2: Record<PenjaminType, { title: string; desc: string }> = {
  "bpjs-jkn": { title: "Cek kepesertaan JKN", desc: "Verifikasi status peserta sebelum SEP diterbitkan." },
  umum: { title: "Konfirmasi tarif umum", desc: "Pasien membayar sendiri sesuai tarif umum RS." },
  "bpjs-naker": { title: "Data BPJS Ketenagakerjaan", desc: "Penjamin untuk kecelakaan kerja / penyakit akibat kerja." },
  asuransi: { title: "Data asuransi", desc: "Asuransi swasta atau jaminan perusahaan." },
};

const PRIMARY = "h-10 min-w-40 flex-1 rounded-xl px-5 font-semibold text-white sm:flex-none";

export function PenjaminForm({
  kunjungan, patient, onSaved, onNavigate,
}: {
  kunjungan: KunjunganRecord;
  patient: PatientMaster;
  /** Perbarui data kunjungan di induk sesudah simpan. Tanpa ini → muat ulang halaman. */
  onSaved?: (patch: PenjaminPatch) => void;
  /** Pindah tab (Update SEP / Data Kecelakaan). */
  onNavigate?: (tab: KunjunganTabId) => void;
}) {
  const currentType = useMemo(() => typeOf(kunjungan.penjamin), [kunjungan.penjamin]);
  const isDbKunjungan = UUID_RE.test(kunjungan.id);
  const locked = kunjungan.status === "Dibatalkan";
  const formId = useId();
  const step2Id = useId();

  // No. Kartu BPJS PENUH (un-mask) dari jaminan pasien tersimpan → isi awal pencarian kepesertaan.
  const [prefilledNoKartu, setPrefilledNoKartu] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!UUID_RE.test(patient.id)) return;
    const ac = new AbortController();
    getPatientNoKartu(patient.id, ac.signal)
      .then(({ noKartu }) => { if (noKartu) setPrefilledNoKartu(noKartu); })
      .catch(() => { /* fallback ke nomor kunjungan/masked */ });
    return () => ac.abort();
  }, [patient.id]);
  const savedNoKartu = kunjungan.noPenjamin || prefilledNoKartu || patient.penjamin.nomor || "";

  // Isian non-BPJS: isi awal dari jaminan tersimpan pasien (bila tipenya Asuransi).
  const savedAsuransi = patient.penjamin.tipe === "Asuransi" ? patient.penjamin : null;
  const savedIsNaker = !!savedAsuransi && /ketenagakerjaan|naker/i.test(savedAsuransi.nama);

  const [selected, setSelected] = useState<PenjaminType>(currentType);
  const [bpjsResult, setBpjsResult] = useState<BpjsData | null>(null);
  const [sepOpen, setSepOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [asuransiNama, setAsuransiNama] = useState(savedAsuransi && !savedIsNaker ? savedAsuransi.nama : "");
  const [polis, setPolis] = useState(savedAsuransi && !savedIsNaker ? (savedAsuransi.noPolis ?? "") : "");
  const [kpj, setKpj] = useState(savedIsNaker ? (savedAsuransi?.noPolis ?? "") : "");
  const [namaError, setNamaError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const searchRef = useRef<HTMLInputElement>(null);
  const namaRef = useRef<HTMLInputElement>(null);
  const issuedRef = useRef<KunjunganDTO | null>(null);
  const savedTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const isBpjs = selected === "bpjs-jkn";
  const changed = selected !== currentType;
  const saving = saveState === "saving";

  const choose = (t: PenjaminType) => {
    setSelected(t);
    setNudge(false);
    setNamaError(null);
    if (saveState === "saved") setSaveState("idle");
  };

  const applyPatch = (patch: PenjaminPatch) => {
    if (onSaved) onSaved(patch);
    else window.location.reload();
  };

  const flashSaved = () => {
    setSaveState("saved");
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaveState("idle"), 2400);
  };

  // ── Simpan non-BPJS ──
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving || locked || selected === "bpjs-jkn") return;
    if (selected === "asuransi" && !asuransiNama.trim()) {
      setNamaError("Isi nama asuransi sebelum menyimpan.");
      namaRef.current?.focus();
      return;
    }
    const t = selected;
    const nomor = t === "asuransi" ? polis.trim() : t === "bpjs-naker" ? kpj.trim() : "";
    const patch: PenjaminPatch = { penjamin: savedLabel(t, asuransiNama), noPenjamin: nomor || undefined };
    setSaveState("saving");

    // Kunjungan demo (id non-UUID) → simulasi lokal, tanpa API.
    if (!isDbKunjungan) {
      await new Promise((r) => setTimeout(r, 600));
      applyPatch(patch);
      toast.success("Penjamin diperbarui", `${patch.penjamin} (demo — tidak disimpan ke server)`);
      flashSaved();
      return;
    }
    try {
      await changePenjamin(kunjungan.id, {
        penjaminTipe: NONBPJS_TIPE[t],
        issueSep: false,
        penjaminNama: t === "bpjs-naker" ? NAKER_NAMA : t === "asuransi" ? asuransiNama.trim() : undefined,
        noPolis: nomor || undefined,
      });
      applyPatch(patch);
      toast.success("Penjamin diperbarui", patch.penjamin);
      flashSaved();
    } catch (err) {
      setSaveState("idle");
      toast.error("Gagal ubah penjamin", err instanceof ApiError ? err.message : "Periksa koneksi lalu coba lagi.");
    }
  };

  // ── BPJS: buka modal SEP (atau arahkan ke cek kepesertaan dulu) ──
  const openSep = () => {
    if (!bpjsResult) {
      setNudge(true);
      requestAnimationFrame(() => searchRef.current?.focus());
      return;
    }
    setSepOpen(true);
  };

  const closeSep = () => {
    setSepOpen(false);
    const dto = issuedRef.current;
    issuedRef.current = null;
    if (!dto) return;
    const r = dtoDetailToKunjunganRecord(dto);
    setBpjsResult(null);
    applyPatch({ penjamin: r.penjamin, noPenjamin: r.noPenjamin, noSEP: r.noSEP });
  };

  // ── Ringkasan ──
  const current: CompareSide = {
    type: currentType,
    label: kunjungan.penjamin?.trim() || optOf(currentType).label,
    details: (
      <>
        {currentType === "bpjs-jkn" && savedNoKartu && (
          <DetailChip icon={CreditCard} mono>{isFullNoKartu(savedNoKartu) ? groupDigits(savedNoKartu) : savedNoKartu}</DetailChip>
        )}
        {kunjungan.noSEP ? (
          <DetailChip icon={FileCheck} tone="ok" mono>SEP {kunjungan.noSEP}</DetailChip>
        ) : currentType === "bpjs-jkn" ? (
          <DetailChip icon={CircleDashed} tone="muted">Belum ada SEP</DetailChip>
        ) : null}
      </>
    ),
  };

  const next: CompareSide | null = !changed ? null : {
    type: selected,
    label:
      selected === "bpjs-jkn" ? (bpjsResult ? `BPJS ${bpjsResult.jenis}` : "BPJS / JKN")
      : selected === "asuransi" ? (asuransiNama.trim() || "Asuransi Lainnya")
      : optOf(selected).label,
    details:
      selected === "bpjs-jkn" ? (
        bpjsResult ? (
          <>
            <DetailChip icon={BadgeCheck} tone="ok">Peserta {bpjsResult.status.toLowerCase()} · {bpjsResult.kelas}</DetailChip>
            <DetailChip icon={CreditCard} mono>{groupDigits(bpjsResult.noKartu)}</DetailChip>
          </>
        ) : (
          <DetailChip icon={Search} tone="muted">Menunggu cek kepesertaan</DetailChip>
        )
      ) : selected === "umum" ? (
        <DetailChip>Tarif umum · bayar di Kasir</DetailChip>
      ) : selected === "bpjs-naker" ? (
        kpj.trim() ? <DetailChip icon={Hash} mono>KPJ {kpj.trim()}</DetailChip> : <DetailChip tone="muted">No. KPJ belum diisi</DetailChip>
      ) : (
        <>
          {!asuransiNama.trim() && <DetailChip tone="warn">Nama asuransi wajib diisi</DetailChip>}
          {polis.trim() ? <DetailChip icon={Hash} mono>Polis {polis.trim()}</DetailChip> : <DetailChip tone="muted">No. polis belum diisi</DetailChip>}
        </>
      ),
  };

  // ── Teks bilah aksi ──
  const fromLabel = current.label;
  const summary = isBpjs
    ? bpjsResult
      ? <>Peserta <b className="font-semibold text-slate-900">{bpjsResult.nama}</b> terverifikasi — lanjutkan penerbitan SEP.</>
      : changed
        ? <><b className="font-semibold text-slate-900">{fromLabel}</b> → <b className="font-semibold text-slate-900">BPJS / JKN</b> · cek kepesertaan dulu.</>
        : <>Cek kepesertaan untuk menerbitkan SEP kunjungan ini.</>
    : saveState === "saved"
      ? <>Penjamin tersimpan.</>
      : changed
        ? <>Perubahan: <b className="font-semibold text-slate-900">{fromLabel}</b> → <b className="font-semibold text-slate-900">{next?.label}</b></>
        : <>Jenis sama — simpan untuk memperbarui data penjamin.</>;
  const dot = saveState === "saved" || (isBpjs && bpjsResult) ? "bg-emerald-500" : changed ? "bg-amber-500" : "bg-slate-300";

  const opt = optOf(selected);
  const OptIcon = opt.icon;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full flex-col gap-5">
        {/* ── Judul ── */}
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Ubah Penjamin</h2>
            <p className="mt-0.5 m-xs text-slate-500">
              Ganti penjamin kunjungan <span className="font-mono font-medium text-slate-700">{kunjungan.noKunjungan}</span> — berlaku
              untuk tagihan kunjungan ini.
            </p>
          </div>
        </header>

        {locked && (
          <Callout tone="danger" icon={Ban} title="Kunjungan dibatalkan">
            Penjamin kunjungan yang sudah dibatalkan tidak dapat diubah.
          </Callout>
        )}

        <PenjaminCompare current={current} next={next} />

        <PenjaminTypePicker value={selected} current={currentType} onChange={choose} disabled={locked || saving} />

        {/* ── Langkah 2 ── */}
        <section aria-labelledby={step2Id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <h3 id={step2Id} className="min-w-0">
              <StepTitle n={2} title={STEP2[selected].title} desc={STEP2[selected].desc} done={isBpjs && !!bpjsResult} />
            </h3>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1.5 m-tiny font-semibold", opt.accent.tile)}>
              <OptIcon className="size-3.5" aria-hidden="true" />
              {opt.label}
            </span>
          </div>

          {isBpjs && kunjungan.noSEP && (
            <Callout
              tone="warning"
              title={`Kunjungan ini sudah punya SEP ${kunjungan.noSEP}`}
              className="mb-4"
              action={onNavigate && (
                <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("update-sep")} className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                  Buka Update SEP
                  <ArrowRight aria-hidden="true" />
                </Button>
              )}
            >
              Menerbitkan SEP baru akan menggantikan SEP tersebut. Hanya ingin mengoreksi data SEP? Gunakan Update SEP.
            </Callout>
          )}
          {!isBpjs && changed && kunjungan.noSEP && (
            <Callout tone="warning" title={`SEP ${kunjungan.noSEP} tidak dibatalkan otomatis`} className="mb-4">
              Mengganti penjamin tidak membatalkan SEP. Batalkan SEP secara terpisah bila tidak dipakai lagi.
            </Callout>
          )}

          <div hidden={!isBpjs} className="motion-safe:animate-[fade-in_0.2s_ease_backwards]">
            <BpjsKepesertaanPanel
              // Remount saat No. Kartu penuh dari DB tiba (async) → field pencarian terisi nomor tersimpan.
              key={prefilledNoKartu ? "prefilled" : "default"}
              defaultNoKartu={prefilledNoKartu || kunjungan.noPenjamin || patient.penjamin.nomor || ""}
              patientName={patient.name}
              savedNoKartu={savedNoKartu}
              result={bpjsResult}
              onResult={setBpjsResult}
              inputRef={searchRef}
              nudge={nudge}
              onNudgeClear={() => setNudge(false)}
              disabled={locked}
            />
          </div>

          <form id={formId} hidden={isBpjs} noValidate onSubmit={save} aria-labelledby={step2Id}>
            <div hidden={selected !== "umum"} className="motion-safe:animate-[fade-in_0.2s_ease_backwards]">
              <UmumPanel />
            </div>
            <div hidden={selected !== "bpjs-naker"} className="motion-safe:animate-[fade-in_0.2s_ease_backwards]">
              <NakerPanel
                kpj={kpj}
                onKpj={setKpj}
                onOpenKecelakaan={onNavigate && (() => onNavigate("kecelakaan"))}
                disabled={locked || saving}
              />
            </div>
            <div hidden={selected !== "asuransi"} className="motion-safe:animate-[fade-in_0.2s_ease_backwards]">
              <AsuransiPanel
                nama={asuransiNama}
                onNama={(v) => { setAsuransiNama(v); if (namaError) setNamaError(null); }}
                polis={polis}
                onPolis={setPolis}
                error={namaError}
                namaRef={namaRef}
                disabled={locked || saving}
              />
            </div>
          </form>
        </section>

        {/* ── Bilah aksi lengket ── */}
        {!locked && (
          <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-lg shadow-slate-900/10 backdrop-blur supports-backdrop-filter:bg-white/80 sm:pl-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex min-w-0 items-start gap-2 px-1 m-xs leading-snug text-slate-600 sm:items-center sm:px-0">
                <span aria-hidden="true" className={cn("mt-1 size-2 shrink-0 rounded-full transition-colors sm:mt-0", dot)} />
                <span className="min-w-0">{summary}</span>
              </p>
              <div className="flex items-center gap-2 sm:shrink-0">
                {changed && (
                  <Button type="button" variant="ghost" onClick={() => choose(currentType)} disabled={saving} className="h-10 rounded-xl text-slate-700">
                    <Undo2 aria-hidden="true" />
                    Kembalikan
                  </Button>
                )}
                {isBpjs ? (
                  <Button type="button" onClick={openSep} className={cn(PRIMARY, "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-500/40")}>
                    <FileCheck aria-hidden="true" />
                    Terbitkan SEP
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    form={formId}
                    disabled={saving}
                    className={cn(
                      PRIMARY,
                      saveState === "saved"
                        ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500/40"
                        : "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-500/40",
                    )}
                  >
                    {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                    {saving ? "Menyimpan…" : saveState === "saved" ? "Tersimpan" : "Simpan penjamin"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal penerbitan SEP ── */}
        {sepOpen && bpjsResult && (
          <UbahPenjaminSepModal
            patient={patient}
            kunjungan={kunjungan}
            bpjsData={bpjsResult}
            onIssued={(dto) => { issuedRef.current = dto; }}
            onClose={closeSep}
          />
        )}
      </div>
    </MotionConfig>
  );
}
