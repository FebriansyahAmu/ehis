// Helper Beranda BPJS: kesehatan sambungan per layanan (dinilai dari log panggilan, bukan uji
// koneksi terpisah), ringkasan tempat tidur yang dilaporkan ke Aplicares per kelas, daftar hal yang
// perlu ditindaklanjuti, dan menu modul. Semua turunan murni dari data — tanpa angka karangan.

import { Activity, DoorClosed, Send, Timer, WifiOff, XCircle, type LucideIcon } from "lucide-react";
import { bpjsNav, type NavItem } from "@/lib/navigation";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { BATAS_LAMBAT_MS, artiKode, fmtDurasi, hariLokal, layananDari, urlAudit, type Layanan } from "@/components/bpjs/audit/auditShared";
import { kelasBPJSLabel, urutKodeKelas } from "@/components/bpjs/aplicares/aplicaresShared";
import { BATAS_TERKINI_MENIT, kesegaran, waktuRelatif } from "@/components/bpjs/aplicares/ketersediaanShared";
import type { AplicaresKamarRecord, BPJSAuditEntry } from "@/lib/bpjs/bpjsShared";

export const HREF_KETERSEDIAAN = "/ehis-bpjs/aplicares/ketersediaan";

/** Izin baca (RBAC `bpjs.*`) yang menentukan bagian Beranda mana yang boleh tampil. */
export const IZIN_APLICARES = "bpjs.aplicares";
export const IZIN_AUDIT = "bpjs.audit";

// ── Sambungan per layanan ──────────────────────────────

export const LAYANAN: readonly { nama: Layanan; cakupan: string }[] = [
  { nama: "V-Claim", cakupan: "Kepesertaan, SEP, rujukan, monitoring, rencana kontrol" },
  { nama: "Aplicares", cakupan: "Referensi kelas dan ketersediaan tempat tidur" },
];

/**
 * Panggilan yang tidak sampai/tidak dijawab BPJS (putus, timeout, 5xx) — beda dengan respons
 * BPJS selain 200 (mis. 201 "data tidak ditemukan") yang berarti layanannya justru menjawab.
 */
export function takTersambung(e: BPJSAuditEntry): boolean {
  return e.responseCode === "ERR" || /^5\d\d$/.test(e.responseCode) || e.errorType === "NetworkError";
}

export type HasilPanggilan = "ok" | "gagal" | "putus";

export function hasilPanggilan(e: BPJSAuditEntry): HasilPanggilan {
  if (e.success) return "ok";
  return takTersambung(e) ? "putus" : "gagal";
}

export const LABEL_HASIL: Record<HasilPanggilan, string> = {
  ok: "Berhasil",
  gagal: "Dijawab gagal",
  putus: "Tak tersambung",
};

/** Banyak panggilan terakhir yang digambar sebagai jejak per layanan. */
export const JEJAK = 20;

export type StatusLayanan = "tersambung" | "tidak-stabil" | "putus" | "sepi";

/** Badge status (arti tetap): emerald = baik, amber = perlu perhatian, rose = tidak aktif. */
export const LABEL_STATUS_LAYANAN: Record<StatusLayanan, { label: string; tone: BadgeTone }> = {
  tersambung: { label: "Tersambung", tone: "emerald" },
  "tidak-stabil": { label: "Tidak stabil", tone: "amber" },
  putus: { label: "Tak tersambung", tone: "rose" },
  sepi: { label: "Belum ada panggilan", tone: "slate" },
};

export interface RingkasLayanan {
  layanan: Layanan;
  status: StatusLayanan;
  terakhir: BPJSAuditEntry | null;
  /** ≤ JEJAK panggilan terakhir, urut LAMA → BARU (kiri ke kanan). */
  jejak: BPJSAuditEntry[];
  /** Hitungan hasil di dalam jejak. */
  hitung: Record<HasilPanggilan, number>;
  /** Panggilan tak tersambung di antara 10 panggilan terakhir. */
  putus10: number;
  hariIni: number;
  gagalHariIni: number;
  /** Rata-rata durasi panggilan di dalam jejak. */
  rataMs: number | null;
}

