"use client";

import { cn } from "@/lib/utils";
import {
  User, BarChart3, CreditCard, Home, Phone, Users, Leaf, Plus, X as XIcon, Check,
  Globe, UserX, Fingerprint, Heart, Info, ScanFace, Baby,
} from "lucide-react";
import { DatePicker } from "@/components/shared/inputs/DatePicker";
import { WilayahCascade, type WilayahValue } from "@/components/shared/inputs/WilayahCascade";
import {
  type FormState, type IdentitasMode, type AlergiItem,
  GOL_DARAH, AGAMA_OPT, STATUS_NIKAH, PENDIDIKAN, HUBUNGAN, TINGKAT_ALERGI,
  anonName, isAnonName,
} from "./pasienBaruTypes";
import { FField, TInput, SInput, SCard, iCls, ErrMsg, type Ch } from "./pasienBaruShared";

// ── Segmented: mode identitas (WNI / WNA / Tidak Dikenal) ──────────────────────
const MODES: { v: IdentitasMode; label: string; hint: string; icon: IconComponent; on: string }[] = [
  { v: "WNI",    label: "WNI",           hint: "NIK / KTP",        icon: Fingerprint, on: "border-sky-400 bg-sky-50 text-sky-700" },
  { v: "WNA",    label: "WNA",           hint: "Paspor",           icon: Globe,       on: "border-indigo-400 bg-indigo-50 text-indigo-700" },
  { v: "Anonim", label: "Tidak Dikenal", hint: "Mr.X / darurat",   icon: UserX,       on: "border-amber-400 bg-amber-50 text-amber-700" },
];

