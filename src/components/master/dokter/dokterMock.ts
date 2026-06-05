// Mock LEGACY domain Dokter — khusus konsumen Mapping Hub (kewenangan · SDM Assignment) yang
// MASIH berbasis mock (penugasan poli & kewenangan klinis belum di-wire ke backend).
//
// CATATAN: Master Dokter & Nakes (`/ehis-master/dokter`) kini API-driven (lihat src/lib/api/dokter.ts
// + DokterPage). Tipe/array di sini BUKAN source-of-truth — hanya seed UI Mapping Hub sampai
// fitur tersebut ikut di-wire. Vocab (SpesialisCode/StatusPraktik) tetap dari dokterShared.

import type { SpesialisCode, StatusPraktik } from "./dokterShared";

export type DokterStatus = StatusPraktik;

export interface JadwalSlot {
  hari: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu";
  jamMulai: string;
  jamSelesai: string;
}

export interface DokterRecord {
  id: string;
  nik: string;
  nama: string;
  tanggalLahir?: string;
  jenisKelamin?: "L" | "P";
  noSTR?: string;
  strBerlakuHingga?: string;
  spesialis?: SpesialisCode;
  kualifikasi?: string;
  noSIP: string;
  sipBerlakuHingga?: string;
  email: string;
  telp: string;
  poliAssignment: string[];
  jadwal: JadwalSlot[];
  status: DokterStatus;
}

export const POLI_LIST: { kode: string; nama: string }[] = [
  { kode: "POLI-UMUM",  nama: "Poli Umum" },
  { kode: "POLI-JTG",   nama: "Poli Jantung" },
  { kode: "POLI-PD",    nama: "Poli Penyakit Dalam" },
  { kode: "POLI-ANAK",  nama: "Poli Anak" },
  { kode: "POLI-OBGYN", nama: "Poli Kebidanan" },
  { kode: "POLI-BEDAH", nama: "Poli Bedah" },
  { kode: "POLI-SARAF", nama: "Poli Saraf" },
  { kode: "POLI-MATA",  nama: "Poli Mata" },
  { kode: "IGD",        nama: "IGD" },
  { kode: "ICU",        nama: "ICU" },
];

export function getPoliNama(kode: string): string {
  return POLI_LIST.find((p) => p.kode === kode)?.nama ?? kode;
}

export function newDokterId(): string {
  return `dr-${Math.random().toString(36).slice(2, 8)}`;
}

export const DOKTER_MOCK: DokterRecord[] = [
  {
    id: "dr-001",
    nik: "3171010101800001",
    nama: "dr. Budi Santoso, Sp.JP",
    tanggalLahir: "1980-01-01",
    jenisKelamin: "L",
    noSTR: "12.3.4.5.6.20.123456",
    strBerlakuHingga: "2028-01-15",
    spesialis: "SpJP",
    kualifikasi: "Spesialis Jantung & Pembuluh Darah",
    noSIP: "SIP/123/DPMPTSP/2024",
    sipBerlakuHingga: "2027-12-31",
    email: "budi.santoso@rsharapansehat.id",
    telp: "0812-3456-7890",
    poliAssignment: ["POLI-JTG", "ICU"],
    jadwal: [
      { hari: "Senin", jamMulai: "08:00", jamSelesai: "12:00" },
      { hari: "Rabu",  jamMulai: "08:00", jamSelesai: "12:00" },
      { hari: "Jumat", jamMulai: "13:00", jamSelesai: "17:00" },
    ],
    status: "Aktif",
  },
  {
    id: "dr-002",
    nik: "3171020202850002",
    nama: "dr. Hendra Wijaya, Sp.EM",
    tanggalLahir: "1985-02-02",
    jenisKelamin: "L",
    noSTR: "12.3.4.5.6.20.234567",
    strBerlakuHingga: "2027-06-30",
    spesialis: "SpEM",
    kualifikasi: "Spesialis Emergency Medicine",
    noSIP: "SIP/124/DPMPTSP/2024",
    sipBerlakuHingga: "2027-06-30",
    email: "hendra.wijaya@rsharapansehat.id",
    telp: "0813-4567-8901",
    poliAssignment: ["IGD"],
    jadwal: [
      { hari: "Senin",  jamMulai: "08:00", jamSelesai: "20:00" },
      { hari: "Selasa", jamMulai: "08:00", jamSelesai: "20:00" },
      { hari: "Kamis",  jamMulai: "08:00", jamSelesai: "20:00" },
    ],
    status: "Aktif",
  },
  {
    id: "dr-003",
    nik: "3171030303880003",
    nama: "dr. Siti Aminah, Sp.A",
    tanggalLahir: "1988-03-03",
    jenisKelamin: "P",
    noSTR: "12.3.4.5.6.20.345678",
    strBerlakuHingga: "2029-01-10",
    spesialis: "SpA",
    kualifikasi: "Spesialis Anak",
    noSIP: "SIP/125/DPMPTSP/2024",
    sipBerlakuHingga: "2028-01-10",
    email: "siti.aminah@rsharapansehat.id",
    telp: "0814-5678-9012",
    poliAssignment: ["POLI-ANAK"],
    jadwal: [
      { hari: "Selasa", jamMulai: "08:00", jamSelesai: "12:00" },
      { hari: "Kamis",  jamMulai: "08:00", jamSelesai: "12:00" },
      { hari: "Sabtu",  jamMulai: "09:00", jamSelesai: "13:00" },
    ],
    status: "Cuti",
  },
  {
    id: "dr-004",
    nik: "3171040404900004",
    nama: "dr. Rahma Putri",
    spesialis: "Umum",
    kualifikasi: "Dokter Umum",
    noSIP: "SIP/126/DPMPTSP/2024",
    sipBerlakuHingga: "2027-08-15",
    email: "rahma.putri@rsharapansehat.id",
    telp: "0815-6789-0123",
    poliAssignment: ["POLI-UMUM", "IGD"],
    jadwal: [
      { hari: "Senin", jamMulai: "13:00", jamSelesai: "17:00" },
      { hari: "Rabu",  jamMulai: "13:00", jamSelesai: "17:00" },
    ],
    status: "Aktif",
  },
];
