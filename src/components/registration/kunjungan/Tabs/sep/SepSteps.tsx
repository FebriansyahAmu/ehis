"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, User, Calendar, ShieldCheck } from "lucide-react";
import {
  type SepDraft, sInp, R_JNS, R_LAKA, R_KLS, R_TUJUAN_KUNJ, R_ASAL_RUJUKAN,
  TUJUAN_KUNJ_OPTS, FLAG_PROCEDURE_OPTS, KD_PENUNJANG_OPTS, ASSESMENT_PEL_OPTS, labelOf,
} from "./sepTypes";
import { SepField, Chips, RvItem, RvSection2 } from "./SepShared";
import { DatePicker } from "@/components/registration/patient/modals/daftar-kunjungan/DatePicker";
import { Select } from "@/components/registration/patient/modals/daftar-kunjungan/Select";

// ─── Step 2: Kunjungan ────────────────────────────────────────

export function SepStep2({ draft, setDraft }: {
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
}) {
  const set      = <K extends keyof SepDraft>(k: K, v: SepDraft[K]) => setDraft(d => ({ ...d, [k]: v }));
  const klsLabel = ({ "1": "Kelas I", "2": "Kelas II", "3": "Kelas III" } as Record<string, string>)[draft.klsRawatHak] ?? "—";

  // Tujuan kunjungan mengatur field bergantung (flagProcedure/kdPenunjang hanya untuk Prosedur).
  const setTujuan = (v: "0" | "1" | "2") => setDraft(d => ({
    ...d,
    tujuanKunj: v,
    flagProcedure: v === "1" ? (d.flagProcedure || "0") : "",
    kdPenunjang:   v === "1" ? d.kdPenunjang : "",
    assesmentPel:  v === "1" ? "" : d.assesmentPel,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 rounded-xl bg-sky-50 px-3.5 py-2.5 ring-1 ring-sky-100">
        <CheckCircle2 size={14} className="shrink-0 text-sky-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-sky-800">{draft.namaPeserta}</p>
          <p className="font-mono text-[9.5px] text-sky-500">{draft.noKartu}</p>
        </div>
        <span className="shrink-0 rounded-md bg-sky-100 px-2 py-0.5 text-[9.5px] font-bold text-sky-600">
          {klsLabel}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <SepField label="Tanggal SEP">
            <DatePicker variant="filled" value={draft.tglSep} onChange={v => set("tglSep", v)} />
          </SepField>
          <SepField label="Jenis Pelayanan">
            <Chips options={[{ value: "2", label: "Rawat Jalan" }, { value: "1", label: "Rawat Inap" }]}
              value={draft.jnsPelayanan} onChange={v => set("jnsPelayanan", v as "1" | "2")} />
          </SepField>
          <SepField label="Kode PPK Pelayanan">
            <input className={sInp} value={draft.ppkPelayanan} placeholder="Kode faskes..."
              onChange={e => set("ppkPelayanan", e.target.value)} />
          </SepField>
          <SepField label="No. Medical Record">
            <input className={sInp} value={draft.noMR} placeholder="No. RM pasien..."
              onChange={e => set("noMR", e.target.value)} />
          </SepField>
          <SepField label="Kelas Rawat Hak">
            <div className="flex h-10 items-center rounded-xl bg-slate-100 px-3">
              <span className="text-[13px] font-semibold text-slate-600">{klsLabel}</span>
              <span className="ml-auto text-[9px] text-slate-400">dari BPJS</span>
            </div>
          </SepField>
          <SepField label="Naik Kelas">
            <Chips options={[{ value: "false", label: "Tidak" }, { value: "true", label: "Ya" }]}
              value={String(draft.naikKelas)} onChange={v => set("naikKelas", v === "true")} />
          </SepField>
        </div>
      </div>

      <AnimatePresence>
        {draft.naikKelas && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="grid grid-cols-3 gap-3 overflow-hidden rounded-xl border border-amber-100 bg-amber-50/40 p-4"
          >
            <SepField label="Kelas Naik">
              <Select variant="filled" value={draft.klsRawatNaik} placeholder="Pilih..."
                onChange={v => set("klsRawatNaik", v)}
                options={["VVIP", "VIP", "Kelas I", "Kelas II", "Kelas III", "ICCU", "ICU", "Di atas Kelas I"]
                  .map((v, i) => ({ value: String(i + 1), label: v }))} />
            </SepField>
            <SepField label="Pembiayaan">
              <Select variant="filled" value={draft.pembiayaan} placeholder="Pilih..."
                onChange={v => set("pembiayaan", v)}
                options={[
                  { value: "1", label: "Pribadi" },
                  { value: "2", label: "Pemberi Kerja" },
                  { value: "3", label: "Asuransi Tambahan" },
                ]} />
            </SepField>
            <SepField label="Penanggung Jawab">
              <input className={sInp} value={draft.penanggungJawab} placeholder="Mis. Pribadi..."
                onChange={e => set("penanggungJawab", e.target.value)} />
            </SepField>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rujukan & poli tujuan — hanya Rawat Jalan */}
      <AnimatePresence>
        {draft.jnsPelayanan === "2" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="space-y-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-1 rounded-full bg-sky-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Rujukan &amp; Poli Tujuan</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SepField label="Asal Rujukan">
                <Chips options={[{ value: "1", label: "Faskes 1" }, { value: "2", label: "Faskes 2 (RS)" }]}
                  value={draft.asalRujukan} onChange={v => set("asalRujukan", v as "1" | "2")} />
              </SepField>
              <SepField label="Tgl. Rujukan">
                <DatePicker variant="filled" value={draft.tglRujukan} onChange={v => set("tglRujukan", v)} />
              </SepField>
              <SepField label="No. Rujukan">
                <input className={sInp} value={draft.noRujukan} placeholder="Nomor rujukan..."
                  onChange={e => set("noRujukan", e.target.value)} />
              </SepField>
              <SepField label="Kode PPK Rujukan">
                <input className={sInp} value={draft.ppkRujukan} placeholder="Kode faskes perujuk..."
                  onChange={e => set("ppkRujukan", e.target.value)} />
              </SepField>
              <SepField label="Diagnosa Awal (ICD-10)">
                <input className={cn(sInp, "font-mono")} value={draft.diagAwal} placeholder="Mis. N18"
                  onChange={e => set("diagAwal", e.target.value)} />
              </SepField>
              <SepField label="Poli Tujuan">
                <input className={sInp} value={draft.poliTujuan} placeholder="Poli / kode poli..."
                  onChange={e => set("poliTujuan", e.target.value)} />
              </SepField>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tujuan kunjungan & prosedur — hanya Rawat Jalan */}
      <AnimatePresence>
        {draft.jnsPelayanan === "2" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="space-y-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-1 rounded-full bg-sky-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Tujuan Kunjungan &amp; Prosedur</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SepField label="Tujuan Kunjungan">
                <Select variant="filled" value={draft.tujuanKunj}
                  onChange={v => setTujuan(v as "0" | "1" | "2")}
                  options={[...TUJUAN_KUNJ_OPTS]} />
              </SepField>
              <SepField label="Poli Eksekutif">
                <Chips options={[{ value: "0", label: "Tidak" }, { value: "1", label: "Ya" }]}
                  value={draft.poliEksekutif} onChange={v => set("poliEksekutif", v as "0" | "1")} />
              </SepField>
              <div className="col-span-2">
                <SepField label="DPJP Pelayanan">
                  <input className={sInp} value={draft.dpjpLayan} placeholder="Kode DPJP yang melayani..."
                    onChange={e => set("dpjpLayan", e.target.value)} />
                </SepField>
              </div>
            </div>

            {/* Prosedur → flagProcedure + kdPenunjang */}
            <AnimatePresence>
              {draft.tujuanKunj === "1" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                  className="grid grid-cols-2 gap-3 overflow-hidden rounded-lg border border-sky-100 bg-sky-50/40 p-3"
                >
                  <SepField label="Flag Procedure">
                    <Chips options={FLAG_PROCEDURE_OPTS} value={draft.flagProcedure || "0"}
                      onChange={v => set("flagProcedure", v as "0" | "1")} />
                  </SepField>
                  <SepField label="Jenis Penunjang">
                    <Select variant="filled" value={draft.kdPenunjang} placeholder="Pilih penunjang..."
                      onChange={v => set("kdPenunjang", v)} options={KD_PENUNJANG_OPTS} />
                  </SepField>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Normal / Konsul → assesmentPel */}
            <AnimatePresence>
              {(draft.tujuanKunj === "0" || draft.tujuanKunj === "2") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <SepField label="Asesmen Pelayanan">
                    <Select variant="filled" value={draft.assesmentPel} placeholder="Pilih asesmen..."
                      onChange={v => set("assesmentPel", v)} options={ASSESMENT_PEL_OPTS} />
                  </SepField>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 3: Jaminan & Kecelakaan ────────────────────────────

export function SepStep3({ draft, setDraft }: {
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
}) {
  const set    = <K extends keyof SepDraft>(k: K, v: SepDraft[K]) => setDraft(d => ({ ...d, [k]: v }));
  const isLaka = draft.lakaLantas !== "0";

  return (
    <div className="space-y-3">
      {/* Jaminan Kecelakaan */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-1 rounded-full bg-amber-400" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Jaminan Kecelakaan</p>
        </div>
        <SepField label="Laka Lantas">
          <Chips
            options={[
              { value: "0", label: "BKLL" },
              { value: "1", label: "KLL+BKK" },
              { value: "2", label: "KLL+KK" },
              { value: "3", label: "KK" },
            ]}
            value={draft.lakaLantas}
            onChange={v => set("lakaLantas", v as "0" | "1" | "2" | "3")}
          />
        </SepField>
        <AnimatePresence>
          {isLaka && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <SepField label="No. Laporan Polisi (LP)">
                  <input className={sInp} value={draft.noLP} placeholder="LP-XXXX/XX/XXXX"
                    onChange={e => set("noLP", e.target.value)} />
                </SepField>
                <SepField label="Tanggal Kejadian KLL">
                  <DatePicker variant="filled" value={draft.tglKejadian} onChange={v => set("tglKejadian", v)} />
                </SepField>
                <div className="col-span-2">
                  <SepField label="Keterangan Kejadian">
                    <input className={sInp} value={draft.keteranganLaka} placeholder="Kronologi singkat kejadian..."
                      onChange={e => set("keteranganLaka", e.target.value)} />
                  </SepField>
                </div>
              </div>

              {/* Suplesi */}
              <div className="space-y-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">Suplesi</p>
                <SepField label="Suplesi">
                  <Chips options={[{ value: "0", label: "Tidak" }, { value: "1", label: "Ya" }]}
                    value={draft.suplesi} onChange={v => set("suplesi", v as "0" | "1")} />
                </SepField>
                <AnimatePresence>
                  {draft.suplesi === "1" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
                      className="space-y-2.5 overflow-hidden"
                    >
                      <SepField label="No. SEP Suplesi">
                        <input className={sInp} value={draft.noSepSuplesi} placeholder="No. SEP terdahulu..."
                          onChange={e => set("noSepSuplesi", e.target.value)} />
                      </SepField>
                      <div className="grid grid-cols-3 gap-2">
                        <SepField label="Kode Provinsi">
                          <input className={sInp} value={draft.kdPropinsi} placeholder="Kode..."
                            onChange={e => set("kdPropinsi", e.target.value)} />
                        </SepField>
                        <SepField label="Kode Kabupaten">
                          <input className={sInp} value={draft.kdKabupaten} placeholder="Kode..."
                            onChange={e => set("kdKabupaten", e.target.value)} />
                        </SepField>
                        <SepField label="Kode Kecamatan">
                          <input className={sInp} value={draft.kdKecamatan} placeholder="Kode..."
                            onChange={e => set("kdKecamatan", e.target.value)} />
                        </SepField>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* COB, Katarak, SKDP, operator */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <SepField label="COB">
          <Chips options={[{ value: "0", label: "Tidak" }, { value: "1", label: "Ya" }]}
            value={draft.cob} onChange={v => set("cob", v as "0" | "1")} />
        </SepField>
        <SepField label="Katarak">
          <Chips options={[{ value: "0", label: "Tidak" }, { value: "1", label: "Ya" }]}
            value={draft.katarak} onChange={v => set("katarak", v as "0" | "1")} />
        </SepField>
        <SepField label="No. Surat SKDP">
          <input className={sInp} value={draft.skdpNoSurat} placeholder="No. surat kontrol..."
            onChange={e => set("skdpNoSurat", e.target.value)} />
        </SepField>
        <SepField label="Kode DPJP (SKDP)">
          <input className={sInp} value={draft.skdpKodeDPJP} placeholder="Kode dokter..."
            onChange={e => set("skdpKodeDPJP", e.target.value)} />
        </SepField>
        <SepField label="No. Telepon">
          <input className={sInp} value={draft.noTelp} placeholder="08XX..."
            onChange={e => set("noTelp", e.target.value)} />
        </SepField>
        <SepField label="User / Operator">
          <input className={sInp} value={draft.user} placeholder="Username operator..."
            onChange={e => set("user", e.target.value)} />
        </SepField>
        <div className="col-span-2">
          <SepField label="Catatan">
            <textarea className={cn(sInp, "h-auto min-h-[52px] resize-none py-1.5")}
              value={draft.catatan} placeholder="Catatan peserta..."
              onChange={e => set("catatan", e.target.value)} />
          </SepField>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────

export function SepStep4({ draft }: { draft: SepDraft }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
        <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
        <div>
          <p className="text-[11px] font-bold text-emerald-700">Semua data siap dikirim</p>
          <p className="text-[9.5px] text-emerald-500">Periksa kembali sebelum menekan Kirim SEP</p>
        </div>
      </div>

      <RvSection2 title="Identitas Peserta" accent="bg-sky-500"
        icon={<User size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Nama Peserta</p>
            <div className="flex h-10 items-center rounded-xl bg-slate-100 px-3">
              <span className="text-[13px] font-bold text-slate-800">{draft.namaPeserta}</span>
            </div>
          </div>
          <RvItem label="No. Kartu BPJS" value={draft.noKartu} mono />
          <RvItem label="Hak Kelas" value={R_KLS[draft.klsRawatHak as keyof typeof R_KLS]} />
        </div>
      </RvSection2>

      <RvSection2 title="Info Kunjungan" accent="bg-sky-400"
        icon={<Calendar size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <RvItem label="Tanggal SEP"      value={draft.tglSep} />
          <RvItem label="Jenis Pelayanan"  value={R_JNS[draft.jnsPelayanan]} />
          <RvItem label="Kode PPK"         value={draft.ppkPelayanan || "—"} mono />
          <RvItem label="No. Medical Record" value={draft.noMR || "—"} mono />
          {draft.jnsPelayanan === "2" && draft.noRujukan && (
            <RvItem label="No. Rujukan" value={draft.noRujukan} mono />
          )}
          {draft.jnsPelayanan === "2" && draft.noRujukan && (
            <RvItem label="Asal Rujukan" value={R_ASAL_RUJUKAN[draft.asalRujukan]} />
          )}
          {draft.jnsPelayanan === "2" && draft.diagAwal && (
            <RvItem label="Diagnosa Awal" value={draft.diagAwal} mono />
          )}
          {draft.jnsPelayanan === "2" && draft.poliTujuan && (
            <RvItem label="Poli Tujuan" value={draft.poliTujuan} />
          )}
          {draft.jnsPelayanan === "2" && (
            <RvItem label="Tujuan Kunjungan" value={R_TUJUAN_KUNJ[draft.tujuanKunj]} />
          )}
          {draft.jnsPelayanan === "2" && (
            <RvItem label="Poli Eksekutif" value={draft.poliEksekutif === "1" ? "Ya" : "Tidak"} />
          )}
          {draft.tujuanKunj === "1" && draft.kdPenunjang && (
            <RvItem label="Jenis Penunjang" value={labelOf(KD_PENUNJANG_OPTS, draft.kdPenunjang)} />
          )}
          {draft.assesmentPel && (
            <RvItem label="Asesmen Pelayanan" value={labelOf(ASSESMENT_PEL_OPTS, draft.assesmentPel)} />
          )}
          {draft.jnsPelayanan === "2" && draft.dpjpLayan && (
            <RvItem label="DPJP Pelayanan" value={draft.dpjpLayan} mono />
          )}
        </div>
      </RvSection2>

      <RvSection2 title="Jaminan & Kecelakaan" accent="bg-amber-400"
        icon={<ShieldCheck size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <RvItem label="Laka Lantas" value={R_LAKA[draft.lakaLantas]} />
          {draft.lakaLantas !== "0" && <RvItem label="No. Laporan Polisi" value={draft.noLP || "—"} mono />}
          {draft.lakaLantas !== "0" && <RvItem label="Tgl. Kejadian"      value={draft.tglKejadian || "—"} />}
          {draft.suplesi === "1"    && <RvItem label="No. SEP Suplesi"    value={draft.noSepSuplesi || "—"} mono />}
          <RvItem label="COB" value={draft.cob === "1" ? "Ya" : "Tidak"} />
          {draft.user && <RvItem label="Operator" value={draft.user} />}
        </div>
      </RvSection2>
    </div>
  );
}