/** `log` diurutkan terbaru dulu. */
export function ringkasLayanan(log: readonly BPJSAuditEntry[], layanan: Layanan, hariIni: string): RingkasLayanan {
  const milik = log.filter((e) => layananDari(e.endpoint) === layanan);
  const terbaru = milik.slice(0, JEJAK);
  const hitung: Record<HasilPanggilan, number> = { ok: 0, gagal: 0, putus: 0 };
  for (const e of terbaru) hitung[hasilPanggilan(e)] += 1;
  const putus10 = milik.slice(0, 10).filter(takTersambung).length;
  const terakhir = milik[0] ?? null;
  const status: StatusLayanan = !terakhir ? "sepi" : takTersambung(terakhir) ? "putus" : putus10 >= 2 ? "tidak-stabil" : "tersambung";
  const hari = milik.filter((e) => hariLokal(e.timestamp) === hariIni);
  return {
    layanan,
    status,
    terakhir,
    jejak: terbaru.toReversed(),
    hitung,
    putus10,
    hariIni: hari.length,
    gagalHariIni: hari.filter((e) => !e.success).length,
    rataMs: terbaru.length > 0 ? Math.round(terbaru.reduce((n, e) => n + e.durationMs, 0) / terbaru.length) : null,
  };
}

// ── Tempat tidur Aplicares ─────────────────────────────

export interface RingkasKelas {
  kode: string;
  label: string;
  ruang: number;
  kapasitas: number;
  terisi: number;
  tersedia: number;
}

export interface RingkasKamar {
  ruang: number;
  kapasitas: number;
  terisi: number;
  tersedia: number;
  /** Ruangan yang tidak ditutup sementara. */
  aktif: number;
  /** Ruangan aktif yang laporannya dikirim ≤ BATAS_TERKINI_MENIT lalu. */
  terkini: number;
  /** Ruangan aktif yang laporannya belum terkini, terlama dulu. */
  perluKirim: AplicaresKamarRecord[];
  tutup: AplicaresKamarRecord[];
  penuh: number;
  perKelas: RingkasKelas[];
}

export function ringkasKamar(list: readonly AplicaresKamarRecord[], sekarang: number): RingkasKamar {
  const jumlah = (rs: readonly AplicaresKamarRecord[], k: "kapasitas" | "terisi" | "tersedia") => rs.reduce((n, r) => n + r[k], 0);
  const tutup = list.filter((r) => r.flagMaintenance);
  const aktif = list.filter((r) => !r.flagMaintenance);
  const perluKirim = aktif
    .filter((r) => !kesegaran(r.lastSyncISO, sekarang).terkini)
    .toSorted((a, b) => (Date.parse(a.lastSyncISO) || 0) - (Date.parse(b.lastSyncISO) || 0));
  const perKelas = Object.entries(Object.groupBy(list, (r) => r.kdKelas))
    .map(([kode, rs = []]) => ({
      kode,
      label: kelasBPJSLabel(kode),
      ruang: rs.length,
      kapasitas: jumlah(rs, "kapasitas"),
      terisi: jumlah(rs, "terisi"),
      tersedia: jumlah(rs, "tersedia"),
    }))
    .toSorted((a, b) => urutKodeKelas(a.kode, b.kode));
  return {
    ruang: list.length,
    kapasitas: jumlah(list, "kapasitas"),
    terisi: jumlah(list, "terisi"),
    tersedia: jumlah(list, "tersedia"),
    aktif: aktif.length,
    terkini: aktif.length - perluKirim.length,
    perluKirim,
    tutup,
    penuh: aktif.filter((r) => r.tersedia === 0).length,
    perKelas,
  };
}

