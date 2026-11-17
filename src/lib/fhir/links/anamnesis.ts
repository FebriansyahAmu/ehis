/**
 * S4d — link anamnesis & fisik (fungsi murni, docs/fhir-mapping L04 · L05 · L10):
 *   L04 riwayat penyakit pribadi → Condition `previous-condition` (SNOMED "History of …" dari katalog asesmen)
 *   L05 riwayat penyakit keluarga → FamilyMemberHistory per anggota (SNOMED "Family history …" dari katalog)
 *   L10 pemeriksaan fisik head-to-toe → Observation `exam` per sistem yang padan (D12: 5 sistem dulu)
 *
 * Ketiga sumber append-only "latest wins" (baris baru per simpan) → localId tingkat KUNJUNGAN (bukan id baris),
 * agar simpan ulang memperbarui resource yang sama. Item yang ada di baris lama tapi hilang dari baris terbaru
 * = dihapus → `tarik` (entered-in-error; sink hanya meng-update bila pernah terkirim).
 * Kode dari katalog DIBACA SAAT KIRIM (D7: record menyimpan kode item, SNOMED milik katalog).
 */

import { PEMERIKSAAN_FISIK, type Coding, type SistemFisikLokal } from "../conceptMap";
import type { Issue } from "./types";

const SCT = "http://snomed.info/sct";

export const anamnesisLocalId = {
  riwayatPenyakit: (kunjunganId: string, kode: string) => `${kunjunganId}:riwayat-penyakit:${kode}`,
  riwayatKeluarga: (kunjunganId: string, anggotaKey: string) => `${kunjunganId}:riwayat-keluarga:${anggotaKey}`,
  pemeriksaanFisik: (kunjunganId: string, sistem: SistemFisikLokal) => `${kunjunganId}:pemeriksaan-fisik:${sistem}`,
};

/** Item katalog asesmen (master.AsesmenItem) yang relevan untuk kirim. */
export interface KatalogSnomed {
  kode: string;
  snomedCode: string | null;
  snomedDisplay: string | null;
}

export type IndeksKatalog = Map<string, KatalogSnomed>;

export const indeksKatalog = (items: KatalogSnomed[]): IndeksKatalog => new Map(items.map((i) => [i.kode, i]));

/** Siap kirim hanya bila kode DAN display SNOMED terisi di katalog (display tidak dikarang dari label lokal). */
const snomedOf = (k: KatalogSnomed | undefined): Coding | null =>
  k?.snomedCode?.trim() && k.snomedDisplay?.trim()
    ? { system: SCT, code: k.snomedCode.trim(), display: k.snomedDisplay.trim() }
    : null;

export interface Rencana<T> {
  kirim: T[];
  /** Hilang dari baris terbaru → kirim ulang sebagai entered-in-error (hanya bila pernah terkirim). */
  tarik: T[];
  issues: Issue[];
}

// ── L04 riwayat penyakit pribadi ───────────────────────────────────────────────

export interface RiwayatPenyakitRow {
  penyakit: string[];
  penyakitKode: string[];
  catatan: string | null;
  authorPegawaiId: string | null;
  createdAt: Date;
}

export interface RiwayatPenyakitItem {
  localId: string;
  nama: string;
  coding: Coding;
  catatan: string | null;
  recordedAt: Date;
  authorPegawaiId: string | null;
}

/** Pasangan (nama, kode) sebuah baris; kode "" = tak ada di katalog. Duplikat kode dibuang. */
function pasangan(nama: string[], kode: string[]): { nama: string; kode: string }[] {
  const seen = new Set<string>();
  const out: { nama: string; kode: string }[] = [];
  nama.forEach((n, i) => {
    const k = (kode[i] ?? "").trim();
    const key = k || `nama:${n.trim().toLowerCase()}`;
    if (!n.trim() || seen.has(key)) return;
    seen.add(key);
    out.push({ nama: n.trim(), kode: k });
  });
  return out;
}

