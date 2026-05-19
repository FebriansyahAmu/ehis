"use client";

import { Plus, Trash2, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabKatalogItem, NilaiRujukanRow } from "@/lib/master/labCatalogMock";

const cellInput =
  "w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-sky-400 focus:ring-1 focus:ring-sky-100";

interface Props {
  draft: LabKatalogItem;
  onPatch: (p: Partial<LabKatalogItem>) => void;
}

const GENDER_OPTS = [
  { value: "LP", label: "Semua", icon: Users },
  { value: "L",  label: "L",     icon: User  },
  { value: "P",  label: "P",     icon: User  },
] as const;

function fmtUsia(min?: number, max?: number): string {
  if (min === undefined && max === undefined) return "Semua usia";
  if (min === undefined) return `0 – ${max} th`;
  if (max === undefined) return `≥ ${min} th`;
  return `${min} – ${max} th`;
}

function addRow(rows: NilaiRujukanRow[]): NilaiRujukanRow[] {
  return [
    ...rows,
    { id: `r-${Date.now()}`, gender: "LP", low: 0, high: 0 },
  ];
}

function patchRow(
  rows: NilaiRujukanRow[],
  id: string,
  patch: Partial<NilaiRujukanRow>,
): NilaiRujukanRow[] {
  return rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
}

function removeRow(rows: NilaiRujukanRow[], id: string): NilaiRujukanRow[] {
  return rows.filter((r) => r.id !== id);
}

export default function LabNilaiRujukanTab({ draft, onPatch }: Props) {
  const rows = draft.nilaiRujukan;

  return (
    <div className="flex flex-col gap-4">
      {/* Info */}
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
        <p className="text-[11px] text-emerald-700">
          Tentukan range normal berdasarkan gender dan kelompok usia.
          Nilai di luar range akan di-flag <strong>H</strong> (tinggi) atau <strong>L</strong> (rendah)
          secara otomatis di HasilPane. Bisa lebih dari satu baris untuk kondisi berbeda.
        </p>
      </div>

      {/* Tabel */}
      <div className="overflow-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[580px] text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Gender</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Usia Min (th)</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Usia Maks (th)</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">
                Batas Bawah {draft.satuan ? <span className="font-normal text-slate-400">({draft.satuan})</span> : null}
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">
                Batas Atas {draft.satuan ? <span className="font-normal text-slate-400">({draft.satuan})</span> : null}
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Keterangan</th>
              <th className="w-8 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-xs text-slate-400">
                  Belum ada baris nilai rujukan — klik "+ Tambah Baris" di bawah.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                {/* Gender */}
                <td className="px-2 py-1.5">
                  <div className="flex gap-0.5 rounded border border-slate-200 bg-slate-50 p-0.5">
                    {GENDER_OPTS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          onPatch({ nilaiRujukan: patchRow(rows, row.id, { gender: value }) })
                        }
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-semibold transition",
                          row.gender === value
                            ? "bg-sky-600 text-white shadow-sm"
                            : "text-slate-500 hover:bg-white",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </td>

                {/* Usia Min */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={row.usiaMin ?? ""}
                    onChange={(e) =>
                      onPatch({
                        nilaiRujukan: patchRow(rows, row.id, {
                          usiaMin: e.target.value === "" ? undefined : Number(e.target.value),
                        }),
                      })
                    }
                    placeholder="—"
                    className={cn(cellInput, "w-20")}
                  />
                </td>

                {/* Usia Maks */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={row.usiaMax ?? ""}
                    onChange={(e) =>
                      onPatch({
                        nilaiRujukan: patchRow(rows, row.id, {
                          usiaMax: e.target.value === "" ? undefined : Number(e.target.value),
                        }),
                      })
                    }
                    placeholder="—"
                    className={cn(cellInput, "w-20")}
                  />
                </td>

                {/* Low */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="any"
                    value={row.low}
                    onChange={(e) =>
                      onPatch({
                        nilaiRujukan: patchRow(rows, row.id, { low: Number(e.target.value) }),
                      })
                    }
                    className={cn(cellInput, "w-24")}
                  />
                </td>

                {/* High */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="any"
                    value={row.high}
                    onChange={(e) =>
                      onPatch({
                        nilaiRujukan: patchRow(rows, row.id, { high: Number(e.target.value) }),
                      })
                    }
                    className={cn(cellInput, "w-24")}
                  />
                </td>

                {/* Keterangan */}
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={row.keterangan ?? ""}
                    onChange={(e) =>
                      onPatch({
                        nilaiRujukan: patchRow(rows, row.id, {
                          keterangan: e.target.value || undefined,
                        }),
                      })
                    }
                    placeholder="Opsional..."
                    className={cellInput}
                  />
                </td>

                {/* Delete */}
                <td className="px-2 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      onPatch({ nilaiRujukan: removeRow(rows, row.id) })
                    }
                    className="rounded p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tambah baris */}
      <button
        type="button"
        onClick={() => onPatch({ nilaiRujukan: addRow(rows) })}
        className="flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 px-3.5 py-2 text-xs font-medium text-emerald-600 transition hover:border-emerald-400 hover:bg-emerald-50"
      >
        <Plus size={13} />
        Tambah Baris
      </button>

      {/* Summary preview */}
      {rows.length > 0 && (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Preview Range</p>
          <div className="flex flex-wrap gap-2">
            {rows.map((r) => (
              <span
                key={r.id}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600"
              >
                <span className="font-medium text-sky-700">
                  {r.gender === "LP" ? "Semua" : r.gender}
                </span>
                {" · "}
                {fmtUsia(r.usiaMin, r.usiaMax)}
                {" · "}
                {r.low} – {r.high}
                {draft.satuan ? ` ${draft.satuan}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
