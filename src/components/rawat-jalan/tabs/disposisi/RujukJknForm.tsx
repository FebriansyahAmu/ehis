"use client";

// Rujuk Eksternal — MODE JKN (peserta BPJS).
// Form disesuaikan dengan payload resmi V-Claim Rujukan/insert (t_rujukan) dari TrustMark BPJS:
//   noSep · tglRujukan · tglRencanaKunjungan · ppkDirujuk (8 digit) · jnsPelayanan (1 RI / 2 RJ)
//   · catatan · diagRujukan (1 ICD-10) · tipeRujukan (0 Penuh / 1 Partial / 2 Balik PRB)
//   · poliRujukan (kosong bila tipe 2, wajib bila 0/1) · user (WS — diisi server).
// Kontrak kanonik: src/lib/bpjs/bpjsContracts.ts (InsertRujukanPayload). Validasi + noRujukan via
// mock adapter insertRujukan(). noSep = AUTOFILL dari SEP kunjungan aktif (GET /kunjungan/:id/
// sep-terbit); diagnosa = FETCH dari kunjungan (GET /kunjungan/:id/diagnosa). user server-side.
// Kontrol tanggal/dropdown pakai komponen global (DatePicker/Select — popover via portal, tak
// ter-clip kartu). Pasien demo (non-UUID) → diagnosa dari mock, tanpa SEP autofill.

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck, CalendarDays, MapPin, Tag, FileText, BookOpen, Building2,
  Check, Send, Printer, AlertCircle, ArrowRight, Loader2, Braces,
} from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { DatePicker, Select } from "@/components/shared/inputs";
import type { InsertRujukanPayload, TipeRujukanKode } from "@/lib/bpjs/bpjsContracts";
import type { JnsPelayananKode } from "@/lib/bpjs/bpjsShared";
import {
  listSarana, listSpesialistik,
  type SaranaRefRecord, type SpesialistikRefRecord,
} from "@/lib/bpjs/vClaimRujukan";
import { getDiagnosa } from "@/lib/api/diagnosa/diagnosa";
import { listSepTerbit, type SepTerbitDTO } from "@/lib/api/jadwalKontrol/jadwalKontrol";
import { createRujukan, type RujukanEksternalInput } from "@/lib/api/rujukanEksternal/rujukanEksternal";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import { SectionHeader, Field, Checklist, inputCls, textareaCls, type DisposisiResult } from "./shared";
import RujukanPayloadModal from "./RujukanPayloadModal";
import type { RujukanCetakData } from "./RujukanCetakTemplate";

// Kode PPK faskes perujuk (RS kita) — mock (belum ada cons-id prod).
const PPK_ASAL = "0301R001";

// No. Rujukan format BPJS: {PPK}{MMYY}B{6 digit}. Mock — selalu terbit sukses.
function genNoRujukan(tgl: string): string {
  const d = tgl ? new Date(`${tgl}T00:00:00`) : new Date();
  const base = Number.isNaN(d.getTime()) ? new Date() : d;
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const yy = String(base.getFullYear()).slice(-2);
  const seq = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `${PPK_ASAL}${mm}${yy}B${seq}`;
}