/** `rows` urut createdAt naik; baris terakhir = yang berlaku. */
export function riwayatPenyakitRencana(
  kunjunganId: string,
  rows: RiwayatPenyakitRow[],
  katalog: IndeksKatalog,
): Rencana<RiwayatPenyakitItem> {
  const out: Rencana<RiwayatPenyakitItem> = { kirim: [], tarik: [], issues: [] };
  const latest = rows.at(-1);
  if (!latest) return out;
  const item = (row: RiwayatPenyakitRow, p: { nama: string; kode: string }, coding: Coding): RiwayatPenyakitItem => ({
    localId: anamnesisLocalId.riwayatPenyakit(kunjunganId, p.kode),
    nama: p.nama,
    coding,
    catatan: row.catatan?.trim() || null,
    recordedAt: row.createdAt,
    authorPegawaiId: row.authorPegawaiId,
  });

  const aktif = new Set<string>();
  for (const p of pasangan(latest.penyakit, latest.penyakitKode)) {
    if (!p.kode) {
      out.issues.push({
        link: "L04", resourceType: "Condition", localId: anamnesisLocalId.riwayatPenyakit(kunjunganId, `nama:${p.nama}`),
        code: "kode-kosong", message: `Riwayat penyakit "${p.nama}" tidak ada di Master Asesmen Katalog — tidak terkodekan, ditahan`,
      });
      continue;
    }
    aktif.add(p.kode);
    const coding = snomedOf(katalog.get(p.kode));
    if (!coding) {
      out.issues.push({
        link: "L04", resourceType: "Condition", localId: anamnesisLocalId.riwayatPenyakit(kunjunganId, p.kode),
        code: "kode-kosong", message: `Riwayat penyakit "${p.nama}" (${p.kode}) belum punya kode + display SNOMED "History of …" di Master Asesmen Katalog — ditahan`,
      });
      continue;
    }
    out.kirim.push(item(latest, p, coding));
  }

  // Tarik: kode di baris lama yang tidak ada lagi di baris terbaru (pakai data baris lama terakhir yang memuatnya).
  const sudah = new Set(aktif);
  for (const row of rows.slice(0, -1).reverse()) {
    for (const p of pasangan(row.penyakit, row.penyakitKode)) {
      if (!p.kode || sudah.has(p.kode)) continue;
      sudah.add(p.kode);
      const coding = snomedOf(katalog.get(p.kode));
      if (coding) out.tarik.push(item(row, p, coding));
    }
  }
  return out;
}

// ── L05 riwayat penyakit keluarga ──────────────────────────────────────────────

export interface RiwayatKeluargaRow {
  createdAt: Date;
  items: {
    anggota: string;
    anggotaKode: string | null;
    penyakit: string[];
    penyakitKode: string[];
    keterangan: string | null;
  }[];
}

export interface RiwayatKeluargaItem {
  localId: string;
  anggota: string;
  kondisi: Coding[];
  keterangan: string | null;
  date: Date;
}

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** Kunci anggota: kode katalog (AK-NNN) bila ada, selain itu nama ter-normalisasi. */
const anggotaKey = (i: { anggota: string; anggotaKode: string | null }) => i.anggotaKode?.trim() || `nama-${slug(i.anggota)}`;

interface AnggotaGabung {
  anggota: string;
  pasangan: { nama: string; kode: string }[];
  keterangan: string[];
}

/** Gabung item anggota yang sama dalam satu baris (kondisi tanpa duplikat, keterangan digabung). */
function perAnggota(row: RiwayatKeluargaRow): Map<string, AnggotaGabung> {
  const m = new Map<string, AnggotaGabung>();
  for (const it of row.items) {
    if (!it.anggota.trim()) continue;
    const key = anggotaKey(it);
    const cur = m.get(key) ?? { anggota: it.anggota.trim(), pasangan: [], keterangan: [] };
    cur.pasangan = pasangan([...cur.pasangan.map((p) => p.nama), ...it.penyakit], [...cur.pasangan.map((p) => p.kode), ...it.penyakitKode]);
    if (it.keterangan?.trim()) cur.keterangan.push(it.keterangan.trim());
    m.set(key, cur);
  }
  return m;
}

export function riwayatKeluargaRencana(
  kunjunganId: string,
  rows: RiwayatKeluargaRow[],
  katalog: IndeksKatalog,
): Rencana<RiwayatKeluargaItem> {
  const out: Rencana<RiwayatKeluargaItem> = { kirim: [], tarik: [], issues: [] };
  const latest = rows.at(-1);
  if (!latest) return out;

  /** Kondisi berkode SNOMED; `catatIssue` = hanya untuk baris berlaku (baris lama tak perlu dilaporkan). */
  const kondisiOf = (key: string, a: AnggotaGabung, catatIssue: boolean) => {
    const kondisi: Coding[] = [];
    for (const p of a.pasangan) {
      const coding = p.kode ? snomedOf(katalog.get(p.kode)) : null;
      if (coding) { kondisi.push(coding); continue; }
      if (catatIssue) out.issues.push({
        link: "L05", resourceType: "FamilyMemberHistory",
        localId: `${anamnesisLocalId.riwayatKeluarga(kunjunganId, key)}:${p.kode || `nama:${p.nama}`}`,
        code: "kode-kosong",
        message: p.kode
          ? `Riwayat keluarga (${a.anggota}) "${p.nama}" (${p.kode}) belum punya kode + display SNOMED "Family history …" di Master Asesmen Katalog — ditahan`
          : `Riwayat keluarga (${a.anggota}) "${p.nama}" tidak ada di Master Asesmen Katalog — tidak terkodekan, ditahan`,
      });
    }
    return kondisi;
  };
  const item = (row: RiwayatKeluargaRow, key: string, a: AnggotaGabung, kondisi: Coding[]): RiwayatKeluargaItem => ({
    localId: anamnesisLocalId.riwayatKeluarga(kunjunganId, key),
    anggota: a.anggota,
    kondisi,
    keterangan: a.keterangan.join("; ") || null,
    date: row.createdAt,
  });

  const aktif = new Set<string>();
  for (const [key, a] of perAnggota(latest)) {
    const kondisi = kondisiOf(key, a, true);
    if (kondisi.length === 0) continue; // tanpa kondisi berkode, FMH tak bermakna (condition.code wajib)
    aktif.add(key);
    out.kirim.push(item(latest, key, a, kondisi));
  }
  const sudah = new Set(aktif);
  for (const row of rows.slice(0, -1).reverse()) {
    for (const [key, a] of perAnggota(row)) {
      if (sudah.has(key)) continue;
      sudah.add(key);
      const kondisi = kondisiOf(key, a, false);
      if (kondisi.length) out.tarik.push(item(row, key, a, kondisi));
    }
  }
  return out;
}