// ── Perlu ditindaklanjuti ──────────────────────────────

export type NadaTugas = "rose" | "amber" | "slate";

export interface Tugas {
  id: string;
  nada: NadaTugas;
  ikon: LucideIcon;
  judul: string;
  ket: string;
  aksi: {
    label: string;
    /** Teks tambahan khusus pembaca layar agar nama tautan/tombol tidak kembar. */
    konteks: string;
    /** Resource RBAC (read) yang dibutuhkan aksi — tanpa izin, tombol disembunyikan. */
    izin: string;
  } & ({ href: string } | { ulangKamar: true });
}

const URUTAN_NADA: Record<NadaTugas, number> = { rose: 0, amber: 1, slate: 2 };

export function daftarTugas({
  layanan,
  kamar,
  log,
  hariIni,
  sekarang,
}: {
  layanan: readonly RingkasLayanan[];
  /** null = data kamar belum/tidak termuat. */
  kamar: RingkasKamar | null;
  /** Diurutkan terbaru dulu. */
  log: readonly BPJSAuditEntry[];
  hariIni: string;
  sekarang: number;
}): Tugas[] {
  const tugas: Tugas[] = [];

  for (const r of layanan) {
    if (r.status === "putus" && r.terakhir) {
      tugas.push({
        id: `putus-${r.layanan}`,
        nada: "rose",
        ikon: WifiOff,
        judul: `Panggilan terakhir ke ${r.layanan} tidak tersambung`,
        ket: `${waktuRelatif(r.terakhir.timestamp, sekarang)} · ${r.terakhir.endpoint} · ${artiKode(r.terakhir.responseCode)}`,
        aksi:
          r.layanan === "Aplicares"
            ? { label: "Coba lagi", konteks: " memuat data Aplicares", izin: IZIN_APLICARES, ulangKamar: true }
            : { label: "Lihat log", konteks: " panggilan V-Claim yang gagal", izin: IZIN_AUDIT, href: urlAudit({ layanan: r.layanan, hasil: "gagal" }) },
      });
    } else if (r.status === "tidak-stabil") {
      tugas.push({
        id: `goyah-${r.layanan}`,
        nada: "amber",
        ikon: Activity,
        judul: `Sambungan ke ${r.layanan} tidak stabil`,
        ket: `${r.putus10} dari 10 panggilan terakhir tidak tersambung — periksa jaringan atau status layanan BPJS.`,
        aksi: { label: "Lihat log", konteks: ` panggilan ${r.layanan} yang gagal`, izin: IZIN_AUDIT, href: urlAudit({ layanan: r.layanan, hasil: "gagal" }) },
      });
    }
  }

  if (kamar && kamar.perluKirim.length > 0) {
    const terlama = kamar.perluKirim[0];
    tugas.push({
      id: "laporan-kamar",
      nada: "amber",
      ikon: Send,
      judul: `${kamar.perluKirim.length} ruangan belum dilaporkan dalam ${BATAS_TERKINI_MENIT} menit terakhir`,
      ket: `Terlama ${terlama.namaRuang} (${waktuRelatif(terlama.lastSyncISO, sekarang)}). Kirim ulang agar peserta melihat tempat tidur kosong yang benar.`,
      aksi: { label: "Kirim laporan", konteks: " ketersediaan kamar", izin: IZIN_APLICARES, href: HREF_KETERSEDIAAN },
    });
  }

  if (kamar && kamar.tutup.length > 0) {
    const nama = kamar.tutup.slice(0, 3).map((r) => r.namaRuang);
    const lebih = kamar.tutup.length - nama.length;
    tugas.push({
      id: "ruang-tutup",
      nada: "slate",
      ikon: DoorClosed,
      judul: `${kamar.tutup.length} ruangan ditutup sementara`,
      ket: `${nama.join(", ")}${lebih > 0 ? ` dan ${lebih} lainnya` : ""} — buka kembali bila sudah siap dipakai.`,
      aksi: { label: "Tinjau", konteks: " ruangan yang ditutup", izin: IZIN_APLICARES, href: HREF_KETERSEDIAAN },
    });
  }

  const hari = log.filter((e) => hariLokal(e.timestamp) === hariIni);
  const gagal = hari.filter((e) => !e.success);
  if (gagal.length > 0) {
    const per = Object.entries(Object.groupBy(gagal, (e) => e.endpoint))
      .map(([endpoint, list = []]) => ({ endpoint, n: list.length }))
      .toSorted((a, b) => b.n - a.n);
    const teratas = per[0];
    tugas.push({
      id: "gagal-hari-ini",
      nada: "amber",
      ikon: XCircle,
      judul: `${gagal.length} panggilan gagal hari ini`,
      ket:
        teratas && teratas.n >= 2
          ? `Paling sering ke ${teratas.endpoint} (${teratas.n}×).`
          : "Termasuk respons BPJS selain kode 200, mis. data tidak ditemukan.",
      aksi: { label: "Lihat", konteks: " panggilan gagal hari ini", izin: IZIN_AUDIT, href: urlAudit({ periode: "hari", hasil: "gagal" }) },
    });
  }

  const lambat = hari.filter((e) => e.durationMs >= BATAS_LAMBAT_MS).toSorted((a, b) => b.durationMs - a.durationMs);
  if (lambat.length > 0) {
    tugas.push({
      id: "lambat-hari-ini",
      nada: "amber",
      ikon: Timer,
      judul: `${lambat.length} panggilan lambat hari ini`,
      ket: `Lebih dari ${BATAS_LAMBAT_MS / 1000} detik — terlama ${fmtDurasi(lambat[0].durationMs)} ke ${lambat[0].endpoint}.`,
      aksi: { label: "Lihat", konteks: " semua panggilan hari ini", izin: IZIN_AUDIT, href: urlAudit({ periode: "hari" }) },
    });
  }

  return tugas.toSorted((a, b) => URUTAN_NADA[a.nada] - URUTAN_NADA[b.nada]);
}

