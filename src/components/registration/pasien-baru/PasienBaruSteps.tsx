"use client";

import { cn } from "@/lib/utils";
import {
  AlertCircle, Plus, X as XIcon,
  User, CreditCard, BarChart3,
  Home,
  Phone, Shield, Users, Leaf,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FormState {
  // Step 1 — Identitas
  namaLengkap: string; nik: string; tempatLahir: string; tanggalLahir: string;
  gender: "L" | "P" | ""; golonganDarah: string; statusPerkawinan: string;
  agama: string; pekerjaan: string; pendidikan: string; suku: string; kewarganegaraan: string;
  // Step 2 — Alamat & Kartu Identitas
  noKK: string; rtRw: string;
  alamat: string; kelurahan: string; kecamatan: string;
  kota: string; provinsi: string; kodePos: string;
  samaAlamat: string;
  alamatDomisili: string; kelurahanDomisili: string; kecamatanDomisili: string;
  kotaDomisili: string; provinsiDomisili: string; kodePosDomisili: string;
  // Step 3 — Kontak & Keluarga
  noHp: string; email: string;
  penjaminTipe: string; penjaminNomor: string; penjaminKelas: string; penjaminBerlakuSampai: string;
  kontakDaruratNama: string; kontakDaruratHubungan: string; kontakDaruratNoHp: string;
  alergiInput: string; alergi: string[];
}

export const INITIAL_FORM: FormState = {
  namaLengkap: "", nik: "", tempatLahir: "", tanggalLahir: "",
  gender: "", golonganDarah: "", statusPerkawinan: "", agama: "",
  pekerjaan: "", pendidikan: "", suku: "", kewarganegaraan: "WNI",
  noKK: "", rtRw: "",
  alamat: "", kelurahan: "", kecamatan: "", kota: "", provinsi: "", kodePos: "",
  samaAlamat: "ya",
  alamatDomisili: "", kelurahanDomisili: "", kecamatanDomisili: "",
  kotaDomisili: "", provinsiDomisili: "", kodePosDomisili: "",
  noHp: "", email: "",
  penjaminTipe: "", penjaminNomor: "", penjaminKelas: "", penjaminBerlakuSampai: "",
  kontakDaruratNama: "", kontakDaruratHubungan: "", kontakDaruratNoHp: "",
  alergiInput: "", alergi: [],
};

export type Errors = Record<string, string>;

// ── Options ────────────────────────────────────────────────────────────────────

const GOL_DARAH    = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Tidak Diketahui"];
const AGAMA_OPT    = ["Islam","Kristen Protestan","Kristen Katolik","Hindu","Buddha","Konghucu","Lainnya"];
const STATUS_NIKAH = ["Belum Menikah","Menikah","Cerai Hidup","Cerai Mati"];
const PENDIDIKAN   = ["Tidak Sekolah","SD/Sederajat","SMP/Sederajat","SMA/Sederajat","D3/Sederajat","S1/Sederajat","S2+"];
const HUBUNGAN     = ["Suami","Istri","Ayah","Ibu","Anak","Kakak","Adik","Saudara","Lainnya"];
const PROVINSI     = [
  "Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi","Bengkulu",
  "Sumatera Selatan","Kepulauan Bangka Belitung","Lampung","Banten","DKI Jakarta",
  "Jawa Barat","Jawa Tengah","DI Yogyakarta","Jawa Timur","Bali","Nusa Tenggara Barat",
  "Nusa Tenggara Timur","Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan",
  "Kalimantan Timur","Kalimantan Utara","Sulawesi Utara","Gorontalo","Sulawesi Tengah",
  "Sulawesi Barat","Sulawesi Selatan","Sulawesi Tenggara","Maluku","Maluku Utara",
  "Papua Barat","Papua",
];

const PENJAMIN_OPTS = [
  { value: "BPJS_Non_PBI", label: "BPJS Non-PBI",  sub: "Peserta mandiri / PPU", sel: "border-sky-300    bg-sky-50    text-sky-700"    },
  { value: "BPJS_PBI",     label: "BPJS PBI",       sub: "Ditanggung pemerintah", sel: "border-cyan-300   bg-cyan-50   text-cyan-700"   },
  { value: "Umum",         label: "Umum",            sub: "Bayar sendiri",         sel: "border-slate-400  bg-slate-100 text-slate-700"  },
  { value: "Asuransi",     label: "Asuransi Swasta", sub: "Asuransi pribadi",      sel: "border-violet-300 bg-violet-50 text-violet-700" },
  { value: "Jamkesda",     label: "Jamkesda",        sub: "Jaminan daerah",        sel: "border-amber-300  bg-amber-50  text-amber-700"  },
];

// ── Validation ─────────────────────────────────────────────────────────────────

export function validateStep(step: number, f: FormState): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!f.namaLengkap.trim()) e.namaLengkap     = "Nama wajib diisi";
    if (f.nik.length !== 16)   e.nik              = "NIK harus 16 digit angka";
    if (!f.tempatLahir.trim()) e.tempatLahir      = "Tempat lahir wajib diisi";
    if (!f.tanggalLahir)       e.tanggalLahir     = "Tanggal lahir wajib diisi";
    if (!f.gender)             e.gender           = "Jenis kelamin wajib dipilih";
    if (!f.statusPerkawinan)   e.statusPerkawinan = "Status perkawinan wajib dipilih";
    if (!f.agama)              e.agama            = "Agama wajib dipilih";
  }
  if (step === 2) {
    if (!f.alamat.trim())  e.alamat   = "Alamat KTP wajib diisi";
    if (!f.kota.trim())    e.kota     = "Kota wajib diisi";
    if (!f.provinsi)       e.provinsi = "Provinsi wajib dipilih";
    if (f.samaAlamat === "tidak") {
      if (!f.alamatDomisili.trim()) e.alamatDomisili = "Alamat domisili wajib diisi";
      if (!f.kotaDomisili.trim())   e.kotaDomisili   = "Kota domisili wajib diisi";
    }
  }
  if (step === 3) {
    if (!f.noHp.trim())              e.noHp                  = "No. HP wajib diisi";
    if (!f.penjaminTipe)             e.penjaminTipe          = "Penjamin wajib dipilih";
    if (f.penjaminTipe.startsWith("BPJS") && !f.penjaminNomor.trim())
                                     e.penjaminNomor         = "Nomor peserta wajib diisi";
    if (!f.kontakDaruratNama.trim()) e.kontakDaruratNama     = "Nama kontak darurat wajib diisi";
    if (!f.kontakDaruratHubungan)    e.kontakDaruratHubungan = "Hubungan wajib dipilih";
    if (!f.kontakDaruratNoHp.trim()) e.kontakDaruratNoHp     = "No. HP darurat wajib diisi";
  }
  return e;
}

