"use client";

// Rujuk Eksternal — MODE JKN (peserta BPJS).
// Form disesuaikan dengan payload resmi V-Claim Rujukan/insert (t_rujukan) dari TrustMark BPJS:
//   noSep · tglRujukan · tglRencanaKunjungan · ppkDirujuk (8 digit) · jnsPelayanan (1 RI / 2 RJ)
//   · catatan · diagRujukan (1 ICD-10) · tipeRujukan (0 Penuh / 1 Partial / 2 Balik PRB)
//   · poliRujukan (kosong bila tipe 2, wajib bila 0/1) · user (WS — diisi server).
// Kontrak kanonik: src/lib/bpjs/bpjsContracts.ts (InsertRujukanPayload). Validasi + noRujukan via
// mock adapter insertRujukan(). noSep & user = server-authoritative (ditandai di pratinjau payload).

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck, CalendarDays, MapPin, Tag, FileText, BookOpen, Building2,
  Search, Check, Send, Printer, AlertCircle, ArrowRight, Loader2, Braces,
} from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import type { InsertRujukanPayload, TipeRujukanKode } from "@/lib/bpjs/bpjsContracts";
import type { JnsPelayananKode } from "@/lib/bpjs/bpjsShared";
import {
  insertRujukan, listSarana, listSpesialistik,
  type SaranaRefRecord, type SpesialistikRefRecord,
} from "@/lib/bpjs/vClaimRujukan";
import {
  SectionHeader, Field, Checklist, inputCls, textareaCls, selectCls,
} from "./shared";
import RujukanPayloadModal from "./RujukanPayloadModal";