// ── Menu modul ─────────────────────────────────────────

/** Item menu Beranda = item `bpjsNav` (href, ikon, izin — satu sumber dengan Sidebar) + keterangan. */
export type ItemMenu = NavItem & { ket: string };

const KET_MENU: Record<string, string> = {
  "/ehis-bpjs/vclaim/kepesertaan": "Cek status peserta lewat nomor kartu atau NIK",
  "/ehis-bpjs/vclaim/sep": "Cari, perbarui, suplesi, SEP internal, sidik jari",
  "/ehis-bpjs/vclaim/rujukan": "Rujukan masuk, keluar, khusus, dan referensi faskes",
  "/ehis-bpjs/vclaim/monitoring": "Kunjungan, klaim, histori pelayanan, Jasa Raharja",
  "/ehis-bpjs/vclaim/rencana-kontrol": "Surat kontrol dan SPRI",
  "/ehis-bpjs/aplicares/referensi-kamar": "Kode kelas kamar dan pemakaiannya di RS",
  "/ehis-bpjs/aplicares/map-kelas": "Pemetaan kelas RS ke kelas BPJS",
  [HREF_KETERSEDIAAN]: "Laporkan tempat tidur kosong per ruangan",
  "/ehis-bpjs/audit": "Jejak setiap panggilan ke web service BPJS",
};

/** Grup menu tanpa "Utama" (Beranda itu sendiri). Saring izin di komponen (`navItemVisible`). */
export const MENU: readonly { grup: string; item: readonly ItemMenu[] }[] = bpjsNav
  .filter((g) => g.label !== "Utama")
  .map((g) => ({ grup: g.label, item: g.items.map((it) => ({ ...it, ket: KET_MENU[it.href] ?? "" })) }));
