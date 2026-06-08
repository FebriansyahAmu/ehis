// Resolusi nama pencatat dari actor (user login terverifikasi) — dipakai domain klinis
// yang menyimpan nama denormalisasi (Observation/Anamnesis/Asesmen·*). Integritas
// medico-legal: nama = penulis terotentikasi, BUKAN free-text. Dipisah agar tak duplikat
// per-service (debt sebelumnya: salinan di observation/anamnesis service).

import * as pegawaiDal from "@/lib/dal/pegawaiDal";
import type { Actor } from "@/lib/auth/actor";

/** Nama tampil pegawai (gelar depan + nama + gelar belakang) — selaras authService. */
export function namaTampilPegawai(p: {
  gelarDepan: string | null;
  namaLengkap: string;
  gelarBelakang: string | null;
}): string {
  const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
  const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
  return `${depan}${p.namaLengkap}${belakang}`;
}

/** Pencatat = pegawai dari actor. Fallback "—" bila tak ditemukan (mis. dev actor). */
export async function resolveActorNama(actor: Actor): Promise<string> {
  const p = actor.pegawaiId ? await pegawaiDal.findById(actor.pegawaiId) : null;
  return p ? namaTampilPegawai(p) : "—";
}
