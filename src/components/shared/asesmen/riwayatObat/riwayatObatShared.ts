// Riwayat Obat (Asesmen › Riwayat Medis › Pemberian Obat) — state, konversi DTO, dan rekomendasi obat formularium.
// Dipakai IGD (AsesmenMedisTab) + RI/RJ (shared RiwayatPane) lewat RiwayatObatEditor → satu sumber perilaku.
// FHIR L07: obat yang DIPILIH dari rekomendasi tertaut `obatId` → server menurunkan kode KFA dari master (anti-spoof);
// ketik bebas tetap tersimpan, tetapi ditahan dari SatuSehat sampai dipilih dari rekomendasi.

import { useEffect, useState } from "react";
import { listObatTersedia, type ObatTersediaDTO } from "@/lib/api/master/obatTersedia";
import type { AsesmenObatDTO, AsesmenObatInput } from "@/lib/api/asesmenMedis/asesmenObat";
import { kfaRiwayatOf, type KfaRiwayat, type StatusRiwayatObat } from "@/lib/fhir/links/riwayatObat";

export interface RiwayatObatEntry {
  /** Kunci baris lokal (React key) — bukan id DB. */
  key: string;
  nama: string;
  /** Tautan katalog master.Obat — null = ketik bebas. */
  obatId: string | null;
  /** Kode KFA yang akan dikirim (tampilan saja; server menurunkannya ulang dari master). */
  kfa: KfaRiwayat | null;
  status: StatusRiwayatObat | null;
  dosis: string;
  frekuensi: string;
  rute: string;
  sejak: string;
  indikasi: string;
}

const newKey = () => `ob-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function emptyRiwayatObat(): RiwayatObatEntry {
  return {
    key: newKey(), nama: "", obatId: null, kfa: null, status: "aktif",
    dosis: "", frekuensi: "", rute: "Oral", sejak: "", indikasi: "",
  };
}

/** DTO terbaru → baris form (minimal 1 baris kosong). */
export function dtoToRiwayatObat(dto: AsesmenObatDTO | null): RiwayatObatEntry[] {
  if (!dto || dto.items.length === 0) return [emptyRiwayatObat()];
  return dto.items.map((it) => ({
    key: it.id,
    nama: it.nama,
    obatId: it.obatId,
    kfa: it.kfa,
    status: it.status,
    dosis: it.dosis ?? "",
    frekuensi: it.frekuensi ?? "",
    rute: it.rute ?? "Oral",
    sejak: it.sejak ?? "",
    indikasi: it.indikasi ?? "",
  }));
}

const opt = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);

/** Baris form → payload POST (baris tanpa nama dibuang). Kode KFA sengaja TIDAK dikirim. */
export function riwayatObatToInput(rows: RiwayatObatEntry[]): AsesmenObatInput {
  return {
    items: rows
      .filter((r) => r.nama.trim())
      .map((r) => ({
        nama: r.nama.trim(),
        obatId: r.obatId ?? undefined,
        status: r.status ?? undefined,
        dosis: opt(r.dosis),
        frekuensi: opt(r.frekuensi),
        rute: opt(r.rute),
        sejak: opt(r.sejak),
        indikasi: opt(r.indikasi),
      })),
  };
}

// ── Rekomendasi obat (formularium = hasil mapping obat ⇄ ruangan) ─────────────────

/** Label nama obat saat dipilih: generik + kekuatan (mis. "Amlodipine 5 mg"). */
export const labelObat = (o: Pick<ObatTersediaDTO, "namaGenerik" | "kekuatan">) =>
  [o.namaGenerik, o.kekuatan].map((s) => s?.trim()).filter(Boolean).join(" ");

export const kfaObat = (o: ObatTersediaDTO): KfaRiwayat | null => kfaRiwayatOf(o.kfaProduk);

// Formularium dibaca sekali per muat halaman, dipakai semua baris & ketiga unit; gagal → boleh coba lagi.
let cache: Promise<ObatTersediaDTO[]> | null = null;
function loadRekomendasi(): Promise<ObatTersediaDTO[]> {
  cache ??= listObatTersedia().catch((e: unknown) => {
    cache = null;
    throw e;
  });
  return cache;
}

export type RekomendasiState = "loading" | "done" | "error";

export function useObatRekomendasi(): { items: ObatTersediaDTO[]; state: RekomendasiState } {
  const [items, setItems] = useState<ObatTersediaDTO[]>([]);
  const [state, setState] = useState<RekomendasiState>("loading");
  useEffect(() => {
    let alive = true;
    loadRekomendasi()
      .then((rows) => { if (alive) { setItems(rows); setState("done"); } })
      .catch(() => { if (alive) setState("error"); });
    return () => { alive = false; };
  }, []);
  return { items, state };
}

const norm = (s: string | null | undefined) => (s ?? "").toLocaleLowerCase("id");

/**
 * Cari & urutkan rekomendasi: awalan nama (generik/dagang) → awalan kata → mengandung → kode; dalam peringkat yang
 * sama obat ber-KFA didahulukan (hanya itu yang bisa terkirim ke SatuSehat), lalu alfabetis.
 */
export function cariObat(list: ObatTersediaDTO[], q: string, limit = 8): ObatTersediaDTO[] {
  const s = norm(q.trim());
  if (!s) return [];
  const peringkat = (o: ObatTersediaDTO): number => {
    const nama = [norm(o.namaGenerik), norm(o.namaDagang)];
    if (nama.some((n) => n.startsWith(s))) return 0;
    if (nama.some((n) => n.split(/[\s/(),-]+/).some((w) => w.startsWith(s)))) return 1;
    if (nama.some((n) => n.includes(s)) || norm(o.kekuatan).includes(s)) return 2;
    if (norm(o.kode).includes(s)) return 3;
    return -1;
  };
  return list
    .map((o) => ({ o, r: peringkat(o), kfa: kfaObat(o) ? 0 : 1 }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.kfa - b.kfa || a.o.namaGenerik.localeCompare(b.o.namaGenerik, "id"))
    .slice(0, limit)
    .map((x) => x.o);
}
