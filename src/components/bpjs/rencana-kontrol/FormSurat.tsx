"use client";

// Form surat rencana kontrol (V-Claim RencanaKontrol/v2/insert & update — No. SEP asal + formulir
// PRB) atau SPRI (RencanaKontrol/InsertSPRI & UpdateSPRI — No. kartu). Satu komponen untuk
// keduanya; dulu empat form terpisah (insert/update × RK/SPRI) dengan <select> poli/dokter statis
// dan email operator tertulis langsung. Langkah bernomor: (1) periksa SEP asal / peserta → kartu
// ringkasan, (2) tanggal rencana (≥ hari ini) + poli & dokter dari referensi V-Claim beserta
// kapasitasnya, (3) formulir PRB (rencana kontrol saja). Panel ringkasan di kanan ikut berubah.
// Mode ubah dibuka dari Daftar surat: surat dimuat & diisikan, nomor SEP/kartu dikunci. Galat
// tampil setelah interaksi; simpan gagal → fokus ke isian pertama yang salah. `user` = akun login.
// Status memuat diturunkan dari kunci (tanpa setState sinkron di effect).
// Komponen shadcn: Card · Input · Label · Button · Spinner · Alert · RadioGroup · Collapsible.

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CalendarPlus, CreditCard, FileText, Save, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/shared/inputs";
import { useSessionOptional } from "@/contexts/SessionContext";
import { INPUT_ISI, LabelWajib, PesanGalat } from "@/components/bpjs/shared/formUi";
import { GALAT_KONEKSI, GALAT_TIDAK_ADA, labelGalat } from "@/components/bpjs/shared/galat";
import { PANJANG_KARTU, rapikanKartu, validasiKartu } from "@/components/bpjs/shared/kartu";
import { hariIniISO } from "@/components/bpjs/shared/tanggal";
import { useUmumkanGalat } from "@/components/bpjs/shared/useUmumkanGalat";
import { BadgeNada, GalatVClaim, KARTU } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { getPesertaByKartu } from "@/lib/bpjs/vClaimKepesertaan";
import { getNoSuratKontrol, getSEPUntukRK, insertRKV2, insertSPRI, updateRKV2, updateSPRI } from "@/lib/bpjs/vClaimRencanaKontrol";
import { emptyPRBFormData, type BPJSError, type PesertaRecord, type PRBFormData, type PRBKodeStatus, type SEPUntukRKRecord } from "@/lib/bpjs/bpjsShared";
import PRBForm from "./PRBForm";
import PilihPoliDokter, { type Pilihan } from "./PilihPoliDokter";
import { KartuPeserta, KartuSep } from "./IdentitasSurat";
import SuratTerbit, { type RingkasanSurat } from "./SuratTerbit";
import { DataUji, Langkah, PanelRingkasan, fokusRadio } from "./formSuratUi";
import { PRB_LABELS, kolomPRBSalah } from "./prbShared";
import { JENIS_SURAT, UJI_KARTU, UJI_SEP, tglRencanaAwal, validasiSep, validasiTglRencana, type JenisSurat, type UbahSurat } from "./rencanaKontrolShared";

type Identitas = { ok: true; sep: SEPUntukRKRecord | null; peserta: PesertaRecord | null } | { ok: false; error: BPJSError };
type HasilCek = Identitas & { kunci: string; nomor: string };
type HasilUbah = { kunci: string; ok: true } | { kunci: string; ok: false; error: BPJSError };
type Kirim =
  | { status: "idle" }
  | { status: "mengirim" }
  | { status: "galat"; error: BPJSError }
  | { status: "terbit"; noSurat: string; ringkasan: RingkasanSurat; diubah: boolean };

async function periksaIdentitas(jenis: JenisSurat, nomor: string, hariIni: string): Promise<Identitas> {
  if (jenis === "kontrol") {
    const res = await getSEPUntukRK(nomor);
    if (!res.ok) return { ok: false, error: res.error };
    return res.value.response ? { ok: true, sep: res.value.response, peserta: null } : { ok: false, error: GALAT_TIDAK_ADA };
  }
  const res = await getPesertaByKartu(nomor, hariIni);
  if (!res.ok) return { ok: false, error: res.error };
  return res.value.response ? { ok: true, sep: null, peserta: res.value.response } : { ok: false, error: GALAT_TIDAK_ADA };
}

