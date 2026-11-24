// Peta warna badge bersama modul BPJS (SEP, Rujukan, …). Warna punya ARTI TETAP dan selalu
// disertai teks (bukan warna saja):
//   emerald = terbit/berlaku/aktif · blue = diperbarui · slate = netral (ditutup, draf, asal, tipe)
//   rose = dihapus/kedaluwarsa/tidak aktif · cyan = rawat inap · sky = rawat jalan · teal = rujukan
//   amber = kecelakaan/suplesi atau segera berakhir · indigo = pembiayaan tambahan (eksekutif, COB)

export type BadgeTone = "emerald" | "blue" | "slate" | "rose" | "cyan" | "sky" | "teal" | "amber" | "indigo";

export const BADGE: Record<BadgeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  blue: "bg-blue-50 text-blue-800",
  slate: "bg-slate-100 text-slate-700",
  rose: "bg-rose-50 text-rose-800",
  cyan: "bg-cyan-50 text-cyan-800",
  sky: "bg-sky-50 text-sky-800",
  teal: "bg-teal-50 text-teal-800",
  amber: "bg-amber-50 text-amber-800",
  indigo: "bg-indigo-50 text-indigo-800",
};

export const DOT: Record<BadgeTone, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  slate: "bg-slate-400",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  indigo: "bg-indigo-500",
};
