/**
 * L19 — Telaah resep (`ResepTelaah.answers`, PMK 72/2016) → QuestionnaireResponse Q0007 (Pengkajian Resep).
 * docs/fhir-mapping/L19-telaah-to-questionnaireresponse.md. Teks item verbatim dari contoh Bundle resmi RI.
 *
 * ⚠️ Makna terbalik: jawaban lokal = "lulus" (true = memenuhi syarat, mis. "Tidak ada duplikasi").
 *   1.x · 2.x · 3.1 bertanya "sudah sesuai?" → lulus = OV000052 Sesuai · tidak = OV000053 Tidak Sesuai.
 *   3.2–3.5 bertanya "apakah TERDAPAT masalah?" → valueBoolean = KEBALIKAN lulus.
 * `farm-kompatibilitas` lokal tidak punya item Q0007 → tidak dikirim (tetap di rekam lokal).
 *
 * Murni (tanpa I/O) — aman diimpor client maupun server.
 */

import type { Issue } from "./types";

export const Q0007 = "https://fhir.kemkes.go.id/Questionnaire/Q0007";

const CLINICAL_TERM = "http://terminology.kemkes.go.id/CodeSystem/clinical-term";
const SESUAI = { system: CLINICAL_TERM, code: "OV000052", display: "Sesuai" };
const TIDAK_SESUAI = { system: CLINICAL_TERM, code: "OV000053", display: "Tidak Sesuai" };

type Grup = "administrasi" | "farmasetik" | "klinis";
type Jenis = "sesuai" | "adaMasalah";

interface ItemDef {
  linkId: string;
  text: string;
  jenis: Jenis;
  /** Kunci lokal `<grup>.<linkId lokal>`; semuanya harus lulus agar "Sesuai" (atau agar "tidak ada masalah"). */
  sumber: `${Grup}.${string}`[];
}

interface GrupDef {
  linkId: string;
  text: string;
  items: ItemDef[];
}

/** ConceptMap linkId lokal ↔ linkId Q0007 — eksplisit & diuji (L19 "cek wajib"). */
export const Q0007_STRUKTUR: GrupDef[] = [
  {
    linkId: "1", text: "Persyaratan Administrasi",
    items: [
      // Lokal tidak menilai berat/tinggi badan (FG-113) — identitas + umur/jenis kelamin.
      { linkId: "1.1", text: "Apakah nama, umur, jenis kelamin, berat badan dan tinggi badan pasien sudah sesuai?", jenis: "sesuai", sumber: ["administrasi.adm-identitas", "administrasi.adm-umur-jk"] },
      { linkId: "1.2", text: "Apakah nama, nomor ijin, alamat dan paraf dokter sudah sesuai?", jenis: "sesuai", sumber: ["administrasi.adm-dokter"] },
      { linkId: "1.3", text: "Apakah tanggal resep sudah sesuai?", jenis: "sesuai", sumber: ["administrasi.adm-tanggal"] },
      { linkId: "1.4", text: "Apakah ruangan/unit asal resep sudah sesuai?", jenis: "sesuai", sumber: ["administrasi.adm-unit"] },
    ],
  },
  {
    linkId: "2", text: "Persyaratan Farmasetik",
    items: [
      { linkId: "2.1", text: "Apakah nama obat, bentuk dan kekuatan sediaan sudah sesuai?", jenis: "sesuai", sumber: ["farmasetik.farm-nama-kekuatan"] },
      { linkId: "2.2", text: "Apakah dosis dan jumlah obat sudah sesuai?", jenis: "sesuai", sumber: ["farmasetik.farm-dosis-jumlah"] },
      { linkId: "2.3", text: "Apakah stabilitas obat sudah sesuai?", jenis: "sesuai", sumber: ["farmasetik.farm-stabilitas"] },
      { linkId: "2.4", text: "Apakah aturan dan cara penggunaan obat sudah sesuai?", jenis: "sesuai", sumber: ["farmasetik.farm-aturan"] },
    ],
  },
  {
    linkId: "3", text: "Persyaratan Klinis",
    items: [
      { linkId: "3.1", text: "Apakah ketepatan indikasi, dosis, dan waktu penggunaan obat sudah sesuai?", jenis: "sesuai", sumber: ["klinis.klin-indikasi", "klinis.klin-dosis", "klinis.klin-aturan-lama"] },
      { linkId: "3.2", text: "Apakah terdapat duplikasi pengobatan?", jenis: "adaMasalah", sumber: ["klinis.klin-duplikasi"] },
      { linkId: "3.3", text: "Apakah terdapat alergi dan reaksi obat yang tidak dikehendaki (ROTD)?", jenis: "adaMasalah", sumber: ["klinis.klin-rotd"] },
      { linkId: "3.4", text: "Apakah terdapat kontraindikasi pengobatan?", jenis: "adaMasalah", sumber: ["klinis.klin-kontraindikasi"] },
      { linkId: "3.5", text: "Apakah terdapat dampak interaksi obat?", jenis: "adaMasalah", sumber: ["klinis.klin-interaksi"] },
    ],
  },
];

export const Q0007_ITEM_RESEP = { linkId: "4", text: "Resep yang dilakukan pengkajian resep" } as const;

type Answer = { valueCoding: typeof SESUAI } | { valueBoolean: boolean } | { valueReference: { reference: string } };
export interface QrItem {
  linkId: string;
  text: string;
  answer?: Answer[];
  item?: QrItem[];
}

/** Nilai lulus lokal dari `answers` JSONB (`{ grup: { linkIdLokal: boolean } }`); undefined = tak terisi. */
function lulusOf(answers: unknown, kunci: string): boolean | undefined {
  const [grup, linkId] = kunci.split(".") as [string, string];
  const g = answers && typeof answers === "object" ? (answers as Record<string, unknown>)[grup] : undefined;
  const v = g && typeof g === "object" ? (g as Record<string, unknown>)[linkId] : undefined;
  return typeof v === "boolean" ? v : undefined;
}

/**
 * Item 1–3 Q0007 dari jawaban lokal. Jawaban tak lengkap/rusak → Issue (QR tidak dikirim sebagian —
 * pengkajian tanpa jawaban bukan pengkajian). Item 4 (rujukan MedicationRequest) ditambah adapter.
 */
export function q0007ItemsOf(t: { id: string; answers: unknown }): { ok: true; items: QrItem[] } | { ok: false; issue: Issue } {
  const kosong: string[] = [];
  const items = Q0007_STRUKTUR.map((g) => ({
    linkId: g.linkId,
    text: g.text,
    item: g.items.map((it) => {
      const nilai = it.sumber.map((k) => lulusOf(t.answers, k));
      it.sumber.forEach((k, i) => { if (nilai[i] === undefined) kosong.push(k); });
      const lulus = nilai.every((v) => v === true);
      const answer: Answer = it.jenis === "sesuai" ? { valueCoding: lulus ? SESUAI : TIDAK_SESUAI } : { valueBoolean: !lulus };
      return { linkId: it.linkId, text: it.text, answer: [answer] };
    }),
  }));
  if (kosong.length) {
    return {
      ok: false,
      issue: {
        link: "L19", resourceType: "QuestionnaireResponse", localId: t.id, code: "kode-kosong",
        message: `Telaah resep belum lengkap (${kosong.length} butir kosong: ${kosong.join(", ")}) — ditahan`,
      },
    };
  }
  return { ok: true, items };
}