// ── Primitives ─────────────────────────────────────────────────────────────────

type Ch = (field: keyof FormState, value: string | string[]) => void;

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-500">
      <AlertCircle size={10} className="shrink-0" /> {msg}
    </p>
  );
}

function FField({ label, required, error, hint, className, children }: {
  label: string; required?: boolean; error?: string;
  hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <label className="text-xs font-semibold text-slate-600">
          {label}{required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </div>
      {children}
      <ErrMsg msg={error} />
    </div>
  );
}

const iCls = (err?: string) => cn(
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800",
  "placeholder:text-slate-300 outline-none transition-all duration-150",
  err
    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
    : "border-slate-200 hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/60",
);

function TInput({ name, value, onChange, placeholder, error, type = "text", maxLength, onlyDigits }: {
  name: keyof FormState; value: string; onChange: Ch; placeholder?: string;
  error?: string; type?: string; maxLength?: number; onlyDigits?: boolean;
}) {
  return (
    <input
      type={type} value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={(e) => onChange(name, onlyDigits ? e.target.value.replace(/\D/g, "") : e.target.value)}
      className={iCls(error)}
    />
  );
}

function SInput({ name, value, onChange, opts, placeholder, error }: {
  name: keyof FormState; value: string; onChange: Ch;
  opts: string[]; placeholder?: string; error?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      className={cn(iCls(error), "cursor-pointer")}
    >
      <option value="">{placeholder ?? "Pilih…"}</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SCard({ title, icon: Icon, accent = "indigo", children }: {
  title: string; icon: React.ElementType;
  accent?: "indigo" | "slate" | "emerald" | "sky" | "rose" | "amber";
  children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    indigo:  "bg-indigo-100  text-indigo-600",
    slate:   "bg-slate-100   text-slate-500",
    emerald: "bg-emerald-100 text-emerald-600",
    sky:     "bg-sky-100     text-sky-600",
    rose:    "bg-rose-100    text-rose-600",
    amber:   "bg-amber-100   text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-xl", colors[accent])}>
          <Icon size={13} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      </div>
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}

// ── Step 1: Identitas ──────────────────────────────────────────────────────────

function Step1Identitas({ d, e, ch }: { d: FormState; e: Errors; ch: Ch }) {
  return (
    <div className="space-y-4">
      <SCard title="Data Pribadi" icon={User} accent="indigo">
        <FField label="Nama Lengkap" required error={e.namaLengkap}>
          <TInput name="namaLengkap" value={d.namaLengkap} onChange={ch}
            placeholder="Nama sesuai KTP / akta lahir" error={e.namaLengkap} />
        </FField>

        <FField label="NIK" required error={e.nik} hint="16 digit">
          <div className="relative">
            <TInput name="nik" value={d.nik} onChange={ch} placeholder="Nomor Induk Kependudukan"
              maxLength={16} onlyDigits error={e.nik} />
            <span className={cn(
              "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px]",
              d.nik.length === 16 ? "text-emerald-500 font-bold" : "text-slate-400",
            )}>
              {d.nik.length}/16
            </span>
          </div>
        </FField>

        <div className="grid grid-cols-2 gap-3">
          <FField label="Tempat Lahir" required error={e.tempatLahir}>
            <TInput name="tempatLahir" value={d.tempatLahir} onChange={ch}
              placeholder="Kota tempat lahir" error={e.tempatLahir} />
          </FField>
          <FField label="Tanggal Lahir" required error={e.tanggalLahir}>
            <TInput name="tanggalLahir" value={d.tanggalLahir} onChange={ch}
              type="date" error={e.tanggalLahir} />
          </FField>
        </div>

        <FField label="Jenis Kelamin" required error={e.gender}>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: "L" as const, label: "Laki-laki", sym: "♂", on: "border-sky-300 bg-sky-50 text-sky-700" },
              { v: "P" as const, label: "Perempuan",  sym: "♀", on: "border-pink-300 bg-pink-50 text-pink-700" },
            ] as const).map(({ v, label, sym, on }) => (
              <button key={v} type="button" onClick={() => ch("gender", v)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-xs font-bold transition-all active:scale-[0.98]",
                  d.gender === v ? on : "border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50",
                )}>
                <span className="text-base leading-none">{sym}</span> {label}
              </button>
            ))}
          </div>
          <ErrMsg msg={e.gender} />
        </FField>

        <FField label="Golongan Darah" error={e.golonganDarah}>
          <SInput name="golonganDarah" value={d.golonganDarah} onChange={ch}
            opts={GOL_DARAH} placeholder="Pilih golongan darah" />
        </FField>
      </SCard>

      <SCard title="Demografi & Status" icon={BarChart3} accent="slate">
        <div className="grid grid-cols-2 gap-3">
          <FField label="Status Perkawinan" required error={e.statusPerkawinan}>
            <SInput name="statusPerkawinan" value={d.statusPerkawinan} onChange={ch}
              opts={STATUS_NIKAH} error={e.statusPerkawinan} />
          </FField>
          <FField label="Agama" required error={e.agama}>
            <SInput name="agama" value={d.agama} onChange={ch} opts={AGAMA_OPT} error={e.agama} />
          </FField>
          <FField label="Pekerjaan" error={e.pekerjaan}>
            <TInput name="pekerjaan" value={d.pekerjaan} onChange={ch} placeholder="Pekerjaan saat ini" />
          </FField>
          <FField label="Pendidikan Terakhir" error={e.pendidikan}>
            <SInput name="pendidikan" value={d.pendidikan} onChange={ch} opts={PENDIDIKAN} />
          </FField>
          <FField label="Suku Bangsa" error={e.suku}>
            <TInput name="suku" value={d.suku} onChange={ch} placeholder="mis. Jawa, Batak…" />
          </FField>
          <FField label="Kewarganegaraan" error={e.kewarganegaraan}>
            <TInput name="kewarganegaraan" value={d.kewarganegaraan} onChange={ch} placeholder="WNI / WNA" />
          </FField>
        </div>
      </SCard>
    </div>
  );
}