const today = () => new Date().toISOString().slice(0, 10);

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
  onSubmit: (r: { noRujukan?: string; noSep?: string }) => void;
}) {
  const { session } = useSession();
  const utamaDiag = patient.diagnosa.find((d) => d.tipe === "Utama") ?? patient.diagnosa[0];

  const [noSep, setNoSep] = useState("");
  const [tglRujukan, setTglRujukan] = useState(today());
  const [tglRencana, setTglRencana] = useState(today());
  const [jnsPelayanan, setJnsPelayanan] = useState<JnsPelayananKode>("2");
  const [tipeRujukan, setTipeRujukan] = useState<TipeRujukanKode>("0");
  const [ppkDirujuk, setPpkDirujuk] = useState("");
  const [ppkNama, setPpkNama] = useState("");
  const [poliRujukan, setPoliRujukan] = useState("");
  const [diagKode, setDiagKode] = useState(utamaDiag?.kodeIcd10 ?? "");
  const [catatan, setCatatan] = useState("");

  const [sending, setSending] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [payloadOpen, setPayloadOpen] = useState(false);

  const isBalikPRB = tipeRujukan === "2";
  const jenisFaskes: "FKTP" | "FKRTL" = isBalikPRB ? "FKTP" : "FKRTL";

  // Referensi poli spesialistik (untuk poliRujukan).
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

  // Faskes tujuan (ppkDirujuk) — pencarian referensi sarana, jenis tergantung tipe rujukan.
  const [faskesQuery, setFaskesQuery] = useState("");
  const [faskesOpts, setFaskesOpts] = useState<SaranaRefRecord[]>([]);
  const [faskesOpen, setFaskesOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    listSarana(faskesQuery.trim(), jenisFaskes).then((res) => {
      if (!alive) return;
      setFaskesOpts(res.ok && res.value.response ? res.value.response : []);
    });
    return () => {
      alive = false;
    };
  }, [faskesQuery, jenisFaskes]);

  // Ganti tipe rujukan → reset faskes & poli (daftar faskes berubah FKTP↔FKRTL; PRB tanpa poli).
  function changeTipe(next: TipeRujukanKode) {
    setTipeRujukan(next);
    setPpkDirujuk("");
    setPpkNama("");
    setFaskesQuery("");
    if (next === "2") setPoliRujukan("");
  }

  function pickFaskes(f: SaranaRefRecord) {
    setPpkDirujuk(f.kdFaskes);
    setPpkNama(f.nmFaskes);
    setFaskesQuery(f.nmFaskes);
    setFaskesOpen(false);
  }

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

  // Pratinjau payload resmi — noSep & user server-authoritative (placeholder bila kosong).
  const wirePreview = {
    request: {
      t_rujukan: {
        ...payload,
        noSep: payload.noSep || "{dari SEP kunjungan — server}",
        user: "{user WS — server}",
      },
    },
  };

  async function handleSubmit() {
    if (!canSubmit) return;
    setSending(true);
    setErrMsg(null);
    const res = await insertRujukan(payload);
    setSending(false);
    if (res.ok && res.value.metaData.code === "200" && res.value.response) {
      onSubmit({ noRujukan: res.value.response.noRujukan, noSep: payload.noSep });
    } else {
      const msg = res.ok
        ? res.value.metaData.message
        : "message" in res.error
          ? res.error.message
          : undefined;
      setErrMsg(msg ?? "Gagal mengirim rujukan ke V-Claim.");
    }
  }

  const poliNama = poliOpts.find((p) => p.kdSpesialis === poliRujukan)?.nmSpesialis;
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
              <Field label="No. SEP" hint="Otomatis dari SEP kunjungan aktif saat integrasi V-Claim — biarkan kosong bila belum tersedia.">
                <input
                  value={noSep}
                  onChange={(e) => setNoSep(e.target.value)}
                  placeholder="Terisi otomatis dari SEP kunjungan"
                  className={cn(inputCls, "font-mono text-[11px]")}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tanggal Rujukan" required>
                  <input type="date" value={tglRujukan} onChange={(e) => setTglRujukan(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Rencana Kunjungan" required>
                  <input type="date" value={tglRencana} onChange={(e) => setTglRencana(e.target.value)} className={inputCls} />
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
                <div className="relative">
                  <div className="relative">
                    <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={faskesQuery}
                      onChange={(e) => {
                        setFaskesQuery(e.target.value);
                        setFaskesOpen(true);
                        if (ppkDirujuk) {
                          setPpkDirujuk("");
                          setPpkNama("");
                        }
                      }}
                      onFocus={() => setFaskesOpen(true)}
                      placeholder={`Cari nama ${jenisFaskes}…`}
                      className={cn(inputCls, "pl-8")}
                    />
                  </div>
                  {faskesOpen && faskesOpts.length > 0 && !ppkDirujuk && (
                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      {faskesOpts.map((f) => (
                        <button
                          key={f.kdFaskes}
                          type="button"
                          onClick={() => pickFaskes(f)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-indigo-50"
                        >
                          <Building2 size={13} className="shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-700">{f.nmFaskes}</p>
                            {f.alamat && <p className="truncate text-[10px] text-slate-400">{f.alamat}</p>}
                          </div>
                          <span className="shrink-0 font-mono text-[10px] text-slate-400">{f.kdFaskes}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {ppkDirujuk && (
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-1.5">
                    <Check size={12} className="shrink-0 text-indigo-500" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-indigo-800">{ppkNama}</span>
                    <span className="shrink-0 font-mono text-[10px] text-indigo-500">{ppkDirujuk}</span>
                  </div>
                )}
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
                <select
                  value={poliRujukan}
                  onChange={(e) => setPoliRujukan(e.target.value)}
                  disabled={isBalikPRB}
                  className={selectCls}
                >
                  <option value="">{isBalikPRB ? "— (tidak berlaku untuk PRB)" : "Pilih poli tujuan…"}</option>
                  {poliOpts.map((p) => (
                    <option key={p.kdSpesialis} value={p.kdSpesialis}>
                      {p.nmSpesialis} ({p.kdSpesialis})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon={FileText} title="Diagnosa Rujukan (1 ICD-10)" />
            <div className="flex flex-col gap-2 p-4">
              {patient.diagnosa.map((d) => {
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
              })}
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

        {/* ── Kanan: kelengkapan + pratinjau payload ── */}
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
                  <span className="font-semibold text-slate-500">noSep</span> &amp;{" "}
                  <span className="font-semibold text-slate-500">user</span> diisi server (anti-spoof).
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

          {errMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-rose-500" />
              <p className="text-[11px] text-rose-700">{errMsg}</p>
            </div>
          )}
          {!canSubmit && !errMsg && (
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
