// L16 Specimen Lab (S6b) — gerbang murni, tanpa I/O.
// Urutan wajib (koreksi domain user, contoh resmi RI `Specimen.request` → `ServiceRequest/{id}` yang sudah ada):
// ServiceRequest TERKIRIM dulu → Specimen → Observation (`specimen`) → DiagnosticReport (`specimen*`).
// Specimen baru ada setelah sampel sampai di Lab: order DITERIMA lewat aksi Terima (stamp `diterimaAt`) atau
// hasil sudah dientri (order RJ langsung "Diterima" saat order, tanpa aksi Terima).

import { spesimenCodingOf, type Coding } from "../conceptMap";
import type { Issue } from "./types";

export interface SpecimenOrder {
  deleted: boolean;
  status: string;
  diterimaAt: Date | null;
  adaHasil: boolean;
}

export type SpecimenRencana =
  | { kind: "tunggu" } //                         sampel belum sampai di Lab → belum dikirim, tanpa Issue
  | { kind: "kirim"; type: Coding; deleted: boolean }
  | { kind: "tahan"; issue: Issue };

export function specimenRencana(
  item: { id: string; namaTes: string },
  order: SpecimenOrder,
  spesimenSnomed: string | null | undefined,
): SpecimenRencana {
  const type = spesimenCodingOf(spesimenSnomed);
  // Order dihapus: tarik Specimen yang pernah terkirim (sink hanya meng-update bila sudah ada).
  if (order.deleted) return type ? { kind: "kirim", type, deleted: true } : { kind: "tunggu" };
  if (order.status === "Menunggu" || order.status === "Dibatalkan") return { kind: "tunggu" };
  if (!order.diterimaAt && !order.adaHasil) return { kind: "tunggu" };
  if (!type) {
    return {
      kind: "tahan",
      issue: {
        link: "L16", resourceType: "Specimen", localId: item.id, code: "kode-kosong",
        message: `Jenis spesimen tes "${item.namaTes}" belum dipetakan SNOMED (Katalog Lab) — Specimen & laporan hasil ditahan`,
      },
    };
  }
  return { kind: "kirim", type, deleted: false };
}

/** DiagnosticReport lab wajib `specimen` (playbook) — tanpa Specimen terkirim → ditahan. */
export function drLabTanpaSpecimen(item: { id: string; namaTes: string }): Issue {
  return {
    link: "L16", resourceType: "DiagnosticReport", localId: item.id, code: "kode-kosong",
    message: `Laporan hasil "${item.namaTes}" ditahan — Specimen belum terkirim (wajib di DiagnosticReport)`,
  };
}