// ── Step 2: Alamat & Kartu Identitas ──────────────────────────────────────────

function Step2AlamatIdentitas({ d, e, ch }: { d: FormState; e: Errors; ch: Ch }) {
  const berbeda = d.samaAlamat === "tidak";
  return (
    <div className="space-y-4">
      <SCard title="Kartu Identitas & Alamat KTP" icon={CreditCard} accent="indigo">
        <div className="grid grid-cols-2 gap-3">
          <FField label="No. Kartu Keluarga (KK)" hint="opsional" error={e.noKK}>
            <TInput name="noKK" value={d.noKK} onChange={ch}
              placeholder="16 digit" maxLength={16} onlyDigits />
          </FField>
          <FField label="RT / RW" hint="opsional" error={e.rtRw}>
            <TInput name="rtRw" value={d.rtRw} onChange={ch} placeholder="mis. 003/007" />
          </FField>
        </div>
        <FField label="Alamat Sesuai KTP" required error={e.alamat}>
          <textarea
            value={d.alamat}
            onChange={(ev) => ch("alamat", ev.target.value)}
            placeholder="Jl. Nama Jalan No. …"
            rows={2}
            className={cn(iCls(e.alamat), "resize-none")}
          />
        </FField>
        <div className="grid grid-cols-2 gap-3">
          <FField label="Kelurahan / Desa" error={e.kelurahan}>
            <TInput name="kelurahan" value={d.kelurahan} onChange={ch} placeholder="Nama kelurahan" />
          </FField>
          <FField label="Kecamatan" error={e.kecamatan}>
            <TInput name="kecamatan" value={d.kecamatan} onChange={ch} placeholder="Nama kecamatan" />
          </FField>
          <FField label="Kota / Kabupaten" required error={e.kota}>
            <TInput name="kota" value={d.kota} onChange={ch} placeholder="Nama kota" error={e.kota} />
          </FField>
          <FField label="Provinsi" required error={e.provinsi}>
            <SInput name="provinsi" value={d.provinsi} onChange={ch}
              opts={PROVINSI} placeholder="Pilih provinsi" error={e.provinsi} />
          </FField>
          <FField label="Kode Pos" hint="5 digit" error={e.kodePos}>
            <TInput name="kodePos" value={d.kodePos} onChange={ch}
              placeholder="12345" maxLength={5} onlyDigits />
          </FField>
        </div>
      </SCard>

      <SCard title="Alamat Domisili Sekarang" icon={Home} accent="sky">
        <button
          type="button"
          onClick={() => ch("samaAlamat", berbeda ? "ya" : "tidak")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-xs font-semibold transition-all",
            !berbeda
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
          )}
        >
          <div className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
            !berbeda ? "bg-emerald-500" : "bg-slate-300",
          )}>
            <span className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200",
              !berbeda ? "left-4" : "left-0.5",
            )} />
          </div>
          Alamat domisili sama dengan alamat KTP
        </button>

        {berbeda && (
          <div className="space-y-3.5 pt-1">
            <FField label="Alamat Domisili" required error={e.alamatDomisili}>
              <textarea
                value={d.alamatDomisili}
                onChange={(ev) => ch("alamatDomisili", ev.target.value)}
                placeholder="Jl. Nama Jalan No. … (tempat tinggal sekarang)"
                rows={2}
                className={cn(iCls(e.alamatDomisili), "resize-none")}
              />
            </FField>
            <div className="grid grid-cols-2 gap-3">
              <FField label="Kelurahan / Desa" error={e.kelurahanDomisili}>
                <TInput name="kelurahanDomisili" value={d.kelurahanDomisili} onChange={ch}
                  placeholder="Kelurahan domisili" />
              </FField>
              <FField label="Kecamatan" error={e.kecamatanDomisili}>
                <TInput name="kecamatanDomisili" value={d.kecamatanDomisili} onChange={ch}
                  placeholder="Kecamatan domisili" />
              </FField>
              <FField label="Kota / Kabupaten" required error={e.kotaDomisili}>
                <TInput name="kotaDomisili" value={d.kotaDomisili} onChange={ch}
                  placeholder="Kota domisili" error={e.kotaDomisili} />
              </FField>
              <FField label="Provinsi" error={e.provinsiDomisili}>
                <SInput name="provinsiDomisili" value={d.provinsiDomisili} onChange={ch}
                  opts={PROVINSI} placeholder="Provinsi domisili" />
              </FField>
              <FField label="Kode Pos" hint="5 digit" error={e.kodePosDomisili}>
                <TInput name="kodePosDomisili" value={d.kodePosDomisili} onChange={ch}
                  placeholder="12345" maxLength={5} onlyDigits />
              </FField>
            </div>
          </div>
        )}
      </SCard>
    </div>
  );
}

