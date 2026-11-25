"use client";

// Tab Daftar surat — rencana kontrol + SPRI per bulan (V-Claim GET /RencanaKontrol/ListRencanaKontrol
// /tglAwal/{a}/tglAkhir/{b}/filter/{f}); bila disaring per peserta: /ListRencanaKontrol/Bulan/{m}
// /Tahun/{y}/Nokartu/{k}/filter/{f} (+ status SEP kunjungan sudah/belum terbit). Dulu dua sub-tab
// "pilih bulan + ketik tahun + klik Cari" bertabel; kini periode digeser per bulan dan dimuat
// otomatis, dasar tanggal (rencana / terbit) bisa dipilih, saring jenis (jumlah per jenis) + teks,
// unduh CSV. Baris = jadwal (ubin tanggal), peserta, jenis, hitung mundur hari; klik → Sheet detail
// dengan aksi Ubah & Hapus. Mock hapus tidak mengubah data → baris ditandai "Dihapus" selama sesi.
// Status memuat diturunkan dari kunci data. Komponen shadcn: Card · Item · Badge · Button · Input ·
// Skeleton · Empty · Alert · Sheet · Dialog · DropdownMenu.

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BedDouble, CalendarDays, CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, ChevronsRight, Plus, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { unduhCsv } from "@/components/bpjs/shared/csv";
import { KepalaKartu, KerangkaDaftar, KosongData, PilihanUji, SaringKosong, TombolUnduh, useStatusAksi } from "@/components/bpjs/shared/daftarUi";
import { PesanGalat } from "@/components/bpjs/shared/formUi";
import { GALAT_KONEKSI, tidakDitemukan } from "@/components/bpjs/shared/galat";
import { PANJANG_KARTU, rapikanKartu, validasiKartu } from "@/components/bpjs/shared/kartu";
import { NAMA_BULAN, fmtTglPendek, geserPeriode, hariIniISO, labelPeriode, parseTgl, periodeIni, rentangPeriode, type Periode } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, GalatVClaim, KARTU, KolomSaring, PeriodeStepper, SegmenFilter } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import { listRKByKartu, listRKFiltered } from "@/lib/bpjs/vClaimRencanaKontrol";
import type { BPJSError, RKListFilterMode } from "@/lib/bpjs/bpjsShared";
import HapusSuratDialog, { type TargetHapus } from "./HapusSuratDialog";
import SuratSheet from "./SuratSheet";
import { JENIS_SURAT, PERIODE_UJI, jadwalSurat, jenisDariKode, type BarisSurat, type JenisSurat } from "./rencanaKontrolShared";

type Muatan = { ok: true; list: BarisSurat[] } | { ok: false; error: BPJSError };
type Hasil = Muatan & { kunci: string };
type SaringJenis = "semua" | JenisSurat;

const OPSI_DASAR = [
  { value: "2", label: "Tgl rencana" },
  { value: "1", label: "Tgl terbit" },
] as const satisfies readonly { value: RKListFilterMode; label: string }[];

async function muat(p: Periode, dasar: RKListFilterMode, kartu: string | null): Promise<Muatan> {
  const { mulai, akhir } = rentangPeriode(p);
  const res = kartu
    ? await listRKByKartu(String(p.bulan).padStart(2, "0"), String(p.tahun), kartu, dasar)
    : await listRKFiltered(mulai, akhir, dasar);
  if (!res.ok) return tidakDitemukan(res.error) ? { ok: true, list: [] } : { ok: false, error: res.error };
  const list: BarisSurat[] = [...(res.value.response ?? [])];
  list.sort((a, b) => a.tglRencanaKontrol.localeCompare(b.tglRencanaKontrol) || a.nama.localeCompare(b.nama, "id"));
  return { ok: true, list };
}

function cocok(b: BarisSurat, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return [b.nama, b.noKartu, b.noSuratKontrol, b.noSepAsalKontrol, b.namaPoliTujuan, b.namaDokter].some((v) => v.toLowerCase().includes(s));
}