// ── L10 pemeriksaan fisik head-to-toe ──────────────────────────────────────────

export interface PemeriksaanFisikRow {
  sistem: unknown; // JSONB Record<SistemFisikKey, string>
  waktuPemeriksaan: Date;
  authorPegawaiId: string | null;
}

export interface PemeriksaanFisikItem {
  localId: string;
  sistem: SistemFisikLokal;
  coding: Coding;
  teks: string;
  waktu: Date;
  authorPegawaiId: string | null;
}

export const SISTEM_FISIK = Object.keys(PEMERIKSAAN_FISIK) as SistemFisikLokal[];

const LABEL_SISTEM: Record<SistemFisikLokal, string> = {
  kepala: "Kepala", mata: "Mata", tht: "THT", leher: "Leher", toraks_paru: "Toraks/Paru", jantung: "Jantung",
  abdomen: "Abdomen", urogenital: "Urogenital", ekstremitas: "Ekstremitas", neurologi: "Neurologi", kulit: "Kulit",
};

/** Alasan sistem ditahan (D12) — tiga dipecah bertahap, tiga tidak punya bagian di playbook head-to-toe. */
const ALASAN_TAHAN: Partial<Record<SistemFisikLokal, { code: Issue["code"]; alasan: string }>> = {
  tht: { code: "menunggu-keputusan", alasan: "1 teks EHIS untuk 3 bagian playbook (Telinga 10195-6 · Hidung 10203-8 · Tenggorokan 56867-5) — pecah field (D12)" },
  urogenital: { code: "menunggu-keputusan", alasan: "playbook hanya punya Genital 11400-9; temuan CVA/kandung kemih bukan genital — pecah field (D12)" },
  ekstremitas: { code: "menunggu-keputusan", alasan: "1 teks EHIS untuk banyak bagian playbook (lengan, tangan, tungkai, kaki, persendian) — pecah field (D12)" },
  jantung: { code: "di-luar-playbook", alasan: "tidak ada bagian jantung di daftar head-to-toe playbook" },
  neurologi: { code: "di-luar-playbook", alasan: "tidak ada bagian neurologi di daftar head-to-toe playbook" },
  kulit: { code: "di-luar-playbook", alasan: "tidak ada bagian kulit di daftar head-to-toe playbook" },
};

/** Teks per sistem dari JSONB (abaikan nilai non-string/kosong). */
export function teksSistem(sistem: unknown): Partial<Record<SistemFisikLokal, string>> {
  const out: Partial<Record<SistemFisikLokal, string>> = {};
  if (!sistem || typeof sistem !== "object") return out;
  for (const s of SISTEM_FISIK) {
    const v = (sistem as Record<string, unknown>)[s];
    if (typeof v === "string" && v.trim()) out[s] = v.trim();
  }
  return out;
}

export function pemeriksaanFisikRencana(kunjunganId: string, rows: PemeriksaanFisikRow[]): Rencana<PemeriksaanFisikItem> {
  const out: Rencana<PemeriksaanFisikItem> = { kirim: [], tarik: [], issues: [] };
  const latest = rows.at(-1);
  if (!latest) return out;
  const item = (row: PemeriksaanFisikRow, s: SistemFisikLokal, coding: Coding, teks: string): PemeriksaanFisikItem => ({
    localId: anamnesisLocalId.pemeriksaanFisik(kunjunganId, s), sistem: s, coding, teks, waktu: row.waktuPemeriksaan,
    authorPegawaiId: row.authorPegawaiId,
  });

  const kini = teksSistem(latest.sistem);
  for (const s of SISTEM_FISIK) {
    const teks = kini[s];
    if (!teks) continue;
    const coding = PEMERIKSAAN_FISIK[s];
    if (coding) { out.kirim.push(item(latest, s, coding, teks)); continue; }
    const t = ALASAN_TAHAN[s]!;
    out.issues.push({
      link: "L10", resourceType: "Observation", localId: anamnesisLocalId.pemeriksaanFisik(kunjunganId, s),
      code: t.code, message: `Pemeriksaan fisik ${LABEL_SISTEM[s]} ditahan — ${t.alasan}`,
    });
  }
  // Tarik: sistem padan yang pernah berisi teks tetapi dikosongkan di pemeriksaan terbaru.
  for (const s of SISTEM_FISIK) {
    const coding = PEMERIKSAAN_FISIK[s];
    if (!coding || kini[s]) continue;
    const lama = rows.slice(0, -1).reverse().find((r) => teksSistem(r.sistem)[s]);
    if (lama) out.tarik.push(item(lama, s, coding, teksSistem(lama.sistem)[s]!));
  }
  return out;
}
