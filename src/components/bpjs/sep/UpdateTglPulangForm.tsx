"use client";

// Update tanggal pulang SEP rawat inap (V-Claim PUT /SEP/updtglplg). Dua langkah:
// 1) Periksa SEP (getSEP) → lembar ringkas + kelayakan. SEP dihapus/ditutup/rawat jalan ditolak
//    dengan alasan — mencegah menulis ke SEP yang salah.
// 2) Isi tanggal pulang (DatePicker global, rentang tgl terbit..hari ini LOKAL), status pulang
//    (RadioGroup), data kematian bila status Meninggal, No. LP bila SEP KLL (spec: noLPManual
//    wajib — dulu tidak ada kolomnya sehingga SEP KLL selalu ditolak).
// user = username sesi login (dulu email hardcode). Galat tampil setelah interaksi; submit gagal
// → fokus ke kolom pertama yang salah; galat yang muncul saat blur/pilih tanggal diumumkan sekali.
// Komponen shadcn: Input · Label · Button · RadioGroup · Alert · Item · Empty · Skeleton · Spinner
// (potongan kecil di tglPulangUi.tsx, tampilan tersimpan di TglPulangTersimpan.tsx).

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CalendarCheck, CarFront, FileWarning, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/shared/inputs";
import { useUmumkanGalat } from "@/components/bpjs/shared/useUmumkanGalat";
import { useSessionOptional } from "@/contexts/SessionContext";
import { cn } from "@/lib/ui/utils";
import { getSEP, updateTglPulang } from "@/lib/bpjs/vClaimSEP";
import type { BPJSError, SEPRecordExt, StatusPulangKode } from "@/lib/bpjs/bpjsShared";
import { errorLabel, fmtTgl, fmtTglPendek, validateNoSEP } from "./sepShared";
import {
  STATUS_PULANG,
  URUTAN_KOLOM,
  hariIniISO,
  kelayakanUpdate,
  labelLamaRawat,
  selisihHari,
  sepKll,
  statusPulangMeta,
  validasiPulang,
  type IsianPulang,
  type KolomPulang,
} from "./updateTglPulangShared";
import TglPulangSepRingkas from "./TglPulangSepRingkas";
import TglPulangTersimpan from "./TglPulangTersimpan";
import { GalatKirim, GalatPeriksa, INPUT_ISI, LabelWajib, NADA_ALERT, PesanGalat } from "./tglPulangUi";

// ── Tipe & helper ──────────────────────────────────────────

type Cek =
  | { status: "idle" }
  | { status: "loading"; no: string }
  | { status: "found"; sep: SEPRecordExt }
  | { status: "error"; no: string; error: BPJSError };

type Kirim =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; sep: SEPRecordExt; isian: IsianPulang }
  | { status: "error"; error: BPJSError };

const GALAT_KONEKSI: BPJSError = {
  type: "BPJSMetaError",
  code: "503",
  message: "Koneksi ke V-Claim gagal",
  endpoint: "",
  retryable: true,
};

async function ambilSEP(no: string): Promise<Cek> {
  try {
    const res = await getSEP(no);
    if (res.ok && res.value.response) return { status: "found", sep: res.value.response };
    if (res.ok) {
      return {
        status: "error",
        no,
        error: { type: "BPJSMetaError", code: "201", message: "SEP tidak ditemukan", endpoint: "", retryable: false },
      };
    }
    return { status: "error", no, error: res.error };
  } catch {
    return { status: "error", no, error: GALAT_KONEKSI };
  }
}

function isianAwal(sep: SEPRecordExt): IsianPulang {
  return { tglPulang: sep.tglPulang ?? "", status: "1", noSurat: "", tglMeninggal: "", noLP: sep.jaminan?.noLP ?? "" };
}

const ISIAN_KOSONG: IsianPulang = { tglPulang: "", status: "1", noSurat: "", tglMeninggal: "", noLP: "" };

// ── Komponen ──────────────────────────────────────────────