function Baris({ b, index, hariIni, dihapus, onBuka }: { b: BarisSurat; index: number; hariIni: string; dihapus: boolean; onBuka: () => void }) {
  const jenis = jenisDariKode(b.jnsKontrol);
  const j = JENIS_SURAT[jenis];
  const jadwal = jadwalSurat(b.tglRencanaKontrol, hariIni);
  const tgl = parseTgl(b.tglRencanaKontrol);
  return (
    <motion.li initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: Math.min(index, 8) * 0.025 }}>
      <Item
        asChild
        size="sm"
        className={cn(
          "w-full flex-nowrap items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors sm:items-center",
          dihapus ? "bg-rose-50/60" : "hover:bg-slate-50",
        )}
      >
        <button type="button" onClick={onBuka} aria-haspopup="dialog">
          {/* Ubin tanggal dekoratif — tanggal lengkap dibacakan lewat teks jadwal. */}
          <span
            aria-hidden="true"
            className={cn(
              "flex w-11 shrink-0 flex-col items-center justify-center rounded-lg py-1.5",
              jenis === "spri" ? "bg-cyan-100/70 text-cyan-900" : "bg-sky-100/70 text-sky-900",
            )}
          >
            <span className="text-sm leading-none font-semibold tabular-nums">{tgl?.getDate() ?? "—"}</span>
            <span className="mt-0.5 text-[10px]">{tgl ? NAMA_BULAN[tgl.getMonth()].slice(0, 3) : ""}</span>
          </span>
          <ItemContent className="min-w-0 gap-0.5">
            <ItemTitle className="w-full min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs">
              <span className={cn("truncate font-semibold", dihapus && "line-through decoration-rose-400")}>{b.nama}</span>
              <BadgeNada tone={j.tone}>{j.label}</BadgeNada>
              {dihapus ? (
                <BadgeNada tone="rose">Dihapus</BadgeNada>
              ) : (
                <BadgeNada tone={jadwal.tone} titik>
                  {jadwal.label}
                </BadgeNada>
              )}
              {b.terbitSEP && (
                <BadgeNada tone={b.terbitSEP === "Sudah" ? "emerald" : "slate"}>{b.terbitSEP === "Sudah" ? "SEP terbit" : "Belum ada SEP"}</BadgeNada>
              )}
            </ItemTitle>
            <ItemDescription className="line-clamp-1 text-[11px] text-wrap tabular-nums">
              <span className="sr-only">Rencana {fmtTglPendek(b.tglRencanaKontrol)}. </span>
              {b.noSuratKontrol} · kartu {b.noKartu || "—"}
            </ItemDescription>
            <span className="block truncate text-[11px] text-muted-foreground">
              Poli <span className="font-medium text-foreground">{b.namaPoliTujuan}</span> · {b.namaDokter}
            </span>
          </ItemContent>
          <ChevronsRight className="mt-1 size-4 shrink-0 text-muted-foreground/60 sm:mt-0" aria-hidden="true" />
        </button>
      </Item>
    </motion.li>
  );
}

