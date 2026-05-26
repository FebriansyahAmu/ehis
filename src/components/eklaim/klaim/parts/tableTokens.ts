/**
 * Table tokens — density-aware sizing + 11-column defs untuk Klaim Table (EK2.2).
 *
 * Convention font:
 * - Compact / Comfortable / Cozy semua ≥ 12px (no `text-xs`).
 * - Hint metadata maks 11.5px (uppercase tracking) — OK karena bukan body.
 *
 * Column widths fixed (px) supaya sticky-header alignment perfect.
 */

import type { Density } from "../klaimBoardShared";
import type { SortKey } from "../klaimBoardLogic";

// ── Density tokens ─────────────────────────────────────

export interface DensityToken {
  /** Vertical padding per cell. */
  rowPy: string;
  /** Horizontal padding per cell. */
  rowPx: string;
  /** Body font size. */
  fontBody: string;
  /** Mono/identifier font size. */
  fontMono: string;
  /** Hint font (uppercase tracking). */
  fontHint: string;
  /** Min row height — supaya density terasa. */
  rowMinH: string;
}

export const DENSITY_TOKENS: Record<Density, DensityToken> = {
  compact: {
    rowPy:    "py-1.5",
    rowPx:    "px-2.5",
    fontBody: "text-[12px]",
    fontMono: "text-[11.5px]",
    fontHint: "text-[10.5px]",
    rowMinH:  "min-h-[40px]",
  },
  comfortable: {
    rowPy:    "py-2.5",
    rowPx:    "px-3",
    fontBody: "text-[12.5px]",
    fontMono: "text-[12px]",
    fontHint: "text-[11px]",
    rowMinH:  "min-h-[52px]",
  },
  cozy: {
    rowPy:    "py-3.5",
    rowPx:    "px-3.5",
    fontBody: "text-[13.5px]",
    fontMono: "text-[12.5px]",
    fontHint: "text-[11.5px]",
    rowMinH:  "min-h-[64px]",
  },
};

// ── Column definitions ─────────────────────────────────

export interface ColumnDef {
  key: ColumnKey;
  label: string;
  /** Hint untuk sub-label di header (e.g. "Mono"). */
  sublabel?: string;
  /** Fixed width px. */
  width: number;
  /** Text alignment dalam cell. */
  align: "left" | "right" | "center";
  /** Apakah kolom bisa di-sort (3-state asc/desc/null). */
  sortable: boolean;
  /** Sort key untuk klik header (jika sortable). */
  sortKey?: SortKey;
  /** Sembunyikan di breakpoint < lg untuk hemat horizontal space. */
  hideOnSmall?: boolean;
}

export type ColumnKey =
  | "select"
  | "noKlaim"
  | "pasien"
  | "unitKelas"
  | "penjamin"
  | "grouper"
  | "tarifRS"
  | "tarifGrouper"
  | "selisih"
  | "status"
  | "actions";

export const COLUMN_DEFS: ColumnDef[] = [
  { key: "select",       label: "",                            width: 36,  align: "center", sortable: false                                       },
  { key: "noKlaim",      label: "No Klaim",     sublabel: "Tanggal", width: 168, align: "left",   sortable: true,  sortKey: "noKlaim"             },
  { key: "pasien",       label: "Pasien",                      width: 128, align: "left",   sortable: true,  sortKey: "pasienId"                  },
  { key: "unitKelas",    label: "Unit / Kelas",                width: 116, align: "left",   sortable: false, hideOnSmall: true                    },
  { key: "penjamin",     label: "Penjamin",                    width: 140, align: "left",   sortable: false                                       },
  { key: "grouper",      label: "iDRG / CBG",   sublabel: "Code",    width: 138, align: "left",   sortable: true,  sortKey: "iDRGCode"            },
  { key: "tarifRS",      label: "Tarif RS",                    width: 104, align: "right",  sortable: true,  sortKey: "tarifRS"                   },
  { key: "tarifGrouper", label: "Tarif Grouper",               width: 116, align: "right",  sortable: false, hideOnSmall: true                    },
  { key: "selisih",      label: "Selisih",                     width: 116, align: "right",  sortable: true,  sortKey: "selisih"                   },
  { key: "status",       label: "Status",                      width: 156, align: "left",   sortable: true,  sortKey: "status"                    },
  { key: "actions",      label: "",                            width: 40,  align: "center", sortable: false                                       },
];

/** Total fixed width — untuk min-w di table container (force horizontal scroll). */
export const TABLE_MIN_WIDTH = COLUMN_DEFS.reduce((sum, c) => sum + c.width, 0);

/** Header cell alignment class. */
export const ALIGN_CLASS: Record<ColumnDef["align"], string> = {
  left:   "text-left",
  right:  "text-right",
  center: "text-center",
};
