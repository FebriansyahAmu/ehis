"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type SmokingStatus, type ObatEntry, type KeluargaEntry,
  type RawatEntry, type BedahEntry, type PersalinanEntry,
  PENYAKIT_DAHULU_LIST, PENYAKIT_BERESIKO, PERILAKU_BERESIKO,
  PENYAKIT_KELUARGA_LIST, ANGGOTA_KELUARGA, RUTE_OBAT,
  METODE_KB, JENIS_PERSALINAN,
  type AsesmenPatientBase,
} from "./asesmenShared";

// ── Shared primitives ─────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </p>
  );
}

function Block({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {title && (
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}

function TA({ label, value, onChange, placeholder, rows = 2, required }: {
  label: string; value: string; onChange?: (v: string) => void; placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea rows={rows} value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined} readOnly={!onChange}
        placeholder={placeholder}
        className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
    </div>
  );
}

const INPUT_CLS = "h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50";

function ChkBtn({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition",
        checked ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40")}>
      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
        checked ? "border-indigo-500 bg-indigo-500" : "border-slate-300")}>
        {checked && <Check size={10} className="text-white" />}
      </span>
      {label}
    </button>
  );
}

function YesNoRadio({ value, onChange, yesLabel = "Ya", noLabel = "Tidak" }: {
  value: boolean | null; onChange: (v: boolean) => void; yesLabel?: string; noLabel?: string;
}) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={cn("flex-1 rounded-lg border py-1.5 text-xs font-semibold transition",
            value === v
              ? v ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-400 bg-slate-100 text-slate-700"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
          {v ? yesLabel : noLabel}
        </button>
      ))}
    </div>
  );
}

function SaveBtn() {
  return (
    <div className="flex justify-end pt-1">
      <button type="button"
        className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-95">
        Simpan
      </button>
    </div>
  );
}

// ── Sub-panes ─────────────────────────────────────────────

function PenyakitDahuluPane({ patient }: { patient: AsesmenPatientBase }) {
  const [checked, setChecked] = useState<string[]>([]);
  const [catatan, setCatatan] = useState(patient.riwayatPenyakitDahulu ?? "");
  const toggle = (p: string) => setChecked(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  return (
    <div className="flex flex-col gap-4">
      <Block title="Penyakit yang Pernah Diderita">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PENYAKIT_DAHULU_LIST.map(p => (
            <ChkBtn key={p} label={p} checked={checked.includes(p)} onChange={() => toggle(p)} />
          ))}
        </div>
      </Block>
      <Block title="Keterangan Tambahan">
        <TA label="Detail / Catatan" value={catatan} onChange={setCatatan} rows={3}
          placeholder="Tahun diagnosis, kondisi saat ini, komplikasi yang pernah terjadi..." />
      </Block>
      <SaveBtn />
    </div>
  );
}

