"use client";

// Badan form SEP (SaaS) untuk wizard Pendaftaran Kunjungan Baru. Mengganti SepStep2+SepStep3
// shared dengan layout ber-seksi + checklist. Logika field & dependensi identik (V-Claim).

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  CalendarDays, Stethoscope, ShieldAlert, ListChecks, Share2, PhoneCall,
  TrendingUp, Eye, Crown, Layers, FileSearch, X, Building2, Hash, Info, Braces,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker, Select } from "@/components/shared/inputs";
import {
  type SepDraft,
  TUJUAN_KUNJ_OPTS, FLAG_PROCEDURE_OPTS, KD_PENUNJANG_OPTS, ASSESMENT_PEL_OPTS,
} from "@/components/registration/kunjungan/Tabs/sep/sepTypes";
import { Field, Segmented, CheckCard, SectionCard, Reveal, fieldInput } from "./sepFormShared";
import { SkdpPickerModal, type SkdpPick } from "./SkdpPickerModal";
import { DpjpLayanPicker } from "./DpjpLayanPicker";
import { SepPayloadModal } from "./SepPayloadModal";

function fmtTglShort(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y) return ymd || "—";
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const KLS_NAIK = ["VVIP", "VIP", "Kelas I", "Kelas II", "Kelas III", "ICCU", "ICU", "Di atas Kelas I"]
  .map((v, i) => ({ value: String(i + 1), label: v }));
const PEMBIAYAAN = [
  { value: "1", label: "Pribadi" },
  { value: "2", label: "Pemberi Kerja" },
  { value: "3", label: "Asuransi Tambahan" },
];

