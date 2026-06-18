// Template cetak Resep (A4) — tata letak proper & modern. Header RS · blok pasien & dokter ·
// badan ℞ (daftar obat) · kondisi klinis · blok TTE (barcode + penanda tangan). Light tones
// (printer-friendly). Dipakai di dalam `.print-area` oleh ResepCetakModal.

import { Pill, Phone } from "lucide-react";
import TteBarcode from "./TteBarcode";

export interface ResepCetakObat {
  namaObat: string;
  dosis?: string;
  dosisSekali?: string;
  signa: string;
  jumlah: number;
  rute?: string;
  aturanPakai?: string;
  kategori?: string;
}

export interface ResepCetakData {
  noResep: string;
  /** ISO — waktu resep / tanda tangan. */
  tanggal: string;
  pasien: { nama: string; noRM: string; usia?: string; jenisKelamin?: "L" | "P"; unit?: string };
  dokter: string;
  dokterKontak?: string;
  depo: string;
  catatan?: string;
  kondisi?: { ginjal?: string; kehamilan?: string; menyusui?: string };
  items: ResepCetakObat[];
  tte: { token: string; signedBy: string; signedAt: string };
}

const RS = { nama: "RS Harapan Sehat", alamat: "Jl. Kesehatan No. 1, Kota Sehat", telp: "(021) 123-4567" };

function fmtTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const NETRAL = /tidak diketahui/i;
function kondisiChips(k?: ResepCetakData["kondisi"]): { label: string; value: string }[] {
  if (!k) return [];
  const out: { label: string; value: string }[] = [];
  if (k.ginjal && !NETRAL.test(k.ginjal)) out.push({ label: "Fungsi Ginjal", value: k.ginjal });
  if (k.kehamilan && !NETRAL.test(k.kehamilan)) out.push({ label: "Kehamilan", value: k.kehamilan });
  if (k.menyusui && !NETRAL.test(k.menyusui)) out.push({ label: "Menyusui", value: k.menyusui });
  return out;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[12px] font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default function ResepCetakTemplate({ data }: { data: ResepCetakData }) {
  const chips = kondisiChips(data.kondisi);

  return (
    <div className="flex min-h-full flex-col px-9 py-8 text-slate-900">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-indigo-600 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Pill size={22} />
          </span>
          <div>
            <p className="text-lg font-black leading-tight text-slate-900">{RS.nama}</p>
            <p className="text-[11px] text-slate-500">{RS.alamat}</p>
            <p className="text-[11px] text-slate-500">Telp. {RS.telp}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-600">Resep / Rx</p>
          <p className="mt-1 font-mono text-xs font-semibold text-slate-700">No. {data.noResep}</p>
          <p className="text-[11px] text-slate-500">{fmtTanggal(data.tanggal)}</p>
        </div>
      </div>

      {/* ── Pasien & Dokter ── */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">Pasien</p>
          <div className="grid grid-cols-2 gap-y-2">
            <InfoCell label="Nama" value={data.pasien.nama} />
            <InfoCell label="No. RM" value={data.pasien.noRM} />
            <InfoCell
              label="Usia / JK"
              value={[data.pasien.usia, data.pasien.jenisKelamin === "L" ? "Laki-laki" : data.pasien.jenisKelamin === "P" ? "Perempuan" : ""].filter(Boolean).join(" · ") || "—"}
            />
            {data.pasien.unit && <InfoCell label="Unit" value={data.pasien.unit} />}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">Dokter Penulis (DPJP)</p>
          <p className="text-[13px] font-bold text-slate-800">{data.dokter}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <Phone size={10} /> {data.dokterKontak || "-"}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">Depo tujuan: <span className="font-semibold text-slate-600">{data.depo}</span></p>
        </div>
      </div>

      {/* ── Kondisi klinis ── */}
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kondisi:</span>
          {chips.map((c) => (
            <span key={c.label} className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
              {c.label}: {c.value}
            </span>
          ))}
        </div>
      )}

      {/* ── Badan resep (℞) ── */}
      <div className="mt-5 flex-1">
        <div className="mb-3 flex items-end gap-2">
          <span className="font-serif text-4xl font-bold leading-none text-indigo-600">℞</span>
          <p className="pb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Daftar Obat ({data.items.length})
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          {data.items.map((it, i) => (
            <div
              key={i}
              className="flex gap-3 border-b border-slate-100 px-4 py-3 last:border-0 even:bg-slate-50/50"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-bold text-slate-800">{it.namaObat}</p>
                  {it.kategori && it.kategori !== "Reguler" && (
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-700">
                      {it.kategori}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-600">
                  <span><span className="text-slate-400">Signa:</span> <span className="font-semibold">{it.signa || "—"}</span></span>
                  {it.dosisSekali && <span><span className="text-slate-400">Dosis sekali:</span> {it.dosisSekali}</span>}
                  {it.rute && <span><span className="text-slate-400">Rute:</span> {it.rute}</span>}
                  {it.aturanPakai && <span><span className="text-slate-400">Aturan:</span> {it.aturanPakai}</span>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] uppercase tracking-wide text-slate-400">Jumlah</p>
                <p className="text-[13px] font-bold tabular-nums text-slate-800">{it.jumlah}</p>
              </div>
            </div>
          ))}
        </div>

        {data.catatan && (
          <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-600 ring-1 ring-slate-200">
            <span className="font-semibold text-slate-500">Catatan: </span>{data.catatan}
          </p>
        )}
      </div>

      {/* ── TTE (Tanda Tangan Elektronik) ── */}
      <div className="mt-6 flex items-end justify-between gap-6 border-t border-slate-200 pt-4">
        <div className="max-w-[58%] text-[10px] leading-relaxed text-slate-500">
          <p className="mb-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
            ✓ Ditandatangani Elektronik (TTE)
          </p>
          <p>
            Resep ini telah ditandatangani secara elektronik oleh{" "}
            <span className="font-semibold text-slate-700">{data.tte.signedBy}</span> pada {fmtTanggal(data.tte.signedAt)}.
          </p>
          <p className="mt-1 italic">
            Dokumen sah & memiliki kekuatan hukum tanpa tanda tangan basah maupun cap (UU No. 11/2008 ITE).
          </p>
        </div>
        <div className="shrink-0 text-center">
          <TteBarcode value={data.tte.token} height={48} />
          <p className="mt-1 text-[9px] uppercase tracking-wide text-slate-400">Serial TTE</p>
        </div>
      </div>
    </div>
  );
}
