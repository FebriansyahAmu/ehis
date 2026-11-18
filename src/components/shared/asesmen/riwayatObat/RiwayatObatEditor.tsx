"use client";

// Editor daftar Riwayat Obat — dipakai sama persis oleh IGD (AsesmenMedisTab) dan RI/RJ (shared RiwayatPane).
// Pane pemanggil tetap memegang muat/simpan (pola masing-masing); editor ini hanya baris obat + rekomendasi.
// Per baris: Nama obat (combobox rekomendasi formularium → KFA) · Status (wajib MedicationStatement) · dosis ·
// frekuensi · rute · sejak · indikasi.

import { useId } from "react";
import { BadgeCheck, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RUTE_OBAT } from "../asesmenShared";
import ObatKfaCombobox, { type ObatPilihan } from "./ObatKfaCombobox";
import { emptyRiwayatObat, useObatRekomendasi, type RiwayatObatEntry } from "./riwayatObatShared";
import type { StatusRiwayatObat } from "@/lib/fhir/links/riwayatObat";

const STATUS_OPSI: { value: StatusRiwayatObat; label: string }[] = [
  { value: "aktif", label: "Masih diminum" },
  { value: "berhenti", label: "Sudah berhenti" },
];

const INPUT_CLS =
  "h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-200";
const LABEL_CLS = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400";

interface Props {
  value: RiwayatObatEntry[];
  onChange: (next: RiwayatObatEntry[]) => void;
}

export default function RiwayatObatEditor({ value, onChange }: Props) {
  const uid = useId();
  const rekomendasi = useObatRekomendasi();

  const patch = (key: string, p: Partial<RiwayatObatEntry>) => onChange(value.map((r) => (r.key === key ? { ...r, ...p } : r)));
  const remove = (key: string) => onChange(value.filter((r) => r.key !== key));
  const add = () => onChange([...value, emptyRiwayatObat()]);

  const terisi = value.filter((r) => r.nama.trim());
  const siapKirim = terisi.filter((r) => r.obatId && r.kfa && r.status).length;

  return (
    <div className="flex flex-col gap-3">
      {terisi.length > 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <BadgeCheck size={13} className={siapKirim === terisi.length ? "text-emerald-600" : "text-slate-400"} aria-hidden />
          <span>
            <strong className="font-semibold text-slate-700">{siapKirim}</strong> dari {terisi.length} obat ber-kode KFA — siap
            dikirim ke SatuSehat
          </span>
        </p>
      )}

      {value.map((ob, i) => {
        const fid = (f: string) => `${uid}-${ob.key}-${f}`;
        const nomor = `Obat #${i + 1}`;
        return (
          <div key={ob.key} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{nomor}</span>
              {value.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(ob.key)}
                  aria-label={`Hapus ${nomor}${ob.nama.trim() ? ` (${ob.nama.trim()})` : ""}`}
                  className="grid min-h-6 min-w-6 place-items-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                >
                  <X size={14} aria-hidden />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2">
                <ObatKfaCombobox
                  id={fid("nama")}
                  value={{ nama: ob.nama, obatId: ob.obatId, kfa: ob.kfa }}
                  onChange={(v: ObatPilihan) => patch(ob.key, v)}
                  rekomendasi={rekomendasi}
                />
              </div>

              <fieldset className="col-span-2 sm:col-span-1">
                <legend className={LABEL_CLS}>
                  Status<span className="ml-0.5 text-rose-400" aria-hidden>*</span>
                </legend>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUS_OPSI.map((s) => (
                    <label key={s.value} className="relative block cursor-pointer">
                      <input
                        type="radio"
                        name={fid("status")}
                        value={s.value}
                        checked={ob.status === s.value}
                        onChange={() => patch(ob.key, { status: s.value })}
                        required
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "flex h-8 items-center justify-center rounded-lg border px-2 text-center text-[11px] font-semibold transition",
                          "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                          "peer-checked:border-sky-400 peer-checked:bg-sky-50 peer-checked:text-sky-700",
                          "peer-focus-visible:ring-2 peer-focus-visible:ring-sky-200",
                        )}
                      >
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor={fid("dosis")} className={LABEL_CLS}>Dosis</label>
                <input id={fid("dosis")} value={ob.dosis} onChange={(e) => patch(ob.key, { dosis: e.target.value })}
                  placeholder="5 mg, 1 tablet…" className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor={fid("frekuensi")} className={LABEL_CLS}>Frekuensi</label>
                <input id={fid("frekuensi")} value={ob.frekuensi} onChange={(e) => patch(ob.key, { frekuensi: e.target.value })}
                  placeholder="1×/hari, 3×/hari…" className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor={fid("rute")} className={LABEL_CLS}>Rute</label>
                <select id={fid("rute")} value={ob.rute} onChange={(e) => patch(ob.key, { rute: e.target.value })} className={INPUT_CLS}>
                  {RUTE_OBAT.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={fid("sejak")} className={LABEL_CLS}>Sejak</label>
                <input id={fid("sejak")} value={ob.sejak} onChange={(e) => patch(ob.key, { sejak: e.target.value })}
                  placeholder="Jan 2024, ±6 bulan…" className={INPUT_CLS} />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label htmlFor={fid("indikasi")} className={LABEL_CLS}>Indikasi</label>
                <input id={fid("indikasi")} value={ob.indikasi} onChange={(e) => patch(ob.key, { indikasi: e.target.value })}
                  placeholder="Indikasi / keterangan penggunaan…" className={INPUT_CLS} />
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-500 transition hover:border-sky-300 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
      >
        <Plus size={15} aria-hidden /> Tambah Obat
      </button>
    </div>
  );
}