function PemberianObatPane() {
  const [obats, setObats] = useState<ObatEntry[]>([
    { id: "ob-1", nama: "", dosis: "", frekuensi: "", rute: "Oral", sejak: "", indikasi: "" },
  ]);
  const add = () => setObats(p => [...p, { id: `ob-${Date.now()}`, nama: "", dosis: "", frekuensi: "", rute: "Oral", sejak: "", indikasi: "" }]);
  const rem = (id: string) => setObats(p => p.filter(e => e.id !== id));
  const upd = (id: string, k: keyof ObatEntry, v: string) => setObats(p => p.map(e => e.id === id ? { ...e, [k]: v } : e));
  return (
    <div className="flex flex-col gap-4">
      <Block title="Daftar Obat yang Sedang / Pernah Diminum">
        <div className="flex flex-col gap-3">
          {obats.map((ob, i) => (
            <div key={ob.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Obat #{i + 1}</span>
                {obats.length > 1 && (
                  <button type="button" onClick={() => rem(ob.id)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X size={14} /></button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2"><Label>Nama Obat</Label><input value={ob.nama} onChange={e => upd(ob.id, "nama", e.target.value)} placeholder="Nama generik / merek..." className={INPUT_CLS} /></div>
                <div><Label>Dosis</Label><input value={ob.dosis} onChange={e => upd(ob.id, "dosis", e.target.value)} placeholder="5 mg..." className={INPUT_CLS} /></div>
                <div><Label>Frekuensi</Label><input value={ob.frekuensi} onChange={e => upd(ob.id, "frekuensi", e.target.value)} placeholder="1×/hari..." className={INPUT_CLS} /></div>
                <div><Label>Rute</Label><select value={ob.rute} onChange={e => upd(ob.id, "rute", e.target.value)} className={INPUT_CLS}>{RUTE_OBAT.map(r => <option key={r}>{r}</option>)}</select></div>
                <div><Label>Sejak</Label><input value={ob.sejak} onChange={e => upd(ob.id, "sejak", e.target.value)} placeholder="Jan 2024..." className={INPUT_CLS} /></div>
                <div className="sm:col-span-3"><Label>Indikasi</Label><input value={ob.indikasi} onChange={e => upd(ob.id, "indikasi", e.target.value)} placeholder="Indikasi / keterangan..." className={INPUT_CLS} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={add}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500">
            <Plus size={15} /> Tambah Obat
          </button>
        </div>
      </Block>
      <SaveBtn />
    </div>
  );
}

function LainnyaPane() {
  const [merokok, setMerokok] = useState<SmokingStatus | null>(null);
  const [batang, setBatang] = useState(""); const [merokokSejak, setMerokokSejak] = useState(""); const [berhentiSejak, setBerhentiSejak] = useState("");
  const [paparanAsap, setPaparanAsap] = useState<boolean | null>(null); const [paparanDetail, setPaparanDetail] = useState(""); const [catatan, setCatatan] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <Block title="Status Merokok">
        <div className="flex flex-col gap-3">
          <div>
            <Label>Apakah Anda merokok?</Label>
            <div className="flex gap-2">
              {([{ v: "ya" as SmokingStatus, label: "Ya, Aktif Merokok", cls: "border-rose-400 bg-rose-50 text-rose-700" }, { v: "tidak" as SmokingStatus, label: "Tidak Merokok", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" }, { v: "mantan" as SmokingStatus, label: "Mantan Perokok", cls: "border-amber-400 bg-amber-50 text-amber-700" }] as const).map(opt => (
                <button key={opt.v} type="button" onClick={() => setMerokok(opt.v)}
                  className={cn("flex-1 rounded-lg border py-2 text-xs font-semibold transition",
                    merokok === opt.v ? opt.cls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {merokok === "ya" && (
              <motion.div key="ya" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div><Label>Jumlah Rokok per Hari</Label><input value={batang} onChange={e => setBatang(e.target.value)} placeholder="10 batang" className={INPUT_CLS} /></div>
                  <div><Label>Merokok Sejak</Label><input value={merokokSejak} onChange={e => setMerokokSejak(e.target.value)} placeholder="2010..." className={INPUT_CLS} /></div>
                </div>
              </motion.div>
            )}
            {merokok === "mantan" && (
              <motion.div key="mantan" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div><Label>Berhenti Sejak</Label><input value={berhentiSejak} onChange={e => setBerhentiSejak(e.target.value)} placeholder="2022" className={INPUT_CLS} /></div>
                  <div><Label>Merokok Sejak</Label><input value={merokokSejak} onChange={e => setMerokokSejak(e.target.value)} placeholder="2000" className={INPUT_CLS} /></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Block>
      <Block title="Paparan Asap Rokok">
        <div className="flex flex-col gap-3">
          <div><Label>Apakah terpapar asap rokok?</Label><YesNoRadio value={paparanAsap} onChange={setPaparanAsap} /></div>
          <AnimatePresence>
            {paparanAsap && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <TA label="Keterangan Paparan" value={paparanDetail} onChange={setPaparanDetail}
                  placeholder="Di rumah, tempat kerja, durasi paparan sehari-hari..." rows={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Block>
      <Block title="Kebiasaan & Gaya Hidup Lainnya">
        <TA label="Catatan" value={catatan} onChange={setCatatan} rows={3}
          placeholder="Konsumsi alkohol, pola makan, aktivitas fisik, pola tidur, dll..." />
      </Block>
      <SaveBtn />
    </div>
  );
}

function FaktorResikoPane() {
  const [penyakitB, setPenyakitB] = useState<string[]>([]); const [penyakitLain, setPenyakitLain] = useState("");
  const [perilakuB, setPerilakuB] = useState<string[]>([]); const [perilakuLain, setPerilakuLain] = useState("");
  const tP = (v: string) => setPenyakitB(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const tB = (v: string) => setPerilakuB(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Block title="Penyakit Beresiko">
          <div className="flex flex-col gap-1.5">{PENYAKIT_BERESIKO.map(p => <ChkBtn key={p} label={p} checked={penyakitB.includes(p)} onChange={() => tP(p)} />)}</div>
          <div className="mt-3"><Label>Penyakit Beresiko Lainnya</Label><input value={penyakitLain} onChange={e => setPenyakitLain(e.target.value)} placeholder="Tambahkan..." className={INPUT_CLS} /></div>
        </Block>
        <Block title="Perilaku Beresiko">
          <div className="flex flex-col gap-1.5">{PERILAKU_BERESIKO.map(p => <ChkBtn key={p} label={p} checked={perilakuB.includes(p)} onChange={() => tB(p)} />)}</div>
          <div className="mt-3"><Label>Perilaku Beresiko Lainnya</Label><input value={perilakuLain} onChange={e => setPerilakuLain(e.target.value)} placeholder="Tambahkan..." className={INPUT_CLS} /></div>
        </Block>
      </div>
      <SaveBtn />
    </div>
  );
}

function PenyakitKeluargaPane({ patient }: { patient: AsesmenPatientBase }) {
  const [entries, setEntries] = useState<KeluargaEntry[]>(ANGGOTA_KELUARGA.map(a => ({ anggota: a, penyakit: [], keterangan: "" })));
  const [riwayatLain, setRiwayatLain] = useState(patient.riwayatKeluarga ?? "");
  const toggleP = (idx: number, p: string) => setEntries(prev => prev.map((e, i) => i !== idx ? e : { ...e, penyakit: e.penyakit.includes(p) ? e.penyakit.filter(x => x !== p) : [...e.penyakit, p] }));
  const setKet = (idx: number, v: string) => setEntries(prev => prev.map((e, i) => i !== idx ? e : { ...e, keterangan: v }));
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
          <span className="text-xs font-semibold text-slate-700">Riwayat Penyakit per Anggota Keluarga</span>
        </div>
        <div className="divide-y divide-slate-100">
          {entries.map((e, idx) => (
            <div key={e.anggota} className="p-4">
              <p className="mb-2.5 text-xs font-bold text-slate-700">{e.anggota}</p>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {PENYAKIT_KELUARGA_LIST.map(p => (
                  <button key={p} type="button" onClick={() => toggleP(idx, p)}
                    className={cn("rounded-md border px-2.5 py-1 text-xs font-medium transition",
                      e.penyakit.includes(p) ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:bg-indigo-50/40")}>
                    {p}
                  </button>
                ))}
              </div>
              <input value={e.keterangan} onChange={ev => setKet(idx, ev.target.value)} placeholder="Keterangan tambahan (opsional)..." className={INPUT_CLS} />
            </div>
          ))}
        </div>
      </div>
      <Block title="Catatan Tambahan Riwayat Keluarga">
        <TA label="Keterangan" value={riwayatLain} onChange={setRiwayatLain} rows={3} placeholder="Pola herediter, penyakit genetik, riwayat lainnya..." />
      </Block>
      <SaveBtn />
    </div>
  );
}

function TuberkulosisPane() {
  const [riwayatTBC, setRiwayatTBC] = useState<boolean | null>(null); const [tahun, setTahun] = useState(""); const [statusOAT, setStatusOAT] = useState("");
  const [kontakTBC, setKontakTBC] = useState<boolean | null>(null); const [penunjang, setPenunjang] = useState("");
  const [tcmDilakukan, setTcmDilakukan] = useState<boolean | null>(null); const [tcmHasil, setTcmHasil] = useState("");
  const [sputumDilakukan, setSputumDilakukan] = useState<boolean | null>(null); const [sputumHasil, setSputumHasil] = useState(""); const [sputumGrade, setSputumGrade] = useState("");
  const [catatan, setCatatan] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <Block title="Riwayat Penyakit Tuberkulosis">
        <div className="flex flex-col gap-3">
          <div><Label>Apakah pernah didiagnosis / diobati TBC?</Label><YesNoRadio value={riwayatTBC} onChange={setRiwayatTBC} /></div>
          <AnimatePresence>
            {riwayatTBC && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="mt-1 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Tahun Pengobatan</Label><input value={tahun} onChange={e => setTahun(e.target.value)} placeholder="2018" className={INPUT_CLS} /></div>
                    <div><Label>Status OAT</Label><select value={statusOAT} onChange={e => setStatusOAT(e.target.value)} className={INPUT_CLS}><option value="">— Pilih —</option><option value="selesai">Selesai / Sembuh</option><option value="tidak-selesai">Tidak Selesai / Putus Obat</option><option value="sedang">Sedang Berjalan</option></select></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div><Label>Riwayat Kontak dengan Penderita TBC</Label><YesNoRadio value={kontakTBC} onChange={setKontakTBC} /></div>
        </div>
      </Block>
      <Block title="Riwayat Pemeriksaan Penunjang TBC">
        <TA label="Pemeriksaan yang Pernah Dilakukan" value={penunjang} onChange={setPenunjang} rows={2} placeholder="Rontgen thorax, mantoux test, IGRA, dll..." />
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <p className="mb-2 text-xs font-bold text-slate-700">Tes Cepat Molekuler (TCM / GeneXpert)</p>
          <YesNoRadio value={tcmDilakukan} onChange={setTcmDilakukan} yesLabel="Sudah Dilakukan" noLabel="Belum Dilakukan" />
          <AnimatePresence>
            {tcmDilakukan && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="mt-3 flex flex-wrap gap-2">
                  {[{ v: "pos-sensitif", label: "MTB Pos — Sensitif", cls: "border-amber-400 bg-amber-50 text-amber-700" }, { v: "pos-resisten", label: "MTB Pos — Resisten", cls: "border-rose-400 bg-rose-50 text-rose-700" }, { v: "negatif", label: "MTB Negatif", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" }, { v: "invalid", label: "Invalid", cls: "border-slate-400 bg-slate-100 text-slate-600" }].map(opt => (
                    <button key={opt.v} type="button" onClick={() => setTcmHasil(opt.v)}
                      className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                        tcmHasil === opt.v ? opt.cls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <p className="mb-2 text-xs font-bold text-slate-700">Pemeriksaan Sputum BTA</p>
          <YesNoRadio value={sputumDilakukan} onChange={setSputumDilakukan} yesLabel="Sudah Dilakukan" noLabel="Belum Dilakukan" />
          <AnimatePresence>
            {sputumDilakukan && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div><Label>Hasil Sputum BTA</Label><div className="flex gap-2">{[{ v: "positif", label: "Positif", cls: "border-rose-400 bg-rose-50 text-rose-700" }, { v: "negatif", label: "Negatif", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" }].map(opt => (<button key={opt.v} type="button" onClick={() => setSputumHasil(opt.v)} className={cn("flex-1 rounded-lg border py-1.5 text-xs font-semibold transition", sputumHasil === opt.v ? opt.cls : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>{opt.label}</button>))}</div></div>
                  <div><Label>Grade / Koloni</Label><input value={sputumGrade} onChange={e => setSputumGrade(e.target.value)} placeholder="1+, 2+, Skanty..." className={INPUT_CLS} /></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <TA label="Catatan" value={catatan} onChange={setCatatan} rows={2} placeholder="Hasil lab, klinis, rencana follow-up..." />
      </Block>
      <SaveBtn />
    </div>
  );
}

function GinekologiPane() {
  const [statusMens, setStatusMens] = useState(""); const [hpht, setHpht] = useState(""); const [siklus, setSiklus] = useState(""); const [lama, setLama] = useState("");
  const [dismenorea, setDismenorea] = useState<boolean | null>(null); const [menoragia, setMenoragia] = useState<boolean | null>(null); const [keputihan, setKeputihan] = useState<boolean | null>(null);
  const [papSmear, setPapSmear] = useState<boolean | null>(null); const [papTahun, setPapTahun] = useState(""); const [papHasil, setPapHasil] = useState("");
  const [iva, setIva] = useState<boolean | null>(null); const [ivaTahun, setIvaTahun] = useState(""); const [ivaHasil, setIvaHasil] = useState(""); const [catatan, setCatatan] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <Block title="Riwayat Menstruasi">
        <div className="flex flex-col gap-3">
          <div><Label>Status Menstruasi</Label><div className="flex flex-wrap gap-2">{(["Reguler", "Tidak Reguler", "Menopause", "Belum Menstruasi"] as const).map(s => (<button key={s} type="button" onClick={() => setStatusMens(s)} className={cn("rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition", statusMens === s ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>{s}</button>))}</div></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>HPHT</Label><input type="date" value={hpht} onChange={e => setHpht(e.target.value)} className={INPUT_CLS} /></div>
            <div><Label>Siklus (hari)</Label><input value={siklus} onChange={e => setSiklus(e.target.value)} placeholder="28 hari" className={INPUT_CLS} /></div>
            <div><Label>Lama Menstruasi</Label><input value={lama} onChange={e => setLama(e.target.value)} placeholder="5–7 hari" className={INPUT_CLS} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Dismenorea</Label><YesNoRadio value={dismenorea} onChange={setDismenorea} /></div>
            <div><Label>Menoragia</Label><YesNoRadio value={menoragia} onChange={setMenoragia} /></div>
            <div><Label>Keputihan Patologis</Label><YesNoRadio value={keputihan} onChange={setKeputihan} /></div>
          </div>
        </div>
      </Block>
      <Block title="Skrining Ginekologi">
        <div className="grid gap-4 sm:grid-cols-2">
          {[{ label: "Pap Smear", state: papSmear, setState: setPapSmear, tahun: papTahun, setTahun: setPapTahun, hasil: papHasil, setHasil: setPapHasil }, { label: "IVA Test", state: iva, setState: setIva, tahun: ivaTahun, setTahun: setIvaTahun, hasil: ivaHasil, setHasil: setIvaHasil }].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <p className="mb-2 text-xs font-bold text-slate-700">{item.label}</p>
              <YesNoRadio value={item.state} onChange={item.setState} yesLabel="Pernah" noLabel="Belum Pernah" />
              <AnimatePresence>
                {item.state && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div><Label>Tahun Terakhir</Label><input value={item.tahun} onChange={e => item.setTahun(e.target.value)} placeholder="2023" className={INPUT_CLS} /></div>
                      <div><Label>Hasil</Label><input value={item.hasil} onChange={e => item.setHasil(e.target.value)} placeholder="Normal / Abnormal" className={INPUT_CLS} /></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Block>
      <Block title="Catatan Ginekologi"><TA label="Keterangan" value={catatan} onChange={setCatatan} rows={3} placeholder="Riwayat gangguan ginekologi, terapi hormonal, kontrasepsi, dll..." /></Block>
      <SaveBtn />
    </div>
  );
}

function PerawatanTindakanPane() {
  const [rawats, setRawats] = useState<RawatEntry[]>([{ id: "rw-1", rs: "", unit: "", tanggal: "", diagnosa: "", keterangan: "" }]);
  const [bedahs, setBedahs]  = useState<BedahEntry[]>([]);
  const addR = () => setRawats(p => [...p, { id: `rw-${Date.now()}`, rs: "", unit: "", tanggal: "", diagnosa: "", keterangan: "" }]);
  const remR = (id: string) => setRawats(p => p.filter(e => e.id !== id));
  const updR = (id: string, k: keyof RawatEntry, v: string) => setRawats(p => p.map(e => e.id === id ? { ...e, [k]: v } : e));
  const addB = () => setBedahs(p => [...p, { id: `bd-${Date.now()}`, tanggal: "", tindakan: "", rs: "", dokter: "", keterangan: "" }]);
  const remB = (id: string) => setBedahs(p => p.filter(e => e.id !== id));
  const updB = (id: string, k: keyof BedahEntry, v: string) => setBedahs(p => p.map(e => e.id === id ? { ...e, [k]: v } : e));
  return (
    <div className="flex flex-col gap-4">
      <Block title="Riwayat Rawat Inap Terakhir">
        <div className="flex flex-col gap-3">
          {rawats.map((r, i) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">Perawatan #{i + 1}</span>{rawats.length > 1 && <button type="button" onClick={() => remR(r.id)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X size={14} /></button>}</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2"><Label>Nama RS / Faskes</Label><input value={r.rs} onChange={e => updR(r.id, "rs", e.target.value)} placeholder="RSUD, Puskesmas..." className={INPUT_CLS} /></div>
                <div><Label>Unit / Bagian</Label><input value={r.unit} onChange={e => updR(r.id, "unit", e.target.value)} placeholder="ICU, Penyakit Dalam..." className={INPUT_CLS} /></div>
                <div><Label>Tanggal</Label><input type="date" value={r.tanggal} onChange={e => updR(r.id, "tanggal", e.target.value)} className={INPUT_CLS} /></div>
                <div className="sm:col-span-2"><Label>Diagnosa</Label><input value={r.diagnosa} onChange={e => updR(r.id, "diagnosa", e.target.value)} placeholder="Diagnosa saat perawatan..." className={INPUT_CLS} /></div>
                <div className="sm:col-span-3"><Label>Keterangan</Label><input value={r.keterangan} onChange={e => updR(r.id, "keterangan", e.target.value)} placeholder="Durasi rawat, kondisi keluar, dll..." className={INPUT_CLS} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addR} className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500"><Plus size={15} /> Tambah Riwayat</button>
        </div>
      </Block>
      <Block title="Riwayat Pembedahan / Operasi">
        <div className="flex flex-col gap-3">
          {bedahs.length === 0 && <p className="text-xs text-slate-400">Belum ada riwayat pembedahan.</p>}
          {bedahs.map((b, i) => (
            <div key={b.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">Pembedahan #{i + 1}</span><button type="button" onClick={() => remB(b.id)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X size={14} /></button></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div><Label>Tanggal</Label><input type="date" value={b.tanggal} onChange={e => updB(b.id, "tanggal", e.target.value)} className={INPUT_CLS} /></div>
                <div className="sm:col-span-2"><Label>Nama Tindakan</Label><input value={b.tindakan} onChange={e => updB(b.id, "tindakan", e.target.value)} placeholder="Appendektomi, CABG, SC..." className={INPUT_CLS} /></div>
                <div><Label>Rumah Sakit</Label><input value={b.rs} onChange={e => updB(b.id, "rs", e.target.value)} placeholder="Nama faskes..." className={INPUT_CLS} /></div>
                <div><Label>Dokter Operator</Label><input value={b.dokter} onChange={e => updB(b.id, "dokter", e.target.value)} placeholder="dr. ..." className={INPUT_CLS} /></div>
                <div><Label>Keterangan</Label><input value={b.keterangan} onChange={e => updB(b.id, "keterangan", e.target.value)} placeholder="Komplikasi, kondisi post-op..." className={INPUT_CLS} /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addB} className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500"><Plus size={15} /> Tambah Riwayat Pembedahan</button>
        </div>
      </Block>
      <SaveBtn />
    </div>
  );
}

function ObstetriPane() {
  const [metodeKB, setMetodeKB] = useState(""); const [kbSejak, setKbSejak] = useState(""); const [kbKet, setKbKet] = useState("");
  const [gravida, setGravida] = useState(""); const [para, setPara] = useState(""); const [abortus, setAbortus] = useState("");
  const [persalinans, setPersalinans] = useState<PersalinanEntry[]>([]);
  const [ancKunjungan, setAncKunjungan] = useState(""); const [ancUsia, setAncUsia] = useState(""); const [ancTempat, setAncTempat] = useState(""); const [ancPetugas, setAncPetugas] = useState(""); const [ancKet, setAncKet] = useState("");
  const addPs = () => setPersalinans(p => [...p, { id: `ps-${Date.now()}`, tahun: "", usiaKeh: "", jenis: JENIS_PERSALINAN[0], bbLahir: "", kondisiAnak: "", keterangan: "" }]);
  const remPs = (id: string) => setPersalinans(p => p.filter(e => e.id !== id));
  const updPs = (id: string, k: keyof PersalinanEntry, v: string) => setPersalinans(p => p.map(e => e.id === id ? { ...e, [k]: v } : e));
  return (
    <div className="flex flex-col gap-4">
      <Block title="Keluarga Berencana (KB)">
        <div className="flex flex-col gap-3">
          <div><Label>Metode KB yang Digunakan</Label><div className="flex flex-wrap gap-2">{METODE_KB.map(m => (<button key={m} type="button" onClick={() => setMetodeKB(m)} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition", metodeKB === m ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:bg-indigo-50/40")}>{m}</button>))}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sejak / Durasi</Label><input value={kbSejak} onChange={e => setKbSejak(e.target.value)} placeholder="2020, 3 tahun..." className={INPUT_CLS} /></div>
            <div><Label>Keterangan</Label><input value={kbKet} onChange={e => setKbKet(e.target.value)} placeholder="Efek samping, alasan berhenti..." className={INPUT_CLS} /></div>
          </div>
        </div>
      </Block>
      <Block title="Riwayat Obstetri (G / P / A)">
        <div className="grid grid-cols-3 gap-3">
          {[{ label: "G — Gravida", val: gravida, set: setGravida, tip: "Total kehamilan" }, { label: "P — Para", val: para, set: setPara, tip: "Persalinan ≥20 mg" }, { label: "A — Abortus", val: abortus, set: setAbortus, tip: "Keguguran / terminasi" }].map(f => (
            <div key={f.label}><Label>{f.label}</Label><input value={f.val} onChange={e => f.set(e.target.value)} placeholder="0" className={cn(INPUT_CLS, "text-center font-bold")} /><p className="mt-1 text-center text-[11px] text-slate-400">{f.tip}</p></div>
          ))}
        </div>
        <div>
          <Label>Riwayat Persalinan</Label>
          <div className="flex flex-col gap-3">
            {persalinans.length === 0 && <p className="text-xs text-slate-400">Belum ada riwayat persalinan.</p>}
            {persalinans.map((ps, i) => (
              <div key={ps.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">Persalinan ke-{i + 1}</span><button type="button" onClick={() => remPs(ps.id)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X size={14} /></button></div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div><Label>Tahun</Label><input value={ps.tahun} onChange={e => updPs(ps.id, "tahun", e.target.value)} placeholder="2020" className={INPUT_CLS} /></div>
                  <div><Label>Usia Kehamilan</Label><input value={ps.usiaKeh} onChange={e => updPs(ps.id, "usiaKeh", e.target.value)} placeholder="38 minggu" className={INPUT_CLS} /></div>
                  <div><Label>Jenis Persalinan</Label><select value={ps.jenis} onChange={e => updPs(ps.id, "jenis", e.target.value)} className={INPUT_CLS}>{JENIS_PERSALINAN.map(j => <option key={j}>{j}</option>)}</select></div>
                  <div><Label>BB Lahir (gram)</Label><input value={ps.bbLahir} onChange={e => updPs(ps.id, "bbLahir", e.target.value)} placeholder="3200 gr" className={INPUT_CLS} /></div>
                  <div><Label>Kondisi Anak</Label><input value={ps.kondisiAnak} onChange={e => updPs(ps.id, "kondisiAnak", e.target.value)} placeholder="Hidup / Meninggal" className={INPUT_CLS} /></div>
                  <div><Label>Keterangan</Label><input value={ps.keterangan} onChange={e => updPs(ps.id, "keterangan", e.target.value)} placeholder="Komplikasi, dll..." className={INPUT_CLS} /></div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addPs} className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500"><Plus size={15} /> Tambah Riwayat Persalinan</button>
          </div>
        </div>
      </Block>
      <Block title="Ante Natal Care (ANC)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><Label>Kunjungan ANC ke-</Label><input value={ancKunjungan} onChange={e => setAncKunjungan(e.target.value)} placeholder="4" className={INPUT_CLS} /></div>
          <div><Label>Usia Kehamilan</Label><input value={ancUsia} onChange={e => setAncUsia(e.target.value)} placeholder="32 minggu" className={INPUT_CLS} /></div>
          <div><Label>Tempat ANC</Label><input value={ancTempat} onChange={e => setAncTempat(e.target.value)} placeholder="Puskesmas, RS..." className={INPUT_CLS} /></div>
          <div><Label>Petugas / Dokter</Label><input value={ancPetugas} onChange={e => setAncPetugas(e.target.value)} placeholder="dr. / Bidan..." className={INPUT_CLS} /></div>
        </div>
        <TA label="Catatan ANC" value={ancKet} onChange={setAncKet} rows={2} placeholder="Komplikasi kehamilan, suplemen, imunisasi TT, USG, dll..." />
      </Block>
      <SaveBtn />
    </div>
  );
}

// ── Main RiwayatPane ──────────────────────────────────────

const RWY_TABS = [
  "Penyakit Dahulu", "Pemberian Obat", "Lainnya", "Faktor Resiko",
  "Penyakit Keluarga", "Tuberkulosis", "Ginekologi", "Perawatan & Tindakan", "Obstetri",
] as const;
type RwyTab = typeof RWY_TABS[number];

interface RiwayatPaneProps {
  patient: AsesmenPatientBase;
  onComplete?: (done: boolean) => void;
}

export default function RiwayatPane({ patient, onComplete }: RiwayatPaneProps) {
  const [activeTab, setActiveTab] = useState<RwyTab>("Penyakit Dahulu");

  void onComplete; // available for future completion-tracking integration

  return (
    <div className="flex flex-col gap-3">
      <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1 shadow-sm" style={{ scrollbarWidth: "none" }}>
        {RWY_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeTab === tab ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80" : "text-slate-500 hover:text-slate-700")}>
            {tab}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>
          {activeTab === "Penyakit Dahulu"      && <PenyakitDahuluPane patient={patient} />}
          {activeTab === "Pemberian Obat"       && <PemberianObatPane />}
          {activeTab === "Lainnya"              && <LainnyaPane />}
          {activeTab === "Faktor Resiko"        && <FaktorResikoPane />}
          {activeTab === "Penyakit Keluarga"    && <PenyakitKeluargaPane patient={patient} />}
          {activeTab === "Tuberkulosis"         && <TuberkulosisPane />}
          {activeTab === "Ginekologi"           && <GinekologiPane />}
          {activeTab === "Perawatan & Tindakan" && <PerawatanTindakanPane />}
          {activeTab === "Obstetri"             && <ObstetriPane />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