// ── Step 3: Kontak & Keluarga ──────────────────────────────────────────────────

function Step3KontakKeluarga({ d, e, ch }: { d: FormState; e: Errors; ch: Ch }) {
  const isBpjs     = d.penjaminTipe.startsWith("BPJS");
  const needsNomor = isBpjs || d.penjaminTipe === "Asuransi";

  function addAlergi() {
    const v = d.alergiInput.trim();
    if (v && !d.alergi.includes(v)) {
      ch("alergi", [...d.alergi, v]);
      ch("alergiInput", "");
    }
  }

  return (
    <div className="space-y-4">
      <SCard title="Kontak Pasien" icon={Phone} accent="indigo">
        <div className="grid grid-cols-2 gap-3">
          <FField label="No. HP / WhatsApp" required error={e.noHp}>
            <TInput name="noHp" value={d.noHp} onChange={ch}
              placeholder="08xx-xxxx-xxxx" type="tel" error={e.noHp} />
          </FField>
          <FField label="Alamat Email" hint="opsional" error={e.email}>
            <TInput name="email" value={d.email} onChange={ch}
              placeholder="contoh@email.com" type="email" />
          </FField>
        </div>
      </SCard>

      <SCard title="Penjamin Kesehatan" icon={Shield} accent="sky">
        <div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PENJAMIN_OPTS.map(({ value, label, sub, sel }) => (
              <button key={value} type="button" onClick={() => ch("penjaminTipe", value)}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition-all duration-150 active:scale-[0.99]",
                  d.penjaminTipe === value
                    ? sel
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60",
                )}>
                <p className={cn(
                  "text-xs font-bold leading-tight",
                  d.penjaminTipe === value ? "inherit" : "text-slate-700",
                )}>
                  {label}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
              </button>
            ))}
          </div>
          <ErrMsg msg={e.penjaminTipe} />
        </div>

        {d.penjaminTipe && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {needsNomor && (
              <FField
                label={isBpjs ? "Nomor Peserta BPJS" : "Nama / Nomor Polis"}
                required={isBpjs}
                error={e.penjaminNomor}
                className="col-span-2"
              >
                <TInput name="penjaminNomor" value={d.penjaminNomor} onChange={ch}
                  placeholder={isBpjs ? "13 digit nomor peserta" : "Nama perusahaan asuransi"}
                  error={e.penjaminNomor} />
              </FField>
            )}
            {isBpjs && (
              <FField label="Kelas Rawat" error={e.penjaminKelas}>
                <SInput name="penjaminKelas" value={d.penjaminKelas} onChange={ch}
                  opts={["1", "2", "3"]} placeholder="Pilih kelas" />
              </FField>
            )}
            {needsNomor && (
              <FField label="Berlaku Sampai" error={e.penjaminBerlakuSampai}>
                <TInput name="penjaminBerlakuSampai" value={d.penjaminBerlakuSampai} onChange={ch} type="date" />
              </FField>
            )}
          </div>
        )}
      </SCard>

      <SCard title="Kontak Darurat & Keluarga" icon={Users} accent="emerald">
        <div className="grid grid-cols-2 gap-3">
          <FField label="Nama Lengkap" required error={e.kontakDaruratNama} className="col-span-2">
            <TInput name="kontakDaruratNama" value={d.kontakDaruratNama} onChange={ch}
              placeholder="Nama anggota keluarga / wali" error={e.kontakDaruratNama} />
          </FField>
          <FField label="Hubungan dengan Pasien" required error={e.kontakDaruratHubungan}>
            <SInput name="kontakDaruratHubungan" value={d.kontakDaruratHubungan} onChange={ch}
              opts={HUBUNGAN} error={e.kontakDaruratHubungan} />
          </FField>
          <FField label="No. HP Darurat" required error={e.kontakDaruratNoHp}>
            <TInput name="kontakDaruratNoHp" value={d.kontakDaruratNoHp} onChange={ch}
              placeholder="08xx-xxxx-xxxx" type="tel" error={e.kontakDaruratNoHp} />
          </FField>
        </div>
      </SCard>

      <SCard title="Riwayat Alergi" icon={Leaf} accent="rose">
        <div className="flex gap-2">
          <input
            value={d.alergiInput}
            onChange={(ev) => ch("alergiInput", ev.target.value)}
            onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); addAlergi(); } }}
            placeholder="Ketik alergi, lalu tekan Enter atau klik Tambah…"
            className={cn(iCls(), "flex-1")}
          />
          <button type="button" onClick={addAlergi}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
            <Plus size={13} /> Tambah
          </button>
        </div>
        {d.alergi.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {d.alergi.map((a) => (
              <span key={a}
                className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                {a}
                <button type="button"
                  onClick={() => ch("alergi", d.alergi.filter((x) => x !== a))}
                  className="transition hover:text-red-900">
                  <XIcon size={10} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] italic text-slate-400">Belum ada alergi tercatat — opsional</p>
        )}
      </SCard>
    </div>
  );
}

// ── StepContent (router) ───────────────────────────────────────────────────────

export function StepContent({
  step, data, errors, onChange,
}: {
  step: number; data: FormState; errors: Errors;
  onChange: (field: keyof FormState, value: string | string[]) => void;
}) {
  const p = { d: data, e: errors, ch: onChange };
  if (step === 1) return <Step1Identitas {...p} />;
  if (step === 2) return <Step2AlamatIdentitas {...p} />;
  return <Step3KontakKeluarga {...p} />;
}