export default function UpdateTglPulangForm({
  initialNoSEP,
  fokusAwal = false,
  onSuccess,
  onBukaSEP,
}: {
  initialNoSEP?: string;
  /** Fokuskan kolom nomor saat terpasang (mis. dipilih dari riwayat). */
  fokusAwal?: boolean;
  onSuccess?: () => void;
  onBukaSEP?: (noSEP: string) => void;
}) {
  const id = useId();
  const sesi = useSessionOptional();
  const pengumum = useUmumkanGalat();
  const awal = initialNoSEP?.trim() ?? "";
  const awalValid = awal !== "" && !validateNoSEP(awal);

  const [noSep, setNoSep] = useState(awal);
  const [noTouched, setNoTouched] = useState(false);
  const [cek, setCek] = useState<Cek>(() => (awalValid ? { status: "loading", no: awal } : { status: "idle" }));
  const [isian, setIsian] = useState<IsianPulang>(ISIAN_KOSONG);
  const [touched, setTouched] = useState<Partial<Record<KolomPulang, boolean>>>({});
  const [kirim, setKirim] = useState<Kirim>({ status: "idle" });
  const req = useRef(0);
  const noRef = useRef<HTMLInputElement>(null);

  const terapkanCek = useCallback((hasil: Cek) => {
    setCek(hasil);
    if (hasil.status === "found") {
      setIsian(isianAwal(hasil.sep));
      setTouched({});
      setKirim({ status: "idle" });
    }
  }, []);

  // SEP dari URL (?update=) / riwayat → periksa otomatis sekali saat terpasang.
  useEffect(() => {
    if (!awalValid) return;
    const rid = ++req.current;
    void ambilSEP(awal).then((h) => {
      if (rid === req.current) terapkanCek(h);
    });
  }, [awal, awalValid, terapkanCek]);

  // ── Langkah 1: periksa SEP ──
  const errNo = noTouched ? validateNoSEP(noSep) : null;

  async function periksa(e?: FormEvent) {
    e?.preventDefault();
    setNoTouched(true);
    if (validateNoSEP(noSep)) {
      pengumum.tandaiDibacakan("no");
      noRef.current?.focus();
      return;
    }
    const no = noSep.trim();
    const rid = ++req.current;
    setCek({ status: "loading", no });
    setKirim({ status: "idle" });
    const h = await ambilSEP(no);
    if (rid === req.current) terapkanCek(h);
  }

  function ubahNo(v: string) {
    setNoSep(v);
    if (!validateNoSEP(v)) pengumum.bersihkan("no");
    // Nomor berubah → hasil periksa lama tak berlaku lagi (cegah menyimpan ke SEP lain).
    const diperiksa = cek.status === "found" ? cek.sep.noSEP : cek.status === "idle" ? null : cek.no;
    if (diperiksa !== null && v.trim() !== diperiksa) {
      req.current++;
      setCek({ status: "idle" });
      setKirim({ status: "idle" });
    }
  }

  // ── Langkah 2: isian ──
  const sep = cek.status === "found" ? cek.sep : null;
  const layak = sep ? kelayakanUpdate(sep) : null;
  const kll = sep ? sepKll(sep) : false;
  const meninggal = isian.status === "4";
  const semuaGalat = sep ? validasiPulang(isian, sep) : {};
  const galat = (k: KolomPulang) => (touched[k] ? (semuaGalat[k] ?? null) : null);
  const idDesk = (k: KolomPulang, hint?: boolean) =>
    [hint ? `${id}-${k}-hint` : null, galat(k) ? `${id}-${k}-err` : null].filter(Boolean).join(" ") || undefined;

  function setKolom(k: "noSurat" | "noLP", v: string) {
    setIsian((s) => ({ ...s, [k]: v }));
    if (kirim.status === "error") setKirim({ status: "idle" });
  }

  function pilihTanggal(k: "tglPulang" | "tglMeninggal", v: string) {
    const baru = { ...isian, [k]: v };
    setIsian(baru);
    setTouched((t) => ({ ...t, [k]: true }));
    const g = sep ? validasiPulang(baru, sep)[k] : undefined;
    if (g) pengumum.umumkan(g, k);
    else pengumum.bersihkan(k);
  }

  function blurTeks(k: "noSurat" | "noLP") {
    if (!isian[k]) return;
    setTouched((t) => ({ ...t, [k]: true }));
    const g = semuaGalat[k];
    if (g) pengumum.umumkan(g, k);
  }

  function pilihStatus(v: string) {
    const status = v as StatusPulangKode;
    setIsian((s) => ({
      ...s,
      status,
      // Meninggal: tanggal meninggal biasanya = tanggal pulang → isi awal, tetap bisa diubah.
      tglMeninggal: status === "4" && !s.tglMeninggal ? s.tglPulang : s.tglMeninggal,
    }));
  }

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (!sep || kirim.status === "loading") return;
    const g = validasiPulang(isian, sep);
    const salah = URUTAN_KOLOM.filter((k) => g[k]);
    if (salah.length > 0) {
      const tandai: Partial<Record<KolomPulang, boolean>> = {};
      for (const k of salah) {
        tandai[k] = true;
        pengumum.tandaiDibacakan(k);
      }
      setTouched((t) => ({ ...t, ...tandai }));
      document.getElementById(`${id}-${salah[0]}`)?.focus();
      return;
    }
    setKirim({ status: "loading" });
    try {
      const res = await updateTglPulang({
        noSep: sep.noSEP,
        tglPulang: isian.tglPulang,
        statusPulang: isian.status,
        noSuratMeninggal: meninggal ? isian.noSurat.trim() : undefined,
        tglMeninggal: meninggal ? isian.tglMeninggal : undefined,
        noLPManual: kll ? isian.noLP.trim() : undefined,
        user: sesi?.session?.username ?? "tanpa-sesi",
      });
      if (!res.ok) {
        setKirim({ status: "error", error: res.error });
        return;
      }
      setKirim({ status: "done", sep, isian });
      onSuccess?.();
    } catch {
      setKirim({ status: "error", error: GALAT_KONEKSI });
    }
  }

  function mulaiLagi() {
    req.current++;
    setNoSep("");
    setNoTouched(false);
    setCek({ status: "idle" });
    setIsian(ISIAN_KOSONG);
    setTouched({});
    setKirim({ status: "idle" });
    requestAnimationFrame(() => noRef.current?.focus());
  }

  // ── Tersimpan ──
  if (kirim.status === "done") {
    return <TglPulangTersimpan sep={kirim.sep} isian={kirim.isian} onBukaSEP={onBukaSEP} mulaiLagi={mulaiLagi} />;
  }

  const st = statusPulangMeta(isian.status);
  const lamaRawat = sep && isian.tglPulang && !semuaGalat.tglPulang ? labelLamaRawat(selisihHari(sep.tglTerbit, isian.tglPulang)) : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Langkah 1 — periksa SEP */}
      <form onSubmit={periksa} noValidate className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-no`} className="text-xs">
          Nomor SEP
        </Label>
        <div className="flex gap-2">
          <Input
            ref={noRef}
            id={`${id}-no`}
            autoFocus={fokusAwal}
            autoComplete="off"
            spellCheck={false}
            value={noSep}
            placeholder="Mis. SEP-2026-0501-00012"
            aria-invalid={Boolean(errNo)}
            aria-describedby={errNo ? `${id}-no-err` : undefined}
            onChange={(e) => ubahNo(e.target.value)}
            onBlur={() => {
              if (!noSep) return;
              setNoTouched(true);
              const g = validateNoSEP(noSep);
              if (g) pengumum.umumkan(g, "no");
            }}
            className={cn(INPUT_ISI, "flex-1 tracking-wide tabular-nums placeholder:tracking-normal")}
          />
          <Button
            type="submit"
            variant={sep ? "secondary" : "default"}
            disabled={cek.status === "loading"}
            className="h-10 rounded-xl px-3 text-xs font-semibold"
          >
            {cek.status === "loading" ? (
              <Spinner className="size-3.5" aria-hidden="true" />
            ) : (
              <Search className="size-3.5" aria-hidden="true" />
            )}
            Periksa
          </Button>
        </div>
        {errNo && <PesanGalat id={`${id}-no-err`}>{errNo}</PesanGalat>}
      </form>

      {/* Hasil periksa */}
      <AnimatePresence mode="wait" initial={false}>
        {cek.status === "loading" && (
          <motion.div key="memuat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span className="sr-only">Memeriksa SEP</span>
            <Skeleton className="h-40 rounded-xl" aria-hidden="true" />
          </motion.div>
        )}

        {cek.status === "error" && (
          <motion.div key="galat" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <GalatPeriksa error={cek.error} onUlang={() => void periksa()} />
          </motion.div>
        )}

        {sep && layak && (
          <motion.div
            key={`sep-${sep.noSEP}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <TglPulangSepRingkas sep={sep} onBukaSEP={onBukaSEP} />

            {!layak.ok ? (
              <Alert role="note" className={cn("rounded-xl border-0 p-3 [&>svg]:size-4", NADA_ALERT[layak.tone])}>
                <AlertTriangle aria-hidden="true" />
                <AlertTitle className="text-xs font-semibold">{layak.judul}</AlertTitle>
                <AlertDescription className="text-xs/relaxed text-current">
                  <p>{layak.alasan}</p>
                </AlertDescription>
              </Alert>
            ) : (
              /* Langkah 2 — isian */
              <form onSubmit={simpan} noValidate className="flex flex-col gap-4">
                {sep.tglPulang && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs/relaxed text-amber-900">
                    Tanggal pulang sudah tercatat{" "}
                    <strong className="font-semibold tabular-nums">{fmtTglPendek(sep.tglPulang)}</strong>. Menyimpan akan
                    menggantinya.
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">Kolom bertanda * wajib diisi</p>

                {/* Tanggal pulang */}
                <div className="flex flex-col gap-1.5">
                  <LabelWajib htmlFor={`${id}-tglPulang`} native={false}>
                    Tanggal pulang
                  </LabelWajib>
                  <p id={`${id}-tglPulang-hint`} className="text-[11px] text-muted-foreground">
                    Antara {fmtTglPendek(sep.tglTerbit)} (SEP terbit) dan hari ini
                  </p>
                  <DatePicker
                    id={`${id}-tglPulang`}
                    value={isian.tglPulang}
                    onChange={(v) => pilihTanggal("tglPulang", v)}
                    variant="filled"
                    clearable={false}
                    placeholder="Pilih tanggal pulang"
                    invalid={Boolean(galat("tglPulang"))}
                    ariaDescribedBy={idDesk("tglPulang", true)}
                  />
                  {galat("tglPulang") && <PesanGalat id={`${id}-tglPulang-err`}>{galat("tglPulang")}</PesanGalat>}
                </div>

                {/* Status pulang */}
                <div className="flex flex-col gap-1.5">
                  <LabelWajib id={`${id}-status-label`} native={false}>
                    Status pulang
                  </LabelWajib>
                  <RadioGroup
                    value={isian.status}
                    onValueChange={pilihStatus}
                    aria-labelledby={`${id}-status-label`}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                  >
                    {STATUS_PULANG.map((o) => {
                      const rid = `${id}-status-${o.value}`;
                      const mati = o.value === "4";
                      return (
                        <Label
                          key={o.value}
                          htmlFor={rid}
                          className={cn(
                            "cursor-pointer gap-2.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs leading-snug font-medium transition-colors hover:bg-slate-200/70",
                            mati
                              ? "has-data-[state=checked]:bg-rose-50 has-data-[state=checked]:text-rose-900"
                              : "has-data-[state=checked]:bg-emerald-50 has-data-[state=checked]:text-emerald-900",
                          )}
                        >
                          <RadioGroupItem
                            id={rid}
                            value={o.value}
                            className={cn("border-0 bg-white shadow-sm", mati && "[&_svg]:fill-rose-600")}
                          />
                          {o.label}
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </div>

                {/* Data kematian */}
                <AnimatePresence initial={false}>
                  {meninggal && (
                    <motion.div
                      key="meninggal"
                      role="group"
                      aria-labelledby={`${id}-mati-judul`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col gap-3 rounded-xl bg-rose-50/70 p-3"
                    >
                      <p id={`${id}-mati-judul`} className="flex items-center gap-1.5 text-xs font-semibold text-rose-900">
                        <FileWarning className="size-3.5" aria-hidden="true" />
                        Data kematian
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <LabelWajib htmlFor={`${id}-noSurat`}>No. surat keterangan kematian</LabelWajib>
                        <Input
                          id={`${id}-noSurat`}
                          required
                          value={isian.noSurat}
                          placeholder="Mis. SKM/2026/05/001"
                          aria-invalid={Boolean(galat("noSurat"))}
                          aria-describedby={idDesk("noSurat")}
                          onChange={(e) => {
                            setKolom("noSurat", e.target.value);
                            if (e.target.value.trim()) pengumum.bersihkan("noSurat");
                          }}
                          onBlur={() => blurTeks("noSurat")}
                          className={cn(INPUT_ISI, "bg-white hover:bg-white")}
                        />
                        {galat("noSurat") && <PesanGalat id={`${id}-noSurat-err`}>{galat("noSurat")}</PesanGalat>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <LabelWajib htmlFor={`${id}-tglMeninggal`} native={false}>
                          Tanggal meninggal
                        </LabelWajib>
                        <p id={`${id}-tglMeninggal-hint`} className="text-[11px] text-rose-900/70">
                          Tidak boleh setelah tanggal pulang
                        </p>
                        <DatePicker
                          id={`${id}-tglMeninggal`}
                          value={isian.tglMeninggal}
                          onChange={(v) => pilihTanggal("tglMeninggal", v)}
                          variant="filled"
                          clearable={false}
                          placeholder="Pilih tanggal meninggal"
                          invalid={Boolean(galat("tglMeninggal"))}
                          ariaDescribedBy={idDesk("tglMeninggal", true)}
                        />
                        {galat("tglMeninggal") && (
                          <PesanGalat id={`${id}-tglMeninggal-err`}>{galat("tglMeninggal")}</PesanGalat>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* SEP KLL */}
                {kll && (
                  <div className="flex flex-col gap-1.5 rounded-xl bg-amber-50/70 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                      <CarFront className="size-3.5" aria-hidden="true" />
                      SEP kecelakaan lalu lintas
                    </p>
                    <LabelWajib htmlFor={`${id}-noLP`}>No. laporan polisi</LabelWajib>
                    <Input
                      id={`${id}-noLP`}
                      required
                      value={isian.noLP}
                      placeholder="Mis. LP/123/V/2026/Lantas"
                      aria-invalid={Boolean(galat("noLP"))}
                      aria-describedby={idDesk("noLP")}
                      onChange={(e) => {
                        setKolom("noLP", e.target.value);
                        if (e.target.value.trim()) pengumum.bersihkan("noLP");
                      }}
                      onBlur={() => blurTeks("noLP")}
                      className={cn(INPUT_ISI, "bg-white tabular-nums hover:bg-white")}
                    />
                    {galat("noLP") && <PesanGalat id={`${id}-noLP-err`}>{galat("noLP")}</PesanGalat>}
                  </div>
                )}

                {/* Ringkasan yang akan dikirim */}
                <AnimatePresence initial={false}>
                  {lamaRawat && (
                    <motion.div
                      key="ringkas"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl p-3",
                        meninggal ? "bg-rose-50 text-rose-950" : "bg-emerald-50 text-emerald-950",
                      )}
                    >
                      <CalendarCheck className="size-4 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums">Pulang {fmtTgl(isian.tglPulang)}</p>
                        <p className="text-xs opacity-80">
                          {lamaRawat}
                          {st ? ` · ${st.ringkas}` : ""}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {kirim.status === "error" && <GalatKirim error={kirim.error} />}

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="submit" size="sm" disabled={kirim.status === "loading"} className="h-8 text-xs">
                    {kirim.status === "loading" ? (
                      <>
                        <Spinner className="size-3.5" aria-hidden="true" />
                        Menyimpan…
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="size-3.5" aria-hidden="true" />
                        Simpan tanggal pulang
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => {
                      noRef.current?.focus();
                      noRef.current?.select();
                    }}
                  >
                    Ganti SEP
                  </Button>
                  <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">Hari ini {fmtTglPendek(hariIniISO())}</span>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hasil "Periksa" dibacakan (langkah 2 muncul tanpa memindahkan fokus). */}
      <p role="status" className="sr-only">
        {sep && layak
          ? `SEP ${sep.noSEP} ditemukan${layak.ok ? ", isi tanggal pulang di bawahnya" : `. ${layak.judul}`}`
          : cek.status === "error"
            ? errorLabel(cek.error).title
            : ""}
      </p>
      {/* Satu live region untuk galat yang muncul saat blur / memilih tanggal. */}
      <p aria-live="polite" className="sr-only">
        {pengumum.teks}
      </p>
    </div>
  );
}