export function SepFormBody({
  patientId, draft, setDraft, forceInternalRujukan = false,
}: {
  patientId: string;
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
  /** Paksa mode "Rujukan Internal" walau jenis SEP Rawat Jalan (mis. IGD — gawat darurat,
   *  SEP RJ tapi rujukan internal RS, bukan FKTP). Default false. */
  forceInternalRujukan?: boolean;
}) {
  const set = <K extends keyof SepDraft>(k: K, v: SepDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const klsLabel = ({ "1": "Kelas I", "2": "Kelas II", "3": "Kelas III" } as Record<string, string>)[draft.klsRawatHak] ?? "—";
  const isRJ = draft.jnsPelayanan === "2";
  // Blok rujukan: FKTP (editable) hanya untuk RJ non-IGD; else = rujukan INTERNAL RS.
  const internalRujukan = !isRJ || forceInternalRujukan;
  const isLaka = draft.lakaLantas !== "0";

  // Ganti jenis pelayanan. Rawat Inap → siapkan default RUJUKAN INTERNAL (IGD → RI):
  // asal RS (Faskes 2) · tgl = tgl SEP (sistem) · PPK = faskes RS sendiri. No. rujukan & diagAwal
  // diisi otomatis saat build payload (auto-gen + diagnosa utama IGD) — lihat TECH_DEBT.
  const setJnsPelayanan = (v: "1" | "2") =>
    setDraft((d) =>
      v === "1"
        ? { ...d, jnsPelayanan: v, asalRujukan: "2", tglRujukan: d.tglRujukan || d.tglSep, ppkRujukan: d.ppkRujukan || d.ppkPelayanan, poliTujuan: "" }
        : { ...d, jnsPelayanan: v },
    );

  // Pemilih Surat Kontrol/SPRI → No. Referensi mengisi No. SKDP. `pickedSkdp` utk hint DPJP/tanggal.
  const [skdpOpen, setSkdpOpen] = useState(false);
  const [pickedSkdp, setPickedSkdp] = useState<SkdpPick | null>(null);
  const [payloadOpen, setPayloadOpen] = useState(false); // pratinjau payload JSON
  const onPickSkdp = (p: SkdpPick) => {
    // No. Referensi → No. SKDP · kodeDPJP surat kontrol → skdp.kodeDPJP · diagAwal prefill dari SPRI.
    // Surat kontrol pasca ranap: perujuk = RS kita sendiri → PPK Rujukan = PPK Pelayanan (Faskes 2).
    setDraft((d) => ({
      ...d,
      skdpNoSurat: p.noReferensi ?? "",
      skdpKodeDPJP: p.kodeDokter ?? d.skdpKodeDPJP,
      diagAwal: p.diagAwalKode ?? d.diagAwal,
      ...(p.source === "kontrol" ? { ppkRujukan: d.ppkPelayanan, asalRujukan: "2" as const } : {}),
    }));
    setPickedSkdp(p);
    setSkdpOpen(false);
  };

  // Tujuan kunjungan mengatur field bergantung (flagProcedure/kdPenunjang utk Prosedur).
  const setTujuan = (v: string) => setDraft((d) => ({
    ...d,
    tujuanKunj: v as SepDraft["tujuanKunj"],
    flagProcedure: v === "1" ? (d.flagProcedure || "0") : "",
    kdPenunjang: v === "1" ? d.kdPenunjang : "",
    assesmentPel: v === "1" ? "" : d.assesmentPel,
  }));

  // Jumlah opsi penjaminan aktif → badge checklist.
  const optCount =
    (draft.naikKelas ? 1 : 0) + (draft.cob === "1" ? 1 : 0) +
    (draft.katarak === "1" ? 1 : 0) + (isRJ && draft.poliEksekutif === "1" ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* ── Detail Pelayanan ── */}
      <SectionCard title="Detail Pelayanan" desc="Tanggal & jenis layanan SEP" icon={CalendarDays} accent="sky">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal SEP">
            <DatePicker variant="filled" value={draft.tglSep} onChange={(v) => set("tglSep", v)} />
          </Field>
          <Field label="Jenis Pelayanan">
            <Segmented accent="sky" value={draft.jnsPelayanan}
              onChange={(v) => setJnsPelayanan(v as "1" | "2")}
              options={[{ value: "2", label: "Rawat Jalan" }, { value: "1", label: "Rawat Inap" }]} />
          </Field>
          <Field label="Kode PPK Pelayanan">
            <input className={fieldInput} value={draft.ppkPelayanan} placeholder="Kode faskes…"
              onChange={(e) => set("ppkPelayanan", e.target.value)} />
          </Field>
          <Field label="No. Medical Record">
            <input className={cn(fieldInput, "font-mono")} value={draft.noMR} placeholder="No. RM…"
              onChange={(e) => set("noMR", e.target.value)} />
          </Field>
          <Field label="Kelas Rawat Hak" hint="dari BPJS">
            <div className="flex h-10 items-center justify-between rounded-xl bg-sky-50 px-3 ring-1 ring-sky-100">
              <span className="text-[13px] font-bold text-sky-700">{klsLabel}</span>
              <ShieldAlert size={13} className="text-sky-400" />
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* ── Opsi Penjaminan (checklist) ── */}
      <SectionCard
        title="Opsi Penjaminan" desc="Centang yang berlaku untuk peserta" icon={ListChecks} accent="indigo"
        badge={
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            optCount > 0 ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400",
          )}>
            {optCount} aktif
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <CheckCard accent="indigo" icon={TrendingUp} label="Naik Kelas" desc="Pasien naik kelas rawat"
            checked={draft.naikKelas} onChange={(v) => set("naikKelas", v)} />
          <CheckCard accent="indigo" icon={Layers} label="COB" desc="Coordination of Benefit"
            checked={draft.cob === "1"} onChange={(v) => set("cob", v ? "1" : "0")} />
          <CheckCard accent="indigo" icon={Eye} label="Katarak" desc="Penjaminan katarak"
            checked={draft.katarak === "1"} onChange={(v) => set("katarak", v ? "1" : "0")} />
          {isRJ && (
            <CheckCard accent="indigo" icon={Crown} label="Poli Eksekutif" desc="Layanan poli eksekutif"
              checked={draft.poliEksekutif === "1"} onChange={(v) => set("poliEksekutif", v ? "1" : "0")} />
          )}
        </div>

        <Reveal open={draft.naikKelas}>
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 sm:grid-cols-3">
            <Field label="Kelas Naik">
              <Select variant="filled" value={draft.klsRawatNaik} placeholder="Pilih…"
                onChange={(v) => set("klsRawatNaik", v)} options={KLS_NAIK} />
            </Field>
            <Field label="Pembiayaan">
              <Select variant="filled" value={draft.pembiayaan} placeholder="Pilih…"
                onChange={(v) => set("pembiayaan", v)} options={PEMBIAYAAN} />
            </Field>
            <Field label="Penanggung Jawab">
              <input className={fieldInput} value={draft.penanggungJawab} placeholder="Mis. Pribadi…"
                onChange={(e) => set("penanggungJawab", e.target.value)} />
            </Field>
          </div>
        </Reveal>
      </SectionCard>

      {/* ── Rujukan ── selalu ada (t_sep wajib blok rujukan). RJ = rujukan faskes; IGD/RI = internal ── */}
      <SectionCard
        title={internalRujukan ? "Rujukan Internal" : "Rujukan & Poli Tujuan"}
        desc={internalRujukan ? "Rujukan internal RS (gawat darurat / rawat inap)" : "Dasar rujukan layanan rawat jalan"}
        icon={Share2}
        accent="cyan"
        badge={internalRujukan && (
          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-600">Internal</span>
        )}
      >
        {!internalRujukan ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Asal Rujukan">
              <Segmented accent="cyan" value={draft.asalRujukan}
                onChange={(v) => set("asalRujukan", v as "1" | "2")}
                options={[{ value: "1", label: "Faskes 1" }, { value: "2", label: "Faskes 2 (RS)" }]} />
            </Field>
            <Field label="Tgl. Rujukan">
              <DatePicker variant="filled" value={draft.tglRujukan} onChange={(v) => set("tglRujukan", v)} />
            </Field>
            <Field label="No. Rujukan">
              <input className={fieldInput} value={draft.noRujukan} placeholder="Nomor rujukan…"
                onChange={(e) => set("noRujukan", e.target.value)} />
            </Field>
            <Field label="Kode PPK Rujukan">
              <input className={fieldInput} value={draft.ppkRujukan} placeholder="Kode faskes perujuk…"
                onChange={(e) => set("ppkRujukan", e.target.value)} />
            </Field>
            <Field label="Diagnosa Awal (ICD-10)">
              <input className={cn(fieldInput, "font-mono")} value={draft.diagAwal} placeholder="Mis. N18"
                onChange={(e) => set("diagAwal", e.target.value)} />
            </Field>
            <Field label="Poli Tujuan">
              <input className={fieldInput} value={draft.poliTujuan} placeholder="Poli / kode poli…"
                onChange={(e) => set("poliTujuan", e.target.value)} />
            </Field>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-[11px] leading-relaxed text-cyan-700">
              <Info size={14} className="mt-0.5 shrink-0 text-cyan-500" />
              <p>
                Rujukan <b>internal RS</b> (Faskes 2). Nomor &amp; tanggal dibuat otomatis sistem; diagnosa awal
                diambil dari <b>diagnosa utama</b> kunjungan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Asal Rujukan" hint="terkunci">
                <div className="flex h-10 items-center gap-2 rounded-xl bg-cyan-50 px-3 ring-1 ring-cyan-100">
                  <Building2 size={13} className="shrink-0 text-cyan-500" />
                  <span className="truncate text-[13px] font-semibold text-cyan-700">Faskes Tingkat 2 (RS)</span>
                </div>
              </Field>
              <Field label="Tgl. Rujukan" hint="tanggal sistem">
                <div className="flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-3 ring-1 ring-slate-200">
                  <CalendarDays size={13} className="shrink-0 text-slate-400" />
                  <span className="text-[13px] font-medium text-slate-600">{draft.tglRujukan ? fmtTglShort(draft.tglRujukan) : "—"}</span>
                </div>
              </Field>
            </div>
            <Field label="No. Rujukan" hint="otomatis">
              <div className="flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-3 ring-1 ring-slate-200">
                <Hash size={13} className="shrink-0 text-slate-400" />
                <span className="truncate text-[12px] font-medium italic text-slate-400">Dibuat otomatis oleh sistem</span>
              </div>
            </Field>
            {draft.poliTujuan && (
              <Field label="Poli Tujuan" hint="gawat darurat">
                <div className="flex h-10 items-center gap-2 rounded-xl bg-cyan-50 px-3 ring-1 ring-cyan-100">
                  <Stethoscope size={13} className="shrink-0 text-cyan-500" />
                  <span className="text-[13px] font-semibold text-cyan-700">{draft.poliTujuan}</span>
                </div>
              </Field>
            )}
            <Field label="Diagnosa Awal (ICD-10)" hint="dari diagnosa utama IGD">
              <input className={cn(fieldInput, "font-mono")} value={draft.diagAwal}
                placeholder="Mis. S06.0 — terisi dari diagnosa utama IGD"
                onChange={(e) => set("diagAwal", e.target.value)} />
            </Field>
          </div>
        )}
      </SectionCard>

      {/* ── Tujuan Kunjungan & Prosedur (Rawat Jalan) ── */}
      <Reveal open={isRJ}>
        <SectionCard title="Tujuan Kunjungan & Prosedur" desc="Klasifikasi tujuan layanan" icon={Stethoscope} accent="teal">
          <div className="grid grid-cols-1 gap-3">
            <Field label="Tujuan Kunjungan">
              <Segmented accent="teal" value={draft.tujuanKunj} onChange={setTujuan} options={[...TUJUAN_KUNJ_OPTS]} />
            </Field>
            <Field label="DPJP Pelayanan" hint="cari nama · payload = kode DPJP">
              <DpjpLayanPicker value={draft.dpjpLayan} onChange={(kode) => set("dpjpLayan", kode)} />
            </Field>
          </div>

          <Reveal open={draft.tujuanKunj === "1"}>
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
              <Field label="Flag Procedure">
                <Segmented accent="teal" value={draft.flagProcedure || "0"}
                  onChange={(v) => set("flagProcedure", v as "0" | "1")} options={FLAG_PROCEDURE_OPTS} />
              </Field>
              <Field label="Jenis Penunjang">
                <Select variant="filled" value={draft.kdPenunjang} placeholder="Pilih penunjang…"
                  onChange={(v) => set("kdPenunjang", v)} options={KD_PENUNJANG_OPTS} />
              </Field>
            </div>
          </Reveal>

          <Reveal open={draft.tujuanKunj === "0" || draft.tujuanKunj === "2"}>
            <div className="mt-3">
              <Field label="Asesmen Pelayanan" hint="opsional">
                <Select variant="filled" value={draft.assesmentPel} placeholder="Pilih asesmen…"
                  onChange={(v) => set("assesmentPel", v)}
                  options={[{ value: "", label: "— Tidak perlu asesmen —" }, ...ASSESMENT_PEL_OPTS]} />
              </Field>
            </div>
          </Reveal>
        </SectionCard>
      </Reveal>

      {/* ── Jaminan Kecelakaan ── */}
      <SectionCard title="Jaminan Kecelakaan" desc="Laka lantas, suplesi, & kronologi" icon={ShieldAlert} accent="amber">
        <Field label="Jenis Laka Lantas">
          <Segmented accent="amber" value={draft.lakaLantas}
            onChange={(v) => set("lakaLantas", v as "0" | "1" | "2" | "3")}
            options={[
              { value: "0", label: "BKLL" }, { value: "1", label: "KLL+BKK" },
              { value: "2", label: "KLL+KK" }, { value: "3", label: "KK" },
            ]} />
        </Field>

        <Reveal open={isLaka}>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="No. Laporan Polisi (LP)">
                <input className={fieldInput} value={draft.noLP} placeholder="LP-XXXX/XX/XXXX"
                  onChange={(e) => set("noLP", e.target.value)} />
              </Field>
              <Field label="Tanggal Kejadian">
                <DatePicker variant="filled" value={draft.tglKejadian} onChange={(v) => set("tglKejadian", v)} />
              </Field>
            </div>
            <Field label="Keterangan Kejadian">
              <input className={fieldInput} value={draft.keteranganLaka} placeholder="Kronologi singkat kejadian…"
                onChange={(e) => set("keteranganLaka", e.target.value)} />
            </Field>

            <CheckCard accent="amber" icon={Layers} label="Suplesi" desc="Lanjutan dari SEP kecelakaan sebelumnya"
              checked={draft.suplesi === "1"} onChange={(v) => set("suplesi", v ? "1" : "0")} />
            <Reveal open={draft.suplesi === "1"}>
              <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                <Field label="No. SEP Suplesi">
                  <input className={cn(fieldInput, "font-mono")} value={draft.noSepSuplesi} placeholder="No. SEP terdahulu…"
                    onChange={(e) => set("noSepSuplesi", e.target.value)} />
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Kode Prov.">
                    <input className={fieldInput} value={draft.kdPropinsi} placeholder="Kode…"
                      onChange={(e) => set("kdPropinsi", e.target.value)} />
                  </Field>
                  <Field label="Kode Kab.">
                    <input className={fieldInput} value={draft.kdKabupaten} placeholder="Kode…"
                      onChange={(e) => set("kdKabupaten", e.target.value)} />
                  </Field>
                  <Field label="Kode Kec.">
                    <input className={fieldInput} value={draft.kdKecamatan} placeholder="Kode…"
                      onChange={(e) => set("kdKecamatan", e.target.value)} />
                  </Field>
                </div>
              </div>
            </Reveal>
          </div>
        </Reveal>
      </SectionCard>

      {/* ── Surat Kontrol (SKDP) & Kontak ── */}
      <SectionCard title="Surat Kontrol/SPRI & Kontak" desc="No. SKDP (surat kontrol) & kontak peserta" icon={PhoneCall} accent="emerald">
        {/* No. SKDP — ditarik dari surat kontrol terbit (No. Referensi kontrol) */}
        <Field label="No. SKDP" hint="dari surat kontrol / rencana kontrol">
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <FileSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                readOnly
                value={draft.skdpNoSurat}
                placeholder="Pilih SKDP…"
                onClick={() => setSkdpOpen(true)}
                className={cn(
                  "h-10 w-full cursor-pointer rounded-xl border bg-white pl-8 pr-8 text-[13px] outline-none transition hover:border-slate-300",
                  draft.skdpNoSurat ? "border-emerald-300 font-mono font-semibold text-emerald-700" : "border-slate-200 text-slate-700",
                )}
              />
              {draft.skdpNoSurat && (
                <button
                  type="button"
                  aria-label="Hapus pilihan surat kontrol"
                  onClick={() => { set("skdpNoSurat", ""); setPickedSkdp(null); }}
                  className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSkdpOpen(true)}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              <FileSearch size={14} /> Pilih SKDP
            </button>
          </div>
          {pickedSkdp ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-emerald-100 bg-emerald-50/60 px-2.5 py-1.5 text-[10px] text-emerald-700">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Stethoscope size={11} /> {pickedSkdp.dokterNama || "—"}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CalendarDays size={11} /> {pickedSkdp.tglLabel}
              </span>
              {pickedSkdp.info && <span className="text-emerald-600">· {pickedSkdp.info}</span>}
              {pickedSkdp.diagAwalKode && (
                <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-700">
                  · {pickedSkdp.diagAwalKode}
                  {pickedSkdp.diagAwalNama && <span className="font-sans font-normal text-emerald-600">{pickedSkdp.diagAwalNama}</span>}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-1.5 text-[10px] text-slate-400">
              No. SKDP ditarik dari <b className="font-semibold text-slate-500">surat kontrol</b> (default hari ini) atau <b className="font-semibold text-slate-500">SPRI</b> rawat inap (bebas tanggal).
            </p>
          )}
        </Field>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="No. Telepon" hint="wajib · dari data pasien">
            <input
              className={cn(
                fieldInput,
                !draft.noTelp.trim() && "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100",
              )}
              value={draft.noTelp}
              placeholder="08XX… (wajib untuk SEP)"
              onChange={(e) => set("noTelp", e.target.value)}
            />
            {!draft.noTelp.trim() && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-rose-600">
                <Info size={11} /> No. Telepon wajib diisi — BPJS menolak SEP tanpa kontak peserta.
              </p>
            )}
          </Field>
          <div className="col-span-2">
            <Field label="Catatan">
              <textarea className={cn(fieldInput, "h-auto min-h-14 resize-none py-2")}
                value={draft.catatan} placeholder="Catatan peserta…"
                onChange={(e) => set("catatan", e.target.value)} />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Pratinjau payload SEP (JSON) — link teks, bukan tombol full-width */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setPayloadOpen(true)}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-600 underline-offset-2 transition hover:text-sky-700 hover:underline"
        >
          <Braces size={12} /> Lihat Payload (JSON)
        </button>
      </div>

      <AnimatePresence>
        {skdpOpen && (
          <SkdpPickerModal
            patientId={patientId}
            noKartu={draft.noKartu}
            noRM={draft.noMR}
            selectedRef={draft.skdpNoSurat || undefined}
            defaultTab={isRJ ? "kontrol" : "spri"}
            onSelect={onPickSkdp}
            onClose={() => setSkdpOpen(false)}
          />
        )}
        {payloadOpen && <SepPayloadModal draft={draft} onClose={() => setPayloadOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
