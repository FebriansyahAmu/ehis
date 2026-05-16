"use client";

import { cn } from "@/lib/utils";
import { User, BarChart3, CreditCard, Home, Phone, Users, Leaf, Plus, X as XIcon, Check } from "lucide-react";
import {
  type FormState, GOL_DARAH, AGAMA_OPT, STATUS_NIKAH, PENDIDIKAN, HUBUNGAN, PROVINSI,
} from "./pasienBaruTypes";
import { FField, TInput, SInput, SCard, iCls, ErrMsg, type Ch } from "./pasienBaruShared";

// ── Step 1: Identitas Diri ─────────────────────────────────────────────────────
function Step1Identitas({ d, e, ch }: { d: FormState; e: Record<string, string>; ch: Ch }) {
  return (
    <div className="space-y-4">
      <SCard title="Data Pribadi" icon={User} accent="sky">
        <FField label="Nama Lengkap" required error={e.namaLengkap}>
          <TInput name="namaLengkap" value={d.namaLengkap} onChange={ch}
            placeholder="Nama sesuai KTP / akta lahir" error={e.namaLengkap} />
        </FField>

        <FField label="NIK" required error={e.nik} hint="16 digit">
          <div className="relative">
            <TInput name="nik" value={d.nik} onChange={ch}
              placeholder="Nomor Induk Kependudukan" maxLength={16} onlyDigits error={e.nik} />
            <span className={cn(
              "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px] transition-colors",
              d.nik.length === 16 ? "text-emerald-500 font-bold" : "text-slate-300",
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
              { v: "L" as const, label: "Laki-laki", sym: "♂", on: "border-sky-400 bg-sky-50 text-sky-700" },
              { v: "P" as const, label: "Perempuan",  sym: "♀", on: "border-pink-400 bg-pink-50 text-pink-700" },
            ]).map(({ v, label, sym, on }) => (
              <button key={v} type="button" onClick={() => ch("gender", v)}
                className={cn(
                  "relative flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-xs font-bold transition-all duration-150 active:scale-[0.98]",
                  d.gender === v ? on : "border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50",
                )}>
                <span className="text-base leading-none">{sym}</span> {label}
                {d.gender === v && (
                  <span className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-current/10">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <ErrMsg msg={e.gender} />
        </FField>

        <FField label="Golongan Darah">
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
          <FField label="Pekerjaan">
            <TInput name="pekerjaan" value={d.pekerjaan} onChange={ch} placeholder="Pekerjaan saat ini" />
          </FField>
          <FField label="Pendidikan Terakhir">
            <SInput name="pendidikan" value={d.pendidikan} onChange={ch} opts={PENDIDIKAN} />
          </FField>
          <FField label="Suku Bangsa">
            <TInput name="suku" value={d.suku} onChange={ch} placeholder="mis. Jawa, Batak…" />
          </FField>
          <FField label="Kewarganegaraan">
            <TInput name="kewarganegaraan" value={d.kewarganegaraan} onChange={ch} placeholder="WNI / WNA" />
          </FField>
        </div>
      </SCard>
    </div>
  );
}

// ── Step 2: Alamat ────────────────────────────────────────────────────────────
function Step2Alamat({ d, e, ch }: { d: FormState; e: Record<string, string>; ch: Ch }) {
  const berbeda = d.samaAlamat === "tidak";
  return (
    <div className="space-y-4">
      <SCard title="Alamat Sesuai KTP" icon={CreditCard} accent="sky">
        <FField label="RT / RW" hint="opsional">
          <TInput name="rtRw" value={d.rtRw} onChange={ch} placeholder="mis. 003/007" />
        </FField>
        <FField label="Alamat Lengkap" required error={e.alamat}>
          <textarea
            value={d.alamat}
            onChange={(ev) => ch("alamat", ev.target.value)}
            placeholder="Jl. Nama Jalan No. …"
            rows={2}
            className={cn(iCls(e.alamat), "resize-none")}
          />
        </FField>
        <div className="grid grid-cols-2 gap-3">
          <FField label="Kelurahan / Desa">
            <TInput name="kelurahan" value={d.kelurahan} onChange={ch} placeholder="Nama kelurahan" />
          </FField>
          <FField label="Kecamatan">
            <TInput name="kecamatan" value={d.kecamatan} onChange={ch} placeholder="Nama kecamatan" />
          </FField>
          <FField label="Kota / Kabupaten" required error={e.kota}>
            <TInput name="kota" value={d.kota} onChange={ch} placeholder="Nama kota" error={e.kota} />
          </FField>
          <FField label="Provinsi" required error={e.provinsi}>
            <SInput name="provinsi" value={d.provinsi} onChange={ch}
              opts={PROVINSI} placeholder="Pilih provinsi" error={e.provinsi} />
          </FField>
          <FField label="Kode Pos" hint="5 digit">
            <TInput name="kodePos" value={d.kodePos} onChange={ch}
              placeholder="12345" maxLength={5} onlyDigits />
          </FField>
        </div>
      </SCard>

      <SCard title="Alamat Domisili" icon={Home} accent="sky">
        <button
          type="button"
          onClick={() => ch("samaAlamat", berbeda ? "ya" : "tidak")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-xs font-semibold transition-all duration-200",
            !berbeda
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          <div className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300",
            !berbeda ? "bg-emerald-500" : "bg-slate-300",
          )}>
            <span className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
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
                placeholder="Alamat tempat tinggal sekarang"
                rows={2}
                className={cn(iCls(e.alamatDomisili), "resize-none")}
              />
            </FField>
            <div className="grid grid-cols-2 gap-3">
              <FField label="Kelurahan / Desa">
                <TInput name="kelurahanDomisili" value={d.kelurahanDomisili} onChange={ch}
                  placeholder="Kelurahan domisili" />
              </FField>
              <FField label="Kecamatan">
                <TInput name="kecamatanDomisili" value={d.kecamatanDomisili} onChange={ch}
                  placeholder="Kecamatan domisili" />
              </FField>
              <FField label="Kota / Kabupaten" required error={e.kotaDomisili}>
                <TInput name="kotaDomisili" value={d.kotaDomisili} onChange={ch}
                  placeholder="Kota domisili" error={e.kotaDomisili} />
              </FField>
              <FField label="Provinsi">
                <SInput name="provinsiDomisili" value={d.provinsiDomisili} onChange={ch}
                  opts={PROVINSI} placeholder="Provinsi domisili" />
              </FField>
              <FField label="Kode Pos" hint="5 digit">
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

// ── Step 3: Kontak & Darurat ──────────────────────────────────────────────────
function Step3Kontak({ d, e, ch }: { d: FormState; e: Record<string, string>; ch: Ch }) {
  function addAlergi() {
    const v = d.alergiInput.trim();
    if (v && !d.alergi.includes(v)) {
      ch("alergi", [...d.alergi, v]);
      ch("alergiInput", "");
    }
  }

  return (
    <div className="space-y-4">
      <SCard title="Kontak Pasien" icon={Phone} accent="sky">
        <div className="grid grid-cols-2 gap-3">
          <FField label="No. HP / WhatsApp" required error={e.noHp}>
            <TInput name="noHp" value={d.noHp} onChange={ch}
              placeholder="08xx-xxxx-xxxx" type="tel" error={e.noHp} />
          </FField>
          <FField label="Alamat Email" hint="opsional">
            <TInput name="email" value={d.email} onChange={ch}
              placeholder="contoh@email.com" type="email" />
          </FField>
        </div>
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
            placeholder="Ketik alergi, tekan Enter atau klik Tambah…"
            className={cn(iCls(), "flex-1")}
          />
          <button type="button" onClick={addAlergi}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700">
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
export function StepContent({ step, data, errors, onChange }: {
  step: number; data: FormState; errors: Record<string, string>;
  onChange: (field: keyof FormState, value: string | string[]) => void;
}) {
  const p = { d: data, e: errors, ch: onChange };
  if (step === 1) return <Step1Identitas {...p} />;
  if (step === 2) return <Step2Alamat {...p} />;
  return <Step3Kontak {...p} />;
}
