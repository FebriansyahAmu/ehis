/**
 * Record Bus — sinkronisasi rekam medis lintas-komponen di SATU klien (header ↔ tab),
 * TANPA refresh halaman.
 *
 * Komponen yang MEMUTASI data (mis. TTVTab simpan observasi) memanggil `emitRecordChange`;
 * komponen yang MENAMPILKAN turunannya (mis. PatientHeader vitals bar) men-subscribe lewat
 * `useRecordVersion` → re-fetch saat versi naik. Keyed per **kunjungan + domain** agar pasien
 * lain / domain lain tak ikut re-render.
 *
 * Skala: in-process, satu tab browser — cukup untuk "lihat hasil aksiku sendiri tercermin di
 * header tanpa reload". Realtime LINTAS-USER/lintas-tab (SSE + Redis) DITUNDA (FLOWS §10);
 * saat ada, event SSE cukup di-pipe ke `emitRecordChange` → header & tab ikut reaktif lewat
 * jalur yang SAMA, tanpa ubah konsumen.
 *
 * Pattern: `useSyncExternalStore` (selaras store lain di src/lib/**Store.ts).
 */

import { useSyncExternalStore } from "react";

/** Domain rekam medis yang pembaruannya bisa memicu refresh turunan di header/tab lain. */
export type RecordDomain =
  | "observation" // TTV → vitals bar header
  | "triase" // triase → panel level + status header
  | "cppt"
  | "diagnosa"
  | "asesmen"
  | "order"; // order klinis (Tindakan/Resep/Lab/Rad/BMHP) → widget Total Tagihan header

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
const versions = new Map<string, number>();

const keyOf = (kunjunganId: string, domain: RecordDomain): string => `${kunjunganId}:${domain}`;

/** Tandai data `domain` berubah untuk kunjungan tsb → semua subscriber-nya re-render/re-fetch. */
export function emitRecordChange(kunjunganId: string, domain: RecordDomain): void {
  const key = keyOf(kunjunganId, domain);
  versions.set(key, (versions.get(key) ?? 0) + 1);
  listeners.get(key)?.forEach((l) => l());
}

function subscribe(kunjunganId: string, domain: RecordDomain, listener: Listener): () => void {
  const key = keyOf(kunjunganId, domain);
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(key);
  };
}

function getVersion(kunjunganId: string, domain: RecordDomain): number {
  return versions.get(keyOf(kunjunganId, domain)) ?? 0;
}

/**
 * Versi reaktif domain rekam medis untuk satu kunjungan. Naik tiap `emitRecordChange` →
 * pakai sebagai dependency `useEffect` (re-fetch) atau pemicu re-render langsung.
 * `enabled=false` (mis. pasien demo non-UUID, tak tersimpan DB) → selalu 0, tak subscribe.
 */
export function useRecordVersion(
  kunjunganId: string | undefined,
  domain: RecordDomain,
  enabled = true,
): number {
  const active = enabled && !!kunjunganId;
  return useSyncExternalStore(
    (cb) => (active ? subscribe(kunjunganId!, domain, cb) : () => {}),
    () => (active ? getVersion(kunjunganId!, domain) : 0),
    () => 0, // SSR snapshot (server tak punya state bus)
  );
}