export default function DaftarSuratTab({
  versi,
  onBaru,
  onUbah,
}: {
  /** Naik setiap surat disimpan dari form → daftar dimuat ulang. */
  versi: number;
  onBaru: (jenis: JenisSurat) => void;
  onUbah: (b: BarisSurat) => void;
}) {
  const id = useId();
  const hariIni = hariIniISO();
  const judulSheetRef = useRef<HTMLHeadingElement>(null);
  const [periode, setPeriode] = useState<Periode>(periodeIni);
  const [dasar, setDasar] = useState<RKListFilterMode>("2");
  const [jenis, setJenis] = useState<SaringJenis>("semua");
  const [q, setQ] = useState("");
  const [kartu, setKartu] = useState<string | null>(null);
  const [kartuInput, setKartuInput] = useState("");
  const [galatKartu, setGalatKartu] = useState<string | null>(null);
  const [ulang, setUlang] = useState(0);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [buka, setBuka] = useState<BarisSurat | null>(null);
  const [hapus, setHapus] = useState<TargetHapus | null>(null);
  const [terhapus, setTerhapus] = useState<ReadonlySet<string>>(() => new Set());
  const aksi = useStatusAksi();
  const keForm = useRef(false);

  const kunci = `${periode.tahun}-${periode.bulan}|${dasar}|${kartu ?? ""}#${ulang}.${versi}`;
  const memuat = hasil?.kunci !== kunci;

  useEffect(() => {
    let batal = false;
    muat(periode, dasar, kartu)
      .then((m) => {
        if (!batal) setHasil({ ...m, kunci });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, ok: false, error: GALAT_KONEKSI });
      });
    return () => {
      batal = true;
    };
  }, [kunci, periode, dasar, kartu]);

  const list = hasil && hasil.ok && !memuat ? hasil.list : [];
  const nSpri = list.filter((b) => b.jnsKontrol === "1").length;
  const kata = q.trim();
  const tampil = list.filter((b) => (jenis === "semua" || jenisDariKode(b.jnsKontrol) === jenis) && cocok(b, kata));
  const hariIniN = list.filter((b) => b.tglRencanaKontrol === hariIni && !terhapus.has(b.noSuratKontrol)).length;

  function terapkanKartu(e: FormEvent) {
    e.preventDefault();
    const g = validasiKartu(kartuInput);
    setGalatKartu(g);
    if (g) {
      document.getElementById(`${id}-kartu`)?.focus();
      return;
    }
    setKartu(kartuInput);
  }

  function unduh() {
    unduhCsv(
      [
        ["No. surat", "Jenis", "Tgl rencana", "Tgl terbit", "No. kartu", "Nama", "Poli tujuan", "Dokter", "No. SEP asal", "Poli asal", "SEP kunjungan"],
        ...tampil.map((b) => [
          b.noSuratKontrol,
          JENIS_SURAT[jenisDariKode(b.jnsKontrol)].label,
          b.tglRencanaKontrol,
          b.tglTerbitKontrol,
          b.noKartu,
          b.nama,
          b.namaPoliTujuan,
          b.namaDokter,
          b.noSepAsalKontrol,
          b.namaPoliAsal,
          b.terbitSEP ?? "",
        ]),
      ],
      `rencana-kontrol-${periode.tahun}-${String(periode.bulan).padStart(2, "0")}${kartu ? `-${kartu}` : ""}.csv`,
    );
    aksi.umumkan(`CSV ${tampil.length} surat diunduh`);
  }

  return (
    <div className="p-4 sm:p-5">
      <Card className={KARTU}>
        <section aria-labelledby={`${id}-judul`} className="flex flex-col gap-3 py-4">
          <KepalaKartu judulId={`${id}-judul`} judul="Daftar surat" deskripsi="Rencana kontrol dan SPRI yang diterbitkan RS ini per bulan">
            <SegmenFilter label="Dasar tanggal" opsi={OPSI_DASAR} value={dasar} onChange={setDasar} />
            <PeriodeStepper periode={periode} onChange={setPeriode} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="xs" className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <Plus aria-hidden="true" />
                  Surat baru
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                data-accent="emerald"
                className="text-xs"
                onCloseAutoFocus={(e) => {
                  // Pindah ke tab form: fokus diatur tab tujuan, bukan kembali ke tombol ini.
                  if (keForm.current) {
                    e.preventDefault();
                    keForm.current = false;
                  }
                }}
              >
                <DropdownMenuItem
                  onSelect={() => {
                    keForm.current = true;
                    onBaru("kontrol");
                  }}
                  className="text-xs"
                >
                  <CalendarPlus aria-hidden="true" />
                  Rencana kontrol
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    keForm.current = true;
                    onBaru("spri");
                  }}
                  className="text-xs"
                >
                  <BedDouble aria-hidden="true" />
                  SPRI
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </KepalaKartu>

          {/* Saring per peserta (No. kartu) — memakai endpoint daftar per kartu (+ status SEP). */}
          <div className="flex flex-wrap items-start gap-2 px-4">
            {kartu ? (
              <div className="flex items-center gap-1 rounded-xl bg-emerald-50 py-1 pr-1 pl-2.5 text-xs text-emerald-900">
                <UserRound className="size-3.5" aria-hidden="true" />
                <span>
                  Peserta <span className="font-medium tabular-nums">{kartu}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Hapus saringan peserta"
                  onClick={() => {
                    setKartu(null);
                    setKartuInput("");
                    // Chip ini hilang → fokus ke kolom No. kartu yang menggantikannya.
                    requestAnimationFrame(() => document.getElementById(`${id}-kartu`)?.focus());
                  }}
                  className="hover:bg-emerald-100"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <form onSubmit={terapkanKartu} noValidate role="search" aria-label="Saring per peserta" className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <label htmlFor={`${id}-kartu`} className="sr-only">
                    No. kartu peserta
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id={`${id}-kartu`}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={PANJANG_KARTU}
                      value={kartuInput}
                      onChange={(e) => {
                        const v = rapikanKartu(e.target.value);
                        setKartuInput(v);
                        if (galatKartu && !validasiKartu(v)) setGalatKartu(null);
                      }}
                      placeholder="No. kartu peserta"
                      aria-invalid={Boolean(galatKartu)}
                      aria-describedby={galatKartu ? `${id}-kartu-err` : undefined}
                      className="h-8 w-48 rounded-lg border-0 bg-slate-100 pl-8 text-xs tabular-nums shadow-none placeholder:text-muted-foreground/70 focus-visible:bg-white focus-visible:ring-ring/40 aria-invalid:bg-rose-50 md:text-xs"
                    />
                  </div>
                  <Button type="submit" size="xs" variant="secondary">
                    Saring peserta
                  </Button>
                </div>
                {galatKartu && <PesanGalat id={`${id}-kartu-err`}>{galatKartu}</PesanGalat>}
              </form>
            )}
            {!memuat && list.length > 0 && hariIniN > 0 && (
              <BadgeNada tone="amber" titik className="mt-1.5 tabular-nums">
                {hariIniN} surat dijadwalkan hari ini
              </BadgeNada>
            )}
          </div>

          {!memuat && list.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4">
              <SegmenFilter
                label="Saring jenis surat"
                opsi={[
                  { value: "semua", label: "Semua", jumlah: list.length },
                  { value: "kontrol", label: "Rencana kontrol", jumlah: list.length - nSpri },
                  { value: "spri", label: "SPRI", jumlah: nSpri },
                ]}
                value={jenis}
                onChange={setJenis}
              />
              <KolomSaring id={`${id}-q`} value={q} onChange={setQ} label="Saring nama, kartu, nomor surat, SEP, poli, atau dokter" placeholder="Saring nama, kartu, nomor surat, poli, dokter" />
              <TombolUnduh onClick={unduh} jumlah={tampil.length} />
            </div>
          )}

          <div className="px-2">
            {memuat ? (
              <KerangkaDaftar baris={4} />
            ) : hasil && !hasil.ok ? (
              <div className="px-2">
                <GalatVClaim error={hasil.error} objek="Surat" onUlang={() => setUlang((n) => n + 1)} />
              </div>
            ) : list.length === 0 ? (
              <KosongData
                ikon={CalendarDays}
                judul="Belum ada surat"
                deskripsi={`Tidak ada rencana kontrol atau SPRI ${kartu ? `untuk kartu ${kartu} ` : ""}dengan ${dasar === "2" ? "tanggal rencana" : "tanggal terbit"} ${labelPeriode(periode)}`}
              >
                <Button variant="secondary" size="xs" onClick={() => setPeriode((p) => geserPeriode(p, -1))}>
                  <ChevronLeft aria-hidden="true" />
                  Lihat {labelPeriode(geserPeriode(periode, -1))}
                </Button>
                <PilihanUji>
                  <Button variant="ghost" size="xs" onClick={() => setPeriode({ ...PERIODE_UJI })} className="text-emerald-700">
                    {labelPeriode(PERIODE_UJI)}
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </PilihanUji>
              </KosongData>
            ) : tampil.length === 0 ? (
              <SaringKosong
                pesan={
                  kata ? (
                    <>
                      Tidak ada yang cocok dengan “<span className="text-foreground">{kata}</span>”
                    </>
                  ) : (
                    `Tidak ada ${jenis === "spri" ? "SPRI" : "rencana kontrol"} pada periode ini`
                  )
                }
                onReset={() => {
                  setQ("");
                  setJenis("semua");
                }}
              />
            ) : (
              <>
                <ul aria-label={`Surat ${labelPeriode(periode)}`} className="flex flex-col gap-0.5">
                  {tampil.map((b, i) => (
                    <Baris key={b.noSuratKontrol} b={b} index={i} hariIni={hariIni} dihapus={terhapus.has(b.noSuratKontrol)} onBuka={() => setBuka(b)} />
                  ))}
                </ul>
                {tampil.length < list.length && (
                  <p className="px-3 pt-2 text-[11px] text-muted-foreground tabular-nums">
                    Menampilkan {tampil.length} dari {list.length}
                  </p>
                )}
              </>
            )}
          </div>

          <p role="status" className="sr-only">
            {memuat ? "" : hasil && !hasil.ok ? "Daftar surat gagal dimuat" : `${list.length} surat pada ${labelPeriode(periode)}: ${list.length - nSpri} rencana kontrol, ${nSpri} SPRI`}
          </p>
          <p role="status" className="sr-only">
            {aksi.teks}
          </p>
        </section>
      </Card>

      <SuratSheet
        surat={buka}
        dihapus={buka ? terhapus.has(buka.noSuratKontrol) : false}
        onClose={() => setBuka(null)}
        onUbah={(b) => {
          setBuka(null);
          onUbah(b);
        }}
        onHapus={(b) =>
          setHapus({
            noSurat: b.noSuratKontrol,
            jenis: jenisDariKode(b.jnsKontrol),
            nama: b.nama,
            tgl: b.tglRencanaKontrol,
            poli: b.namaPoliTujuan,
          })
        }
        judulRef={judulSheetRef}
      />
      <HapusSuratDialog
        target={hapus}
        onClose={() => setHapus(null)}
        onDeleted={(no) => setTerhapus((s) => new Set(s).add(no))}
        fokusSesudah={() => judulSheetRef.current?.focus()}
      />
    </div>
  );
}
