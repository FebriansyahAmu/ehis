// Template cetak Stok Opname (A4) — "Berita Acara Stok Opname". Header RS · info sesi · ringkasan
// selisih · tabel item (Sistem/Fisik/Selisih/Keterangan) · blok tanda tangan. Light tones
// (printer-friendly). Dipakai di dalam `.print-area` oleh OpnameCetakModal.

import { ClipboardCheck } from "lucide-react";
import type { OpnameDTO } from "@/lib/api/inventory/opname";

const RS = { nama: "RS Harapan Sehat", alamat: "Jl. Kesehatan No. 1, Kota Sehat", telp: "(021) 123-4567" };

function fmtTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function fmtCetak(): string {
  return new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[12px] font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default function OpnameCetakTemplate({ data }: { data: OpnameDTO }) {
  let counted = 0, selisih = 0, netUp = 0, netDown = 0;
  for (const l of data.lines) {
    if (l.qtyFisik === null) continue;
    counted++;
    const d = l.qtyFisik - l.qtySistem;
    if (d > 0) { selisih++; netUp += d; } else if (d < 0) { selisih++; netDown += -d; }
  }

  return (
    <div className="flex min-h-full flex-col px-9 py-8 text-slate-900">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-cyan-600 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600 text-white">
            <ClipboardCheck size={22} />
          </span>
          <div>
            <p className="text-lg font-black leading-tight text-slate-900">{RS.nama}</p>
            <p className="text-[11px] text-slate-500">{RS.alamat}</p>
            <p className="text-[11px] text-slate-500">Telp. {RS.telp}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-600">Berita Acara<br />Stok Opname</p>
          <p className="mt-1 font-mono text-xs font-semibold text-slate-700">No. {data.noDokumen}</p>
          <p className="text-[11px] text-slate-500">{fmtTanggal(data.tanggal)}</p>
        </div>
      </div>

      {/* ── Info sesi ── */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">Lokasi & Tanggal</p>
          <div className="grid grid-cols-2 gap-y-2">
            <InfoCell label="Lokasi" value={data.locationNama} />
            <InfoCell label="Tanggal Opname" value={fmtTanggal(data.tanggal)} />
            <InfoCell label="Petugas" value={data.petugas} />
            <InfoCell label="Status" value={data.status} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">Ringkasan</p>
          <div className="grid grid-cols-2 gap-y-2">
            <InfoCell label="Total Item" value={String(data.lines.length)} />
            <InfoCell label="Terhitung" value={`${counted} / ${data.lines.length}`} />
            <InfoCell label="Item Selisih" value={String(selisih)} />
            <InfoCell label="Penyesuaian Net" value={`+${netUp} / −${netDown}`} />
          </div>
        </div>
      </div>

      {/* ── Tabel item ── */}
      <div className="mt-5 flex-1">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Rincian Hitung Fisik</p>
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-100 text-left text-[9px] uppercase tracking-wide text-slate-500">
              <th className="px-2 py-1.5 font-bold">No</th>
              <th className="px-2 py-1.5 font-bold">Barang</th>
              <th className="px-2 py-1.5 text-right font-bold">Sistem</th>
              <th className="px-2 py-1.5 text-right font-bold">Fisik</th>
              <th className="px-2 py-1.5 text-right font-bold">Selisih</th>
              <th className="px-2 py-1.5 font-bold">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l, i) => {
              const sel = l.qtyFisik === null ? null : l.qtyFisik - l.qtySistem;
              return (
                <tr key={l.id} className="border-b border-slate-100 align-top even:bg-slate-50/60">
                  <td className="px-2 py-1.5 tabular-nums text-slate-400">{i + 1}</td>
                  <td className="px-2 py-1.5">
                    <span className="font-semibold text-slate-800">{l.nama}</span>
                    <span className="ml-1 text-slate-400">· {l.kode} · {l.satuan}</span>
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-slate-600">{l.qtySistem}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-slate-800">{l.qtyFisik ?? "—"}</td>
                  <td className={`px-2 py-1.5 text-right font-mono font-bold tabular-nums ${sel === null ? "text-slate-300" : sel === 0 ? "text-slate-400" : sel > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {sel === null ? "—" : sel > 0 ? `+${sel}` : sel}
                  </td>
                  <td className="px-2 py-1.5 text-slate-500">{l.alasan ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-[10px] italic leading-relaxed text-slate-500">
          Selisih (Fisik − Sistem) telah diposting sebagai penyesuaian (movement OPNAME) pada ledger stok inventory.
        </p>
      </div>

      {/* ── Tanda tangan ── */}
      <div className="mt-8 grid grid-cols-2 gap-6 text-center text-[11px]">
        <div>
          <p className="text-slate-500">Mengetahui,</p>
          <p className="font-semibold text-slate-700">Penanggung Jawab Logistik / Farmasi</p>
          <div className="mt-14 border-t border-slate-400 pt-1">
            <p className="text-[10px] text-slate-400">Nama & Tanda Tangan</p>
          </div>
        </div>
        <div>
          <p className="text-slate-500">Petugas Opname,</p>
          <p className="font-semibold text-slate-700">{data.petugas}</p>
          <div className="mt-14 border-t border-slate-400 pt-1">
            <p className="text-[10px] text-slate-400">Nama & Tanda Tangan</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-right text-[9px] text-slate-400">Dicetak: {fmtCetak()}</p>
    </div>
  );
}
