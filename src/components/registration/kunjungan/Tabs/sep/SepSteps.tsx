"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, User, Calendar, ShieldCheck } from "lucide-react";
import { type SepDraft, sInp, sSel, R_JNS, R_LAKA, R_KLS } from "./sepTypes";
import { SepField, Chips, RvItem, RvSection2 } from "./SepShared";

// ─── Step 2: Kunjungan ────────────────────────────────────────

export function SepStep2({ draft, setDraft }: {
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
}) {
  const set      = <K extends keyof SepDraft>(k: K, v: SepDraft[K]) => setDraft(d => ({ ...d, [k]: v }));
  const klsLabel = ({ "1": "Kelas I", "2": "Kelas II", "3": "Kelas III" } as Record<string, string>)[draft.klsRawatHak] ?? "—";

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
            <input type="date" className={sInp} value={draft.tglSep}
              onChange={e => set("tglSep", e.target.value)} />
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
              <select className={sSel} value={draft.klsRawatNaik}
                onChange={e => set("klsRawatNaik", e.target.value)}>
                <option value="">Pilih...</option>
                {["VVIP", "VIP", "Kelas I", "Kelas II", "Kelas III", "ICCU", "ICU", "Di atas Kelas I"].map((v, i) => (
                  <option key={v} value={String(i + 1)}>{v}</option>
                ))}
              </select>
            </SepField>
            <SepField label="Pembiayaan">
              <select className={sSel} value={draft.pembiayaan}
                onChange={e => set("pembiayaan", e.target.value)}>
                <option value="">Pilih...</option>
                <option value="1">Pribadi</option>
                <option value="2">Pemberi Kerja</option>
                <option value="3">Asuransi Tambahan</option>
              </select>
            </SepField>
            <SepField label="Penanggung Jawab">
              <input className={sInp} value={draft.penanggungJawab} placeholder="Mis. Pribadi..."
                onChange={e => set("penanggungJawab", e.target.value)} />
            </SepField>
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
                  <input type="date" className={sInp} value={draft.tglKejadian}
                    onChange={e => set("tglKejadian", e.target.value)} />
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

      <RvSection2 title="Info Kunjungan" accent="bg-indigo-400"
        icon={<Calendar size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <RvItem label="Tanggal SEP"      value={draft.tglSep} />
          <RvItem label="Jenis Pelayanan"  value={R_JNS[draft.jnsPelayanan]} />
          <RvItem label="Kode PPK"         value={draft.ppkPelayanan || "—"} mono />
          <RvItem label="No. Medical Record" value={draft.noMR || "—"} mono />
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