export interface PermintaanForm {
  /** Naik tiap permintaan dari tab lain (surat baru / ubah) agar permintaan sama tetap diproses. */
  n: number;
  /** Surat yang diubah; null = surat baru. */
  ubah: UbahSurat | null;
}

export default function FormSurat({
  jenis,
  permintaan,
  aktif,
  onKeDaftar,
  onTersimpan,
}: {
  jenis: JenisSurat;
  /** Permintaan dari Daftar surat (tombol Surat baru / Ubah surat). */
  permintaan: PermintaanForm | null;
  /** Tab ini sedang tampil — fokus ke judul hanya setelah tampil. */
  aktif: boolean;
  onKeDaftar: () => void;
  /** Surat berhasil terbit / diubah → daftar perlu dimuat ulang. */
  onTersimpan: () => void;
}) {
  const id = useId();
  const hariIni = hariIniISO();
  const sesi = useSessionOptional();
  const pengumum = useUmumkanGalat();
  // Fungsi stabil (useCallback) — objek `pengumum` sendiri baru tiap render, jangan jadi dependensi efek.
  const umumkan = pengumum.umumkan;
  const lupakanGalat = pengumum.bersihkan;
  const nomorRef = useRef<HTMLInputElement>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const kontrol = jenis === "kontrol";
  const J = JENIS_SURAT[jenis];
  const labelNomor = kontrol ? "No. SEP asal" : "No. kartu";

  const [noSuratUbah, setNoSuratUbah] = useState<string | null>(null);
  const [nomor, setNomor] = useState("");
  const [cek, setCek] = useState<{ nomor: string; n: number } | null>(null);
  const [hasilCek, setHasilCek] = useState<HasilCek | null>(null);
  const [tgl, setTgl] = useState(() => tglRencanaAwal(hariIniISO()));
  const [poli, setPoli] = useState<Pilihan | null>(null);
  const [dokter, setDokter] = useState<Pilihan | null>(null);
  const [prbKode, setPrbKode] = useState<PRBKodeStatus | null>(null);
  const [prbData, setPrbData] = useState<PRBFormData>(emptyPRBFormData);
  const [prbKunci, setPrbKunci] = useState(0);
  const [sentuhNomor, setSentuhNomor] = useState(false);
  const [sentuhTgl, setSentuhTgl] = useState(false);
  const [dicoba, setDicoba] = useState(false);
  const [kirim, setKirim] = useState<Kirim>({ status: "idle" });
  const [muatUbah, setMuatUbah] = useState<{ noSurat: string; noKartu: string; n: number } | null>(null);
  const [hasilUbah, setHasilUbah] = useState<HasilUbah | null>(null);

  /** Kosongkan form ke keadaan surat baru (hanya state — aman dipanggil saat render). */
  function kosongkan() {
    setNoSuratUbah(null);
    setMuatUbah(null);
    setNomor("");
    setCek(null);
    setTgl(tglRencanaAwal(hariIniISO()));
    setPoli(null);
    setDokter(null);
    setPrbKode(null);
    setPrbData(emptyPRBFormData());
    setPrbKunci((k) => k + 1);
    setSentuhNomor(false);
    setSentuhTgl(false);
    setDicoba(false);
    setKirim({ status: "idle" });
  }

  // Permintaan dari daftar — diterapkan sekali per `n` (pola adjust-on-render). Surat baru hanya
  // mengosongkan form bila sedang mode ubah / sudah terbit (isian surat baru yang belum selesai
  // tidak dibuang).
  const [permintaanN, setPermintaanN] = useState<number | null>(null);
  if (permintaan && permintaan.n !== permintaanN) {
    setPermintaanN(permintaan.n);
    const u = permintaan.ubah;
    if (u) {
      kosongkan();
      setNoSuratUbah(u.noSurat);
      setMuatUbah({ noSurat: u.noSurat, noKartu: u.noKartu, n: u.n });
      setNomor(kontrol ? "" : u.noKartu);
    } else if (noSuratUbah !== null || kirim.status === "terbit") {
      kosongkan();
    }
  }

  // Fokus ke judul form setelah tab tampil (sekali per permintaan).
  const sudahFokus = useRef<number | null>(null);
  useEffect(() => {
    if (!aktif || permintaanN === null || sudahFokus.current === permintaanN) return;
    sudahFokus.current = permintaanN;
    judulRef.current?.focus();
  }, [aktif, permintaanN]);

  // Muat surat yang diubah lalu isikan ke form.
  const kunciUbah = muatUbah ? `${muatUbah.noSurat}#${muatUbah.n}` : null;
  const memuatUbah = kunciUbah !== null && hasilUbah?.kunci !== kunciUbah;
  useEffect(() => {
    if (!muatUbah || kunciUbah === null) return;
    let batal = false;
    getNoSuratKontrol(muatUbah.noSurat)
      .then((res) => {
        if (batal) return;
        if (!res.ok || !res.value.response) {
          setHasilUbah({ kunci: kunciUbah, ok: false, error: res.ok ? GALAT_TIDAK_ADA : res.error });
          return;
        }
        const d = res.value.response;
        const no = kontrol ? (d.sep?.noSep ?? "") : muatUbah.noKartu;
        setNomor(no);
        if (no) setCek((c) => ({ nomor: no, n: (c?.n ?? 0) + 1 }));
        setTgl(d.tglRencanaKontrol);
        setPoli({ kode: d.poliTujuan, nama: d.namaPoliTujuan });
        setDokter({ kode: d.kodeDokter, nama: d.namaDokter });
        if (kontrol) {
          setPrbKode(d.formPRB.kdStatusPRB);
          setPrbData(d.formPRB.data);
          setPrbKunci((k) => k + 1);
        }
        setHasilUbah({ kunci: kunciUbah, ok: true });
      })
      .catch(() => {
        if (!batal) setHasilUbah({ kunci: kunciUbah, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunciUbah, muatUbah, kontrol]);

  // Periksa SEP / peserta.
  const kunciCek = cek ? `${cek.nomor}#${cek.n}` : null;
  const memeriksa = kunciCek !== null && hasilCek?.kunci !== kunciCek;
  useEffect(() => {
    if (!cek || kunciCek === null) return;
    let batal = false;
    periksaIdentitas(jenis, cek.nomor, hariIniISO())
      .then((h) => {
        if (batal) return;
        setHasilCek({ ...h, kunci: kunciCek, nomor: cek.nomor });
        // Tiap pemeriksaan gagal diumumkan (kunci "cek" dilupakan dulu agar gagal berulang tetap terbaca).
        lupakanGalat("cek");
        if (!h.ok) umumkan(labelGalat(h.error, kontrol ? "SEP" : "Peserta").title, "cek");
      })
      .catch(() => {
        if (!batal) setHasilCek({ kunci: kunciCek, nomor: cek.nomor, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunciCek, cek, jenis, kontrol, umumkan, lupakanGalat]);

  const v = nomor.trim();
  const valNomor = kontrol ? validasiSep(v) : validasiKartu(v);
  const cekTampil = hasilCek && !memeriksa && hasilCek.nomor === v ? hasilCek : null;
  const terverifikasi = cekTampil && cekTampil.ok ? cekTampil : null;
  const galatNomor =
    sentuhNomor || dicoba ? (valNomor ?? (dicoba && !terverifikasi && !memeriksa && !cekTampil ? `Tekan Periksa untuk memeriksa ${labelNomor}` : null)) : null;
  const valTgl = validasiTglRencana(tgl, hariIni);
  const galatTgl = sentuhTgl || dicoba ? valTgl : null;
  const galatPoli = dicoba && !poli ? "Pilih poli tujuan" : null;
  const galatDokter = dicoba && poli && !dokter ? "Pilih dokter" : null;
  const galatPrb = kontrol && dicoba && !prbKode ? "Pilih penyakit kronik peserta" : null;
  const nama = terverifikasi ? (terverifikasi.sep?.peserta.nama ?? terverifikasi.peserta?.nama ?? null) : null;

  function periksa() {
    setSentuhNomor(true);
    if (valNomor) {
      // Fokus ke kolom membacakan galatnya lewat aria-describedby — tidak perlu diumumkan lagi.
      pengumum.tandaiDibacakan("nomor");
      nomorRef.current?.focus();
      return;
    }
    setCek((c) => ({ nomor: v, n: (c?.n ?? 0) + 1 }));
  }

  function reset() {
    kosongkan();
    pengumum.bersihkan("nomor");
    pengumum.bersihkan("tgl");
  }

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (kirim.status === "mengirim") return;
    setDicoba(true);
    if (!terverifikasi) {
      pengumum.tandaiDibacakan("nomor");
      nomorRef.current?.focus();
      return;
    }
    if (valTgl) {
      pengumum.tandaiDibacakan("tgl");
      document.getElementById(`${id}-tgl`)?.focus();
      return;
    }
    if (!poli) return fokusRadio(`${id}-poli-label`);
    if (!dokter) return fokusRadio(`${id}-dokter-label`);
    const user = sesi?.session?.username ?? "tanpa-sesi";
    const dasar = { kodeDokter: dokter.kode, poliKontrol: poli.kode, tglRencanaKontrol: tgl, user };

    let noSurat: string | null = null;
    let error: BPJSError | null = null;
    try {
      if (kontrol) {
        if (!prbKode) return fokusRadio(`${id}-prb-kode-label`);
        const salah = kolomPRBSalah(prbKode, prbData);
        if (salah) {
          document.getElementById(`${id}-prb-${salah}`)?.focus();
          return;
        }
        setKirim({ status: "mengirim" });
        const formPRB = { kdStatusPRB: prbKode, data: prbData };
        if (noSuratUbah) {
          const res = await updateRKV2({ ...dasar, noSuratKontrol: noSuratUbah, noSEP: v, formPRB });
          if (res.ok) noSurat = res.value.response?.noSuratKontrol ?? noSuratUbah;
          else error = res.error;
        } else {
          const res = await insertRKV2({ ...dasar, noSEP: v, formPRB });
          if (res.ok) noSurat = res.value.response?.noSurat ?? null;
          else error = res.error;
        }
      } else {
        setKirim({ status: "mengirim" });
        if (noSuratUbah) {
          const res = await updateSPRI({ ...dasar, noSPRI: noSuratUbah });
          if (res.ok) noSurat = res.value.response?.noSPRI ?? noSuratUbah;
          else error = res.error;
        } else {
          const res = await insertSPRI({ ...dasar, noKartu: v });
          if (res.ok) noSurat = res.value.response?.noSPRI ?? null;
          else error = res.error;
        }
      }
    } catch {
      error = GALAT_KONEKSI;
    }

    if (!noSurat) {
      setKirim({ status: "galat", error: error ?? GALAT_TIDAK_ADA });
      return;
    }
    onTersimpan();
    setKirim({
      status: "terbit",
      noSurat,
      diubah: noSuratUbah !== null,
      ringkasan: { nama: nama ?? "—", labelNomor, nomor: v, tgl, poli: poli.nama, dokter: dokter.nama },
    });
  }

  if (kirim.status === "terbit") {
    return (
      <SuratTerbit
        jenis={jenis}
        noSurat={kirim.noSurat}
        diubah={kirim.diubah}
        ringkasan={kirim.ringkasan}
        onBaru={reset}
        onKeDaftar={() => {
          reset();
          onKeDaftar();
        }}
      />
    );
  }

  const mengirim = kirim.status === "mengirim";
  const IkonNomor = kontrol ? FileText : CreditCard;
  const ubahGagal = hasilUbah && !hasilUbah.ok && !memuatUbah ? hasilUbah : null;

  return (
    <div className="grid items-start gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className={KARTU}>
        <form onSubmit={simpan} noValidate aria-labelledby={`${id}-judul`} aria-busy={memuatUbah} className="flex flex-col gap-6 p-4">
          {/* Kepala */}
          <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
            <div className="min-w-0 flex-1">
              <h2 id={`${id}-judul`} ref={judulRef} tabIndex={-1} className="text-sm font-semibold outline-none">
                {noSuratUbah ? `Ubah ${J.sebutan}` : `${J.label} baru`}
              </h2>
              <p className="text-xs text-muted-foreground">
                {kontrol
                  ? "Jadwal kontrol pasien ke poli spesialis, dibuat dari SEP kunjungan sebelumnya"
                  : "Surat perintah rawat inap untuk admisi terencana, dibuat dari No. kartu peserta"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Isian bertanda <span aria-hidden="true" className="text-rose-600">*</span>
                <span className="sr-only">bintang</span> wajib diisi.
              </p>
            </div>
            {noSuratUbah && (
              <div className="flex items-center gap-1.5">
                <BadgeNada tone="blue" className="tabular-nums">
                  {noSuratUbah}
                </BadgeNada>
                <Button type="button" variant="ghost" size="xs" onClick={reset} className="text-muted-foreground">
                  <X aria-hidden="true" />
                  Batal ubah
                </Button>
              </div>
            )}
          </div>

          {ubahGagal ? (
            <GalatVClaim error={ubahGagal.error} objek="Surat" onUlang={() => setMuatUbah((m) => (m ? { ...m, n: m.n + 1 } : m))} />
          ) : memuatUbah ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          ) : (
            <>
              {/* 1 · Identitas */}
              <Langkah
                id={`${id}-l1`}
                no={1}
                judul={kontrol ? "SEP asal" : "Peserta"}
                ket={noSuratUbah ? `${labelNomor} tidak bisa diubah pada surat yang sudah terbit` : undefined}
                selesai={Boolean(terverifikasi)}
              >
                <div className="flex flex-col gap-1.5">
                  <LabelWajib htmlFor={`${id}-nomor`}>{labelNomor}</LabelWajib>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative min-w-52 flex-1">
                      <Input
                        ref={nomorRef}
                        id={`${id}-nomor`}
                        value={nomor}
                        readOnly={noSuratUbah !== null}
                        inputMode={kontrol ? undefined : "numeric"}
                        maxLength={kontrol ? 30 : PANJANG_KARTU}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize={kontrol ? "characters" : "off"}
                        spellCheck={false}
                        enterKeyHint="search"
                        placeholder={kontrol ? "mis. 0301R0011117V000008" : "13 digit, mis. 0001234567891"}
                        aria-invalid={Boolean(galatNomor)}
                        aria-describedby={galatNomor ? `${id}-nomor-hint ${id}-nomor-err` : `${id}-nomor-hint`}
                        onChange={(e) => {
                          const n = kontrol ? e.target.value.replace(/\s+/g, "").toUpperCase() : rapikanKartu(e.target.value);
                          setNomor(n);
                          if (!(kontrol ? validasiSep(n) : validasiKartu(n))) pengumum.bersihkan("nomor");
                        }}
                        onKeyDown={(e) => {
                          // Enter di kolom ini = Periksa, bukan menyimpan surat (abaikan Enter saat komposisi IME).
                          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            if (!noSuratUbah) periksa();
                          }
                        }}
                        onBlur={() => {
                          if (!v) return;
                          setSentuhNomor(true);
                          if (valNomor) pengumum.umumkan(valNomor, "nomor");
                        }}
                        className={cn(INPUT_ISI, "pl-9 tracking-wide tabular-nums read-only:bg-slate-50 read-only:text-muted-foreground placeholder:tracking-normal")}
                      />
                      <IkonNomor className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    </div>
                    {!noSuratUbah && (
                      <Button type="button" variant="secondary" size="sm" onClick={periksa} disabled={memeriksa} className="h-10 rounded-xl text-xs">
                        {memeriksa ? <Spinner className="size-3.5" aria-hidden="true" /> : <Search aria-hidden="true" />}
                        Periksa
                      </Button>
                    )}
                  </div>
                  <p id={`${id}-nomor-hint`} className="text-[11px] text-muted-foreground tabular-nums">
                    {kontrol ? "SEP kunjungan yang menjadi dasar kontrol berikutnya" : `${v.length}/${PANJANG_KARTU} digit · status kepesertaan diperiksa hari ini`}
                  </p>
                  {galatNomor && <PesanGalat id={`${id}-nomor-err`}>{galatNomor}</PesanGalat>}
                </div>
                {memeriksa ? (
                  <Skeleton className="h-28 rounded-xl" aria-hidden="true" />
                ) : cekTampil && !cekTampil.ok ? (
                  <GalatVClaim error={cekTampil.error} objek={kontrol ? "SEP" : "Peserta"} onUlang={periksa} />
                ) : terverifikasi?.sep ? (
                  <KartuSep sep={terverifikasi.sep} />
                ) : terverifikasi?.peserta ? (
                  <KartuPeserta peserta={terverifikasi.peserta} />
                ) : null}
              </Langkah>

              {/* 2 · Jadwal & tujuan */}
              <Langkah id={`${id}-l2`} no={2} judul="Jadwal & tujuan" selesai={!valTgl && Boolean(poli && dokter)}>
                <div className="flex max-w-xs flex-col gap-1.5">
                  <LabelWajib htmlFor={`${id}-tgl`} native={false}>
                    Tanggal rencana {kontrol ? "kontrol" : "rawat inap"}
                  </LabelWajib>
                  <DatePicker
                    id={`${id}-tgl`}
                    value={tgl}
                    onChange={(t) => {
                      setTgl(t);
                      setSentuhTgl(true);
                      const g = validasiTglRencana(t, hariIniISO());
                      if (g) pengumum.umumkan(g, "tgl");
                      else pengumum.bersihkan("tgl");
                    }}
                    variant="filled"
                    clearable={false}
                    invalid={Boolean(galatTgl)}
                    ariaDescribedBy={galatTgl ? `${id}-tgl-err` : undefined}
                    className="tabular-nums"
                  />
                  {galatTgl && <PesanGalat id={`${id}-tgl-err`}>{galatTgl}</PesanGalat>}
                </div>
                <PilihPoliDokter
                  id={id}
                  jenis={J.kode}
                  nomor={terverifikasi ? v : null}
                  tgl={valTgl ? null : tgl}
                  poli={poli}
                  onPoli={setPoli}
                  dokter={dokter}
                  onDokter={setDokter}
                  galatPoli={galatPoli}
                  galatDokter={galatDokter}
                />
              </Langkah>

              {/* 3 · PRB (rencana kontrol) */}
              {kontrol && (
                <Langkah
                  id={`${id}-l3`}
                  no={3}
                  judul="Formulir Program Rujuk Balik"
                  ket="Wajib pada rencana kontrol V2: penyakit kronik peserta + data klinis terakhir yang tersedia"
                  selesai={Boolean(prbKode) && (prbKode ? !kolomPRBSalah(prbKode, prbData) : false)}
                >
                  <PRBForm
                    key={prbKunci}
                    id={`${id}-prb`}
                    kode={prbKode}
                    data={prbData}
                    onKode={setPrbKode}
                    onField={(f, val) => setPrbData((d) => ({ ...d, [f]: val }))}
                    galatKode={galatPrb}
                    tampilSemuaGalat={dicoba}
                  />
                </Langkah>
              )}

              {kirim.status === "galat" && <GalatVClaim error={kirim.error} objek="Surat" />}

              <div className="flex flex-wrap items-center justify-end gap-2">
                {noSuratUbah && (
                  <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={mengirim} className="text-xs">
                    Batal
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={mengirim} className="bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                  {mengirim ? (
                    <>
                      <Spinner className="size-3.5" aria-hidden="true" />
                      Menyimpan…
                    </>
                  ) : noSuratUbah ? (
                    <>
                      <Save aria-hidden="true" />
                      Simpan perubahan
                    </>
                  ) : (
                    <>
                      <CalendarPlus aria-hidden="true" />
                      Terbitkan {J.sebutan}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          <p aria-live="polite" className="sr-only">
            {pengumum.teks}
          </p>
          <p role="status" className="sr-only">
            {terverifikasi ? `${kontrol ? "SEP" : "Peserta"} ditemukan: ${nama ?? ""}` : ""}
            {kirim.status === "galat" ? ` Gagal menyimpan: ${labelGalat(kirim.error, "Surat").title}` : ""}
          </p>
        </form>
      </Card>

      <aside className="flex flex-col gap-3" aria-label="Ringkasan surat">
        <PanelRingkasan
          judul={`Ringkasan ${J.sebutan}`}
          tgl={valTgl ? null : tgl}
          baris={[
            { label: "Peserta", nilai: nama },
            { label: labelNomor, nilai: terverifikasi ? v : null },
            { label: "Poli", nilai: poli?.nama ?? null },
            { label: "Dokter", nilai: dokter?.nama ?? null },
            ...(kontrol ? [{ label: "PRB", nilai: prbKode ? `${prbKode} · ${PRB_LABELS[prbKode]}` : null }] : []),
          ]}
          catatan={
            kontrol
              ? "Peserta membawa surat ini saat kontrol; SEP kunjungan kontrol diterbitkan dengan nomor surat sebagai referensi."
              : "SPRI dipakai sebagai rujukan admisi saat SEP rawat inap diterbitkan."
          }
        >
          {!noSuratUbah && (
            <DataUji
              judul="Data uji (mock)"
              pilihan={
                kontrol
                  ? UJI_SEP.map((u) => ({ nilai: u.no, label: u.nama, ket: u.ket }))
                  : UJI_KARTU.map((u) => ({ nilai: u.kartu, label: u.nama, ket: u.ket }))
              }
              onPilih={(n) => {
                setNomor(n);
                setSentuhNomor(false);
                pengumum.bersihkan("nomor");
                setCek((c) => ({ nomor: n, n: (c?.n ?? 0) + 1 }));
              }}
            />
          )}
        </PanelRingkasan>
      </aside>
    </div>
  );
}