function ModeSelector({ d, ch }: { d: FormState; ch: Ch }) {
  function applyMode(m: IdentitasMode) {
    ch("identitas", m);
    if (m === "WNI") { ch("noPaspor", ""); if (!d.kewarganegaraan || d.kewarganegaraan === "Tidak Diketahui") ch("kewarganegaraan", "WNI"); }
    else if (m === "WNA") { ch("nik", ""); if (d.kewarganegaraan === "WNI" || d.kewarganegaraan === "Tidak Diketahui") ch("kewarganegaraan", ""); }
    else { // Anonim
      ch("nik", ""); ch("noPaspor", ""); ch("kewarganegaraan", "Tidak Diketahui");
      if (!d.namaLengkap.trim() || isAnonName(d.namaLengkap)) ch("namaLengkap", anonName(d.gender));
    }
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
      <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Jenis Pendaftaran</p>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map(({ v, label, hint, icon: Icon, on }) => (
          <button key={v} type="button" onClick={() => applyMode(v)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-center transition-all duration-150 active:scale-[0.98]",
              d.identitas === v ? on : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50",
            )}>
            <Icon size={17} />
            <span className="text-[12px] font-bold leading-none">{label}</span>
            <span className="text-[9.5px] leading-none opacity-70">{hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 1: Identitas ─────────────────────────────────────────────────────────
function Step1Identitas({ d, e, ch }: { d: FormState; e: Record<string, string>; ch: Ch }) {
  const anon = d.identitas === "Anonim";
  const wna  = d.identitas === "WNA";

  function pickGender(v: "L" | "P") {
    ch("gender", v);
    if (anon && isAnonName(d.namaLengkap)) ch("namaLengkap", d.namaLengkap.replace(/^(Tn|Ny)\. X/, v === "P" ? "Ny. X" : "Tn. X"));
  }

  return (
    <div className="space-y-4">
      <ModeSelector d={d} ch={ch} />

      {anon && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5">
          <Info size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[11.5px] leading-relaxed text-amber-800">
            <strong>Pasien tak dikenal (Mr.X).</strong> Pelayanan gawat darurat tidak boleh ditunda. Identitas sementara
            dibuat otomatis; NIK, alamat, & kontak opsional. Data dilengkapi / <em>digabung</em> saat identitas diketahui.
          </p>
        </div>
      )}

      <SCard title="Data Pribadi" icon={User} accent={anon ? "amber" : "sky"}>
        <FField label="Nama Lengkap" required error={e.namaLengkap}
          hint={anon ? "pseudonim — boleh diedit" : "sesuai KTP / akta lahir"}>
          <TInput name="namaLengkap" value={d.namaLengkap} onChange={ch}
            placeholder={anon ? "Tn. X / Ny. X" : "Nama lengkap pasien"} error={e.namaLengkap} />
        </FField>

        {!anon && (
          <FField label="Nama Ibu Kandung" error={e.namaIbu} hint="penanda identifikasi (SKP 1)">
            <TInput name="namaIbu" value={d.namaIbu} onChange={ch} placeholder="Nama ibu kandung pasien" />
          </FField>
        )}

        {/* Identitas per-mode */}
        {!anon && !wna && (
          <div className="grid grid-cols-2 gap-3">
            <FField label="NIK" required error={e.nik} hint="16 digit">
              <div className="relative">
                <TInput name="nik" value={d.nik} onChange={ch} placeholder="Nomor Induk Kependudukan"
                  maxLength={16} onlyDigits error={e.nik} />
                <span className={cn(
                  "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px]",
                  d.nik.length === 16 ? "font-bold text-emerald-500" : "text-slate-300",
                )}>{d.nik.length}/16</span>
              </div>
            </FField>
            <FField label="No. Kartu Keluarga" hint="opsional · 16 digit">
              <TInput name="noKK" value={d.noKK} onChange={ch} placeholder="No. KK" maxLength={16} onlyDigits />
            </FField>
          </div>
        )}
        {wna && (
          <FField label="No. Paspor" required error={e.noPaspor}>
            <TInput name="noPaspor" value={d.noPaspor} onChange={ch} placeholder="Nomor paspor" error={e.noPaspor} />
          </FField>
        )}

        {/* Kelahiran / perkiraan umur */}
        {anon ? (
          <FField label="Perkiraan Umur" required error={e.perkiraanUmur} hint="tahun — untuk estimasi tanggal lahir">
            <div className="relative w-40">
              <TInput name="perkiraanUmur" value={d.perkiraanUmur} onChange={ch}
                placeholder="mis. 40" maxLength={3} onlyDigits error={e.perkiraanUmur} />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">tahun</span>
            </div>
          </FField>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <FField label="Tempat Lahir" required error={e.tempatLahir}>
              <TInput name="tempatLahir" value={d.tempatLahir} onChange={ch} placeholder="Kota tempat lahir" error={e.tempatLahir} />
            </FField>
            <FField label="Tanggal Lahir" required error={e.tanggalLahir}>
              <DatePicker value={d.tanggalLahir} onChange={(iso) => ch("tanggalLahir", iso)}
                placeholder="Pilih tanggal lahir"
                className={cn("py-2.5! text-sm!", e.tanggalLahir && "border-red-300!")} />
              <ErrMsg msg={e.tanggalLahir} />
            </FField>
          </div>
        )}

        <FField label="Jenis Kelamin" required error={e.gender} hint={anon ? "perkiraan dari fisik" : undefined}>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: "L" as const, label: "Laki-laki", sym: "♂", on: "border-sky-400 bg-sky-50 text-sky-700" },
              { v: "P" as const, label: "Perempuan", sym: "♀", on: "border-pink-400 bg-pink-50 text-pink-700" },
            ]).map(({ v, label, sym, on }) => (
              <button key={v} type="button" onClick={() => pickGender(v)}
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

        <FField label="Golongan Darah" hint="opsional">
          <SInput name="golonganDarah" value={d.golonganDarah} onChange={ch} icon={Heart}
            opts={GOL_DARAH} placeholder="Pilih golongan darah" />
        </FField>
      </SCard>

      {anon ? (
        <SCard title="Ciri Fisik & Keterangan" icon={ScanFace} accent="amber">
          <FField label="Ciri-ciri Fisik / Keterangan Identitas" hint="untuk identifikasi & medico-legal">
            <textarea
              value={d.catatanIdentitas}
              onChange={(ev) => ch("catatanIdentitas", ev.target.value)}
              placeholder="mis. Laki-laki, ~40 th, tinggi ±170cm, tato lengan kanan, pakaian kemeja biru, dibawa warga dari Jl. …"
              rows={3}
              className={cn(iCls(), "resize-none")}
            />
          </FField>
          <p className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
            <Baby size={11} className="shrink-0" />
            Pengantar & lokasi kejadian dicatat lebih lanjut pada rekam IGD (triase / data kecelakaan).
          </p>
        </SCard>
      ) : (
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
            {wna && (
              <FField label="Kewarganegaraan" required>
                <TInput name="kewarganegaraan" value={d.kewarganegaraan} onChange={ch} placeholder="mis. Malaysia, Singapura…" />
              </FField>
            )}
          </div>
        </SCard>
      )}
    </div>
  );
}

// ── Wilayah block (WilayahCascade → flat FormState via ch) ─────────────────────
function WilayahBlock({ d, ch, dom }: { d: FormState; ch: Ch; dom?: boolean }) {
  const val: WilayahValue = dom
    ? { provinsi: d.provinsiDomisili, kota: d.kotaDomisili, kecamatan: d.kecamatanDomisili, kelurahan: d.kelurahanDomisili, kodeWilayah: d.kodeWilayahDomisili }
    : { provinsi: d.provinsi, kota: d.kota, kecamatan: d.kecamatan, kelurahan: d.kelurahan, kodeWilayah: d.kodeWilayah };
  const K = dom
    ? { p: "provinsiDomisili", k: "kotaDomisili", c: "kecamatanDomisili", l: "kelurahanDomisili", w: "kodeWilayahDomisili" } as const
    : { p: "provinsi", k: "kota", c: "kecamatan", l: "kelurahan", w: "kodeWilayah" } as const;
  return (
    <WilayahCascade
      value={val}
      onChange={(patch) => {
        if (patch.provinsi  !== undefined) ch(K.p, patch.provinsi);
        if (patch.kota      !== undefined) ch(K.k, patch.kota);
        if (patch.kecamatan !== undefined) ch(K.c, patch.kecamatan);
        if (patch.kelurahan !== undefined) ch(K.l, patch.kelurahan);
        if (patch.kodeWilayah !== undefined) ch(K.w, patch.kodeWilayah);
      }}
    />
  );
}

// ── Step 2: Alamat ────────────────────────────────────────────────────────────
function Step2Alamat({ d, e, ch }: { d: FormState; e: Record<string, string>; ch: Ch }) {
  const anon = d.identitas === "Anonim";
  const berbeda = d.samaAlamat === "tidak";

  return (
    <div className="space-y-4">
      {anon && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5">
          <Info size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[11.5px] leading-relaxed text-amber-800">
            Alamat <strong>opsional</strong> untuk pasien tak dikenal — isi bila asal/lokasi diketahui.
          </p>
        </div>
      )}

      <SCard title="Alamat Sesuai KTP" icon={CreditCard} accent="sky">
        <FField label="Alamat Lengkap" required={!anon} error={e.alamat}>
          <textarea
            value={d.alamat}
            onChange={(ev) => ch("alamat", ev.target.value)}
            placeholder="Jl. Nama Jalan No. …"
            rows={2}
            className={cn(iCls(e.alamat), "resize-none")}
          />
        </FField>
        <div className="grid grid-cols-2 gap-3">
          <FField label="RT / RW" hint="opsional">
            <TInput name="rtRw" value={d.rtRw} onChange={ch} placeholder="003 / 007" />
          </FField>
          <FField label="Kode Pos" hint="5 digit">
            <TInput name="kodePos" value={d.kodePos} onChange={ch} placeholder="12345" maxLength={5} onlyDigits />
          </FField>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Wilayah {!anon && <span className="text-red-400">*</span>}
            <span className="ml-1.5 font-normal normal-case tracking-normal text-slate-300">dari data master Kemendagri</span>
          </p>
          <WilayahBlock d={d} ch={ch} />
          {(e.provinsi || e.kota) && <ErrMsg msg={e.provinsi || e.kota} />}
        </div>
      </SCard>

      {!anon && (
        <SCard title="Alamat Domisili" icon={Home} accent="sky">
          <button
            type="button"
            onClick={() => ch("samaAlamat", berbeda ? "ya" : "tidak")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-xs font-semibold transition-all duration-200",
              !berbeda ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <div className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300", !berbeda ? "bg-emerald-500" : "bg-slate-300")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300", !berbeda ? "left-4" : "left-0.5")} />
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
                <FField label="RT / RW" hint="opsional">
                  <TInput name="rtRwDomisili" value={d.rtRwDomisili} onChange={ch} placeholder="003 / 007" />
                </FField>
                <FField label="Kode Pos" hint="5 digit">
                  <TInput name="kodePosDomisili" value={d.kodePosDomisili} onChange={ch} placeholder="12345" maxLength={5} onlyDigits />
                </FField>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Wilayah Domisili <span className="text-red-400">*</span>
                </p>
                <WilayahBlock d={d} ch={ch} dom />
                {e.provinsiDomisili && <ErrMsg msg={e.provinsiDomisili} />}
              </div>
            </div>
          )}
        </SCard>
      )}
    </div>
  );
}