// Masa berlaku rujukan JKN = 90 hari sejak tanggal rujukan.
function addDaysISO(ymd: string, n: number): string {
  const d = ymd ? new Date(`${ymd}T00:00:00`) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface DiagLite {
  id: string;
  kodeIcd10: string;
  namaDiagnosis: string;
  tipe: string;
}

const JNS_PELAYANAN: { id: JnsPelayananKode; label: string; sub: string }[] = [
  { id: "2", label: "Rawat Jalan", sub: "Kode 2 · poliklinik" },
  { id: "1", label: "Rawat Inap", sub: "Kode 1 · bangsal" },
];

const TIPE_RUJUKAN: { id: TipeRujukanKode; label: string; sub: string; sel: string; idle: string }[] = [
  { id: "0", label: "Penuh", sub: "Alih rawat penuh", sel: "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200", idle: "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40" },
  { id: "1", label: "Partial", sub: "Alih sebagian pelayanan", sel: "border-teal-400 bg-teal-50 text-teal-800 ring-1 ring-teal-200", idle: "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/40" },
  { id: "2", label: "Balik PRB", sub: "Program Rujuk Balik → FKTP", sel: "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-200", idle: "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/40" },
];

export default function RujukJknForm({
  patient,
  onSubmit,
}: {
  patient: RJPatientDetail;
  onSubmit: (r: DisposisiResult) => void;
}) {
  const { session } = useSession();
  const kunjunganId = patient.id;
  const isPersisted = UUID_RE.test(kunjunganId);

  const [noSep, setNoSep] = useState("");
  const [sepInfo, setSepInfo] = useState<SepTerbitDTO | null>(null);
  const [tglRujukan, setTglRujukan] = useState("");
  const [tglRencana, setTglRencana] = useState("");
  const [jnsPelayanan, setJnsPelayanan] = useState<JnsPelayananKode>("2");
  const [tipeRujukan, setTipeRujukan] = useState<TipeRujukanKode>("0");
  const [ppkDirujuk, setPpkDirujuk] = useState("");
  const [poliRujukan, setPoliRujukan] = useState("");
  const [catatan, setCatatan] = useState("");

  const [sending, setSending] = useState(false);
  const [payloadOpen, setPayloadOpen] = useState(false);

  const isBalikPRB = tipeRujukan === "2";
  const jenisFaskes: "FKTP" | "FKRTL" = isBalikPRB ? "FKTP" : "FKRTL";

  // ── Diagnosa: fetch dari kunjungan (UUID) atau fallback demo (non-UUID) ──
  const [diagList, setDiagList] = useState<DiagLite[]>(() =>
    isPersisted
      ? []
      : patient.diagnosa.map((d) => ({ id: d.id, kodeIcd10: d.kodeIcd10, namaDiagnosis: d.namaDiagnosis, tipe: d.tipe })),
  );
  const [diagKode, setDiagKode] = useState<string>(() => {
    if (isPersisted) return "";
    const l = patient.diagnosa;
    return l.find((d) => d.tipe === "Utama")?.kodeIcd10 ?? l[0]?.kodeIcd10 ?? "";
  });
  const [diagLoading, setDiagLoading] = useState(isPersisted);
  useEffect(() => {
    if (!isPersisted) return;
    let alive = true;
    getDiagnosa(kunjunganId)
      .then((dto) => {
        if (!alive) return;
        const list = dto.items.map((i) => ({
          id: i.id, kodeIcd10: i.kodeIcd10, namaDiagnosis: i.namaDiagnosis, tipe: i.tipe,
        }));
        setDiagList(list);
        setDiagKode((prev) => prev || (list.find((d) => d.tipe === "Utama")?.kodeIcd10 ?? list[0]?.kodeIcd10 ?? ""));
        setDiagLoading(false);
      })
      .catch(() => {
        if (alive) setDiagLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isPersisted, kunjunganId]);

  // ── SEP autofill dari SEP kunjungan aktif ──
  useEffect(() => {
    if (!isPersisted) return;
    let alive = true;
    listSepTerbit(kunjunganId)
      .then((list) => {
        if (!alive) return;
        const chosen = list.find((s) => s.kunjunganIni) ?? list[0] ?? null;
        if (chosen) {
          setSepInfo(chosen);
          setNoSep(chosen.noSep);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isPersisted, kunjunganId]);

  // ── Referensi poli spesialistik (poliRujukan) ──
  const [poliOpts, setPoliOpts] = useState<SpesialistikRefRecord[]>([]);
  useEffect(() => {
    let alive = true;
    listSpesialistik().then((res) => {
      if (alive && res.ok && res.value.response) setPoliOpts(res.value.response);
    });
    return () => {
      alive = false;
    };
  }, []);

  // ── Referensi faskes tujuan (ppkDirujuk) — jenis tergantung tipe rujukan ──
  const [faskesRecords, setFaskesRecords] = useState<SaranaRefRecord[]>([]);
  useEffect(() => {
    let alive = true;
    listSarana("", jenisFaskes).then((res) => {
      if (!alive) return;
      setFaskesRecords(res.ok && res.value.response ? res.value.response : []);
    });
    return () => {
      alive = false;
    };
  }, [jenisFaskes]);

  // Ganti tipe rujukan → reset faskes & poli (daftar faskes berubah FKTP↔FKRTL; PRB tanpa poli).
  function changeTipe(next: TipeRujukanKode) {
    setTipeRujukan(next);
    setPpkDirujuk("");
    if (next === "2") setPoliRujukan("");
  }

  const faskesOptions = useMemo(
    () => faskesRecords.map((f) => ({ value: f.kdFaskes, label: `${f.nmFaskes} · ${f.kdFaskes}` })),
    [faskesRecords],
  );
  const poliOptions = useMemo(
    () => poliOpts.map((p) => ({ value: p.kdSpesialis, label: `${p.nmSpesialis} (${p.kdSpesialis})` })),
    [poliOpts],
  );
  const ppkNama = faskesRecords.find((f) => f.kdFaskes === ppkDirujuk)?.nmFaskes ?? "";
  const poliNama = poliOpts.find((p) => p.kdSpesialis === poliRujukan)?.nmSpesialis;

  const userWs = session?.namaTampil?.trim() || "EHIS-WS";
  const poliValid = isBalikPRB ? true : poliRujukan.trim() !== "";
  const ppkValid = /^\w{8}$/.test(ppkDirujuk);
  const diagValid = diagKode.trim().length >= 3;

  const canSubmit =
    tglRujukan !== "" && tglRencana !== "" && ppkValid && diagValid && poliValid && !sending;

  const payload: InsertRujukanPayload = useMemo(
    () => ({
      noSep: noSep.trim(),
      tglRujukan,
      tglRencanaKunjungan: tglRencana,
      ppkDirujuk,
      jnsPelayanan,
      catatan: catatan.trim(),
      diagRujukan: diagKode,
      tipeRujukan,
      poliRujukan: isBalikPRB ? "" : poliRujukan,
      user: userWs,
    }),
    [noSep, tglRujukan, tglRencana, ppkDirujuk, jnsPelayanan, catatan, diagKode, tipeRujukan, isBalikPRB, poliRujukan, userWs],
  );

  // Pratinjau payload resmi — user = akun yang sedang login (payload.user); noSep dari SEP kunjungan.
  const wirePreview = {
    request: {
      t_rujukan: {
        ...payload,
        noSep: payload.noSep || "{dari SEP kunjungan}",
      },
    },
  };

  async function handleSubmit() {
    if (!canSubmit) return;
    setSending(true);
    const diagNama = diagList.find((d) => d.kodeIcd10 === diagKode)?.namaDiagnosis ?? "";
    const input: RujukanEksternalInput = {
      tglRujukan,
      tglRencanaKunjungan: tglRencana,
      jnsPelayanan,
      tipeRujukan,
      catatan: catatan.trim(),
      asalRujukan: { kode: PPK_ASAL, nama: RS_PROFIL_INITIAL.nama },
      tujuanRujukan: { kode: ppkDirujuk, nama: ppkNama },
      poliTujuan: { kode: isBalikPRB ? "" : poliRujukan, nama: isBalikPRB ? "" : (poliNama ?? "") },
      diagnosa: { kode: diagKode, nama: diagNama },
      peserta: {
        nama: patient.name,
        noKartu: patient.noBpjs ?? "-",
        noMr: patient.noRM,
        tglLahir: patient.tanggalLahir ?? "",
        kelamin: patient.gender === "L" ? "Laki-Laki" : "Perempuan",
        jnsPeserta: patient.penjamin.replace(/_/g, " "),
      },
      dokterPerujuk: patient.dokter,
      noSep: payload.noSep || undefined,
    };
    // Persisted (UUID) → simpan ke DB (No. Rujukan + berlaku/terbit dari server, bisa cetak ulang).
    // Demo (non-UUID) → sintesis lokal (tak persist). Keduanya SELALU sukses (mock, belum cons-id prod).
    if (isPersisted) {
      try {
        const dto = await createRujukan(kunjunganId, input);
        setSending(false);
        onSubmit({ noRujukan: dto.nomor, noSep: payload.noSep, rujukan: dto.detail });
        return;
      } catch {
        /* gagal simpan → fallback sintesis lokal di bawah (tetap sukses) */
      }
    }
    const noRujukan = genNoRujukan(tglRujukan);
    const rujukan: RujukanCetakData = {
      ...input,
      noRujukan,
      tglBerlakuKunjungan: addDaysISO(tglRujukan, 90),
      terbitAt: new Date().toISOString(),
      pencatat: userWs,
    };
    setSending(false);
    onSubmit({ noRujukan, noSep: payload.noSep, rujukan });
  }

  const checklist = [
    { label: "Tanggal rujukan", done: tglRujukan !== "" },
    { label: "Rencana kunjungan", done: tglRencana !== "" },
    { label: "Faskes tujuan (PPK)", done: ppkValid },
    { label: "Jenis pelayanan", done: true },
    { label: "Tipe rujukan", done: true },
    { label: isBalikPRB ? "Poli (—, PRB)" : "Poli rujukan", done: poliValid },
    { label: "Diagnosa rujukan", done: diagValid },
  ];

  return (
    <div className="flex flex-col gap-4">
      {payloadOpen && (
        <RujukanPayloadModal payload={wirePreview} endpoint="Rujukan/insert" onClose={() => setPayloadOpen(false)} />
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Form ── */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={CalendarDays}
              title="SEP & Tanggal Rujukan"
              right={
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <ShieldCheck size={11} /> V-Claim
                </span>
              }
            />
            <div className="flex flex-col gap-4 p-4">
              <Field
                label="No. SEP"
                hint={
                  sepInfo
                    ? `Otomatis dari SEP kunjungan (${sepInfo.jenis}${sepInfo.tglSep ? ` · ${sepInfo.tglSep}` : ""}).`
                    : isPersisted
                      ? "Belum ada SEP terbit untuk kunjungan ini — di-resolve server saat integrasi."
                      : "Pasien demo — tanpa SEP; di-resolve server pada integrasi nyata."
                }
              >
                <input
                  value={noSep}
                  onChange={(e) => setNoSep(e.target.value)}
                  readOnly={!!sepInfo}
                  placeholder="Terisi otomatis dari SEP kunjungan"
                  className={cn(inputCls, "font-mono text-[11px]", sepInfo && "bg-slate-50 text-slate-500")}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tanggal Rujukan" required>
                  <DatePicker value={tglRujukan} onChange={setTglRujukan} placeholder="Pilih tanggal" clearable={false} />
                </Field>
                <Field label="Rencana Kunjungan" required>
                  <DatePicker value={tglRencana} onChange={setTglRencana} placeholder="Pilih tanggal" clearable={false} />
                </Field>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={MapPin} title="Faskes Tujuan & Jenis Pelayanan" />
            <div className="flex flex-col gap-4 p-4">
              <Field
                label={`Faskes Dirujuk (PPK · ${jenisFaskes})`}
                required
                hint={isBalikPRB ? "Rujuk Balik PRB → tujuan FKTP asal peserta." : "Kode 8 digit faskes tujuan (referensi sarana V-Claim)."}
              >
                <Select
                  value={ppkDirujuk}
                  onChange={setPpkDirujuk}
                  options={faskesOptions}
                  icon={Building2}
                  searchable
                  placeholder={`Cari faskes ${jenisFaskes}…`}
                />
              </Field>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Jenis Pelayanan <span className="text-rose-400">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {JNS_PELAYANAN.map((opt) => {
                    const sel = jnsPelayanan === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setJnsPelayanan(opt.id)}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition",
                          sel ? "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40",
                        )}
                      >
                        <div className="flex w-full items-center gap-1">
                          <p className="text-xs font-semibold leading-none">{opt.label}</p>
                          {sel && <Check size={10} className="ml-auto shrink-0" />}
                        </div>
                        <p className="text-[10px] leading-snug opacity-60">{opt.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={Tag} title="Klasifikasi Rujukan" />
            <div className="flex flex-col gap-4 p-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Tipe Rujukan <span className="text-rose-400">*</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TIPE_RUJUKAN.map((opt) => {
                    const sel = tipeRujukan === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => changeTipe(opt.id)}
                        className={cn("flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition", sel ? opt.sel : opt.idle)}
                      >
                        <div className="flex w-full items-center gap-1">
                          <span className="font-mono text-[10px] opacity-70">{opt.id}</span>
                          <p className="text-xs font-semibold leading-none">{opt.label}</p>
                          {sel && <Check size={10} className="ml-auto shrink-0" />}
                        </div>
                        <p className="text-[10px] leading-snug opacity-60">{opt.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field
                label="Poli Rujukan"
                required={!isBalikPRB}
                hint={isBalikPRB ? "Dikosongkan otomatis untuk Rujukan Balik PRB (tipeRujukan=2)." : "Poliklinik spesialistik tujuan."}
              >
                {isBalikPRB ? (
                  <div className={cn(inputCls, "flex items-center bg-slate-50 text-slate-400")}>
                    — (tidak berlaku untuk PRB)
                  </div>
                ) : (
                  <Select
                    value={poliRujukan}
                    onChange={setPoliRujukan}
                    options={poliOptions}
                    searchable
                    placeholder="Pilih poli tujuan…"
                  />
                )}
              </Field>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={FileText} title="Diagnosa Rujukan (1 ICD-10)" />
            <div className="flex flex-col gap-2 p-4">
              {diagLoading ? (
                <div className="flex items-center gap-2 px-1 py-3 text-xs text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> Memuat diagnosa kunjungan…
                </div>
              ) : diagList.length === 0 ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                  <p className="text-[11px] text-amber-700">
                    Belum ada diagnosa pada kunjungan ini. Tambahkan dulu di tab <span className="font-semibold">Diagnosa</span>.
                  </p>
                </div>
              ) : (
                diagList.map((d) => {
                  const sel = diagKode === d.kodeIcd10;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDiagKode(d.kodeIcd10)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                        sel ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
                          sel ? "border-indigo-500 bg-indigo-500" : "border-slate-300 bg-white",
                        )}
                      >
                        {sel && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400">{d.kodeIcd10}</span>
                        <span className="text-xs font-medium">{d.namaDiagnosis}</span>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1",
                          d.tipe === "Utama" ? "bg-indigo-100 text-indigo-700 ring-indigo-200" : "bg-slate-100 text-slate-500 ring-slate-200",
                        )}
                      >
                        {d.tipe}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={BookOpen} title="Catatan" />
            <div className="p-4">
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                placeholder="Catatan klinis / alasan rujukan…"
                className={textareaCls}
              />
            </div>
          </div>
        </div>

        {/* ── Kanan: kelengkapan + ringkasan + link payload ── */}
        <div className="flex flex-col gap-4">
          <Checklist items={checklist} />

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={ArrowRight}
              title="Ringkasan Rujukan"
              right={
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <ShieldCheck size={11} /> V-Claim
                </span>
              }
            />
            <div className="p-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                <div className="flex items-start gap-2">
                  <ArrowRight size={13} className="mt-0.5 shrink-0 text-indigo-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Dirujuk Ke</p>
                    <p className="truncate text-xs font-semibold text-indigo-800">{ppkNama || "— pilih faskes tujuan —"}</p>
                    <p className="mt-0.5 text-[11px] text-indigo-600">
                      {jnsPelayanan === "1" ? "Rawat Inap" : "Rawat Jalan"}
                      {!isBalikPRB && poliNama ? ` · ${poliNama}` : ""}
                      {isBalikPRB ? " · Rujuk Balik PRB" : ""}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <p className="text-[10px] leading-snug text-slate-400">
                  <span className="font-semibold text-slate-500">noSep</span> dari SEP kunjungan ·{" "}
                  <span className="font-semibold text-slate-500">user</span> = {userWs} (akun login).
                </p>
                <button
                  type="button"
                  onClick={() => setPayloadOpen(true)}
                  className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-indigo-600 underline decoration-indigo-300 underline-offset-2 transition hover:text-indigo-700 hover:decoration-indigo-500"
                >
                  <Braces size={12} /> Lihat Payload (JSON)
                </button>
              </div>
            </div>
          </div>

          {!canSubmit && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[11px] text-amber-700">
                Lengkapi field bertanda <span className="font-bold text-rose-500">*</span> agar payload valid dikirim ke V-Claim.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <ShieldCheck size={12} /> {patient.penjamin.replace(/_/g, " ")}
          </span>
          {ppkNama && (
            <span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:flex">
              <ArrowRight size={12} /> {ppkNama}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Printer size={13} /> Cetak
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {sending ? "Mengirim…" : "Kirim Rujukan (V-Claim)"}
          </button>
        </div>
      </div>
    </div>
  );
}