// ── Step 3: Kontak & Alergi ───────────────────────────────────────────────────
function Step3Kontak({ d, e, ch }: { d: FormState; e: Record<string, string>; ch: Ch }) {
  const anon = d.identitas === "Anonim";

  function addAlergi() {
    const nama = d.alergiInput.trim();
    if (!nama || d.alergi.some((a) => a.nama.toLowerCase() === nama.toLowerCase())) return;
    const item: AlergiItem = { nama, reaksi: d.alergiReaksi.trim(), tingkat: d.alergiTingkat };
    ch("alergi", [...d.alergi, item]);
    ch("alergiInput", ""); ch("alergiReaksi", ""); ch("alergiTingkat", "");
  }
  const TINGKAT_TONE: Record<string, string> = {
    Ringan: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Sedang: "border-amber-200 bg-amber-50 text-amber-700",
    Berat:  "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className="space-y-4">
      <SCard title="Kontak Pasien" icon={Phone} accent={anon ? "amber" : "sky"}>
        <div className="grid grid-cols-2 gap-3">
          <FField label="No. HP / WhatsApp" required={!anon} error={e.noHp}>
            <TInput name="noHp" value={d.noHp} onChange={ch} placeholder="08xx-xxxx-xxxx" type="tel" error={e.noHp} />
          </FField>
          <FField label="Alamat Email" hint="opsional">
            <TInput name="email" value={d.email} onChange={ch} placeholder="contoh@email.com" type="email" />
          </FField>
        </div>
      </SCard>

      <SCard title="Kontak Darurat & Keluarga" icon={Users} accent="emerald">
        {anon && (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info size={12} className="shrink-0" /> Opsional untuk pasien tak dikenal — isi bila keluarga/pengantar dapat dihubungi.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FField label="Nama Lengkap" required={!anon} error={e.kontakDaruratNama} className="col-span-2">
            <TInput name="kontakDaruratNama" value={d.kontakDaruratNama} onChange={ch}
              placeholder="Nama anggota keluarga / wali / pengantar" error={e.kontakDaruratNama} />
          </FField>
          <FField label="Hubungan dengan Pasien" required={!anon} error={e.kontakDaruratHubungan}>
            <SInput name="kontakDaruratHubungan" value={d.kontakDaruratHubungan} onChange={ch}
              opts={HUBUNGAN} error={e.kontakDaruratHubungan} />
          </FField>
          <FField label="No. HP Darurat" required={!anon} error={e.kontakDaruratNoHp}>
            <TInput name="kontakDaruratNoHp" value={d.kontakDaruratNoHp} onChange={ch}
              placeholder="08xx-xxxx-xxxx" type="tel" error={e.kontakDaruratNoHp} />
          </FField>
        </div>
      </SCard>

      <SCard title="Riwayat Alergi" icon={Leaf} accent="rose">
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_1.4fr_1fr]">
            <input
              value={d.alergiInput}
              onChange={(ev) => ch("alergiInput", ev.target.value)}
              onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); addAlergi(); } }}
              placeholder="Alergen (obat/makanan)…"
              className={cn(iCls())}
            />
            <input
              value={d.alergiReaksi}
              onChange={(ev) => ch("alergiReaksi", ev.target.value)}
              onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); addAlergi(); } }}
              placeholder="Reaksi (mis. gatal, sesak)…"
              className={cn(iCls())}
            />
            <SInput name="alergiTingkat" value={d.alergiTingkat} onChange={ch} opts={TINGKAT_ALERGI} placeholder="Tingkat" />
          </div>
          <button type="button" onClick={addAlergi}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700">
            <Plus size={13} /> Tambah Alergi
          </button>
        </div>

        {d.alergi.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {d.alergi.map((a) => (
              <span key={a.nama}
                className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  a.tingkat ? TINGKAT_TONE[a.tingkat] : "border-red-200 bg-red-50 text-red-700")}>
                <span>{a.nama}</span>
                {a.reaksi && <span className="font-normal opacity-70">· {a.reaksi}</span>}
                {a.tingkat && <span className="rounded bg-white/60 px-1 text-[9px] font-bold uppercase">{a.tingkat}</span>}
                <button type="button" onClick={() => ch("alergi", d.alergi.filter((x) => x.nama !== a.nama))} className="transition hover:opacity-70">
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
  onChange: Ch;
}) {
  const p = { d: data, e: errors, ch: onChange };
  if (step === 1) return <Step1Identitas {...p} />;
  if (step === 2) return <Step2Alamat {...p} />;
  return <Step3Kontak {...p} />;
}
