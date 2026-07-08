"use client";

// Jadwal Kontrol Poliklinik — komponen SHARED (dipakai Rawat Inap "Pasien Pulang → Obat & Jadwal"
// dan Rawat Jalan "Surat & Dokumen → Surat Kontrol"). Beda unit via props (isPersisted/kunjunganId/
// isBpjs/userNama + items demo). DOMAIN PERSIST medicalrecord.JadwalKontrol: nomor auto sistem
// (JK-<YYMM><NNN>); pasien BPJS → server panggil V-Claim RencanaKontrol/insert → No. Referensi =
// noSuratKontrol response; kodeDokter TIDAK ada di form (resolve server dari bpjs.DpjpMapping via
// dokter terpilih, embed ke payload). Pratinjau payload = hyperlink → modal (pola SEP).
// Semua kontrol pakai komponen global (Select/DatePicker). Pasien demo (non-UUID) = daftar lokal.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Braces, CalendarCheck, CheckCircle2, Copy, Pencil, Plus, ShieldCheck, Trash2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { Select, DatePicker } from "@/components/shared/inputs";
import { listDpjpTersedia, type DpjpTersediaDTO } from "@/lib/api/master/dpjpTersedia";
import {
  listJadwalKontrol, createJadwalKontrol, updateJadwalKontrol, deleteJadwalKontrol, listSepTerbit,
  type JadwalKontrolDTO, type SepTerbitDTO,
} from "@/lib/api/jadwalKontrol/jadwalKontrol";
import { SMF_POLI_MAP } from "@/components/igd/tabs/pasienPulang/smfPoliMap";
import RencanaKontrolPayloadModal from "./RencanaKontrolPayloadModal";

// ── Bentuk item lokal (demo, non-UUID) — identik lintas unit ──
export interface JadwalKontrolLocal {
  id:           string;
  tanggal:      string; // "YYYY-MM-DD" — BPJS: tglRencanaKontrol
  poli:         string; // nama poli (tampil)
  dokter:       string;
  catatan:      string;
  noSEP?:       string;
  kodeDokter?:  string;
  poliKontrol?: string;
}

// ── UI helpers (self-contained) ───────────────────────────
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
      {label}{required && <span className="ml-0.5 text-rose-400">*</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-orange-300 focus:ring-1 focus:ring-orange-100";

const POLI_KONTROL_OPTIONS = Object.values(SMF_POLI_MAP)
  .map((p) => ({ value: p.kode, label: `${p.nama} (${p.kode})` }))
  .sort((a, b) => a.label.localeCompare(b.label, "id"));

/** Bentuk seragam kartu jadwal — dari DTO server (persisted) atau item lokal (demo). */
interface KontrolView {
  id: string;
  tanggal: string;
  poli: string;
  dokter: string;
  catatan: string;
  nomor?: string;             // auto sistem (persisted saja)
  noSEP?: string;
  noReferensi?: string | null; // noSuratKontrol BPJS
}

export default function JadwalKontrolSection({
  isPersisted, kunjunganId, items, onChange, isBpjs, userNama, onCountChange, onServerItemsChange,
}: {
  isPersisted: boolean;
  kunjunganId: string;
  items:    JadwalKontrolLocal[];                // demo (lokal)
  onChange: (items: JadwalKontrolLocal[]) => void;
  isBpjs:   boolean;
  userNama: string;
  onCountChange?: (n: number) => void;           // sinkron badge count parent (persisted)
  /** Emit daftar DB (persisted) tiap berubah (fetch/create/edit/delete) → konsumen mirror ke riwayat surat. */
  onServerItemsChange?: (items: JadwalKontrolDTO[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [payloadOpen, setPayloadOpen] = useState(false); // modal pratinjau payload
  const [saving, setSaving] = useState(false);
  const [serverItems, setServerItems] = useState<JadwalKontrolDTO[]>([]);
  const [issued, setIssued] = useState<JadwalKontrolDTO | null>(null); // panel "Surat Kontrol Terbit"
  const [editId, setEditId] = useState<string | null>(null); // null = tambah · id = edit (noSuratKontrol sama)
  // Dokter melekat dengan kode DPJP BPJS-nya (bpjs.DpjpMapping — sumber sama dgn SPRI):
  // pilih dokter → kode ketarik otomatis & di-embed server saat submit (tanpa form kode).
  const [dokterList, setDokterList] = useState<DpjpTersediaDTO[] | null>(null);
  // SEP TERBIT pasien (lintas kunjungan, terbaru dulu) — picker No. SEP; default SEP kunjungan ini.
  const [sepList, setSepList] = useState<SepTerbitDTO[] | null>(null);
  const [draft, setDraft] = useState({
    tanggal: "", poliKontrol: "", dokterId: "", dokter: "", catatan: "", noSEP: "", kodeDokter: "",
  });

  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    listJadwalKontrol(kunjunganId, ac.signal).then(setServerItems).catch(() => {});
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  useEffect(() => {
    if (isPersisted) onCountChange?.(serverItems.length);
  }, [isPersisted, serverItems.length, onCountChange]);

  useEffect(() => {
    if (isPersisted) onServerItemsChange?.(serverItems);
  }, [isPersisted, serverItems, onServerItemsChange]);

  useEffect(() => {
    if (!showForm || dokterList !== null) return;
    const ac = new AbortController();
    listDpjpTersedia(ac.signal).then(setDokterList).catch(() => setDokterList([]));
    return () => ac.abort();
  }, [showForm, dokterList]);

  useEffect(() => {
    if (!showForm || !isBpjs || !isPersisted || sepList !== null) return;
    const ac = new AbortController();
    listSepTerbit(kunjunganId, ac.signal)
      .then((rows) => {
        setSepList(rows);
        // Default = SEP kunjungan yang sedang dibuka (bila ada & belum dipilih).
        const ini = rows.find((s) => s.kunjunganIni);
        if (ini) setDraft((d) => (d.noSEP ? d : { ...d, noSEP: ini.noSep }));
      })
      .catch(() => setSepList([]));
    return () => ac.abort();
  }, [showForm, isBpjs, isPersisted, sepList, kunjunganId]);

  // Baris yang sedang diedit (persisted) → sumber nomor/noReferensi/noSep read-only + payload Update.
  const editingDto = editId && isPersisted ? serverItems.find((d) => d.id === editId) ?? null : null;

  const dokterTerpilih = dokterList?.find((d) => d.dokterId === draft.dokterId) ?? null;
  const kodeAuto = !!dokterTerpilih?.kodeBpjs;

  function pilihDokter(dokterId: string) {
    const d = dokterList?.find((x) => x.dokterId === dokterId);
    setDraft((prev) => ({
      ...prev,
      dokterId,
      dokter: d?.nama ?? "",
      kodeDokter: d?.kodeBpjs ?? "", // preview payload; server resolve ulang (otoritatif)
    }));
  }

  const poliLabel = POLI_KONTROL_OPTIONS.find((p) => p.value === draft.poliKontrol)?.label ?? "";
  const poliNamaBersih = poliLabel.replace(/ \([A-Z]+\)$/, "");
  const canSave = !saving && !!draft.tanggal && !!draft.poliKontrol &&
    (!isBpjs || (!!draft.noSEP.trim() && kodeAuto));

  // Edit → RencanaKontrol/Update (noSuratKontrol di depan). Tambah → RencanaKontrol/insert.
  const payloadEndpoint = editId ? "RencanaKontrol/Update" : "RencanaKontrol/insert";
  const payloadObj = {
    request: {
      ...(editId ? { noSuratKontrol: editingDto?.noReferensi || "{noSuratKontrol}" } : {}),
      noSEP: draft.noSEP || "{nomor SEP}",
      kodeDokter: draft.kodeDokter || "{kode dokter — resolve server}",
      poliKontrol: draft.poliKontrol || "{kode poli}",
      tglRencanaKontrol: draft.tanggal || "{yyyy-MM-dd}",
      user: userNama || "{user}",
    },
  };

  function resetForm() {
    setDraft({ tanggal: "", poliKontrol: "", dokterId: "", dokter: "", catatan: "", noSEP: "", kodeDokter: "" });
    setShowForm(false);
    setPayloadOpen(false);
    setEditId(null);
  }

  /** Buka form dalam mode EDIT — prefill dari baris (server DTO / lokal), noSuratKontrol/noSep tetap. */
  function startEdit(id: string) {
    setIssued(null);
    if (isPersisted) {
      const d = serverItems.find((x) => x.id === id);
      if (!d) return;
      setDraft({
        tanggal: d.tanggal, poliKontrol: d.poliKontrol, dokterId: d.dokterId ?? "",
        dokter: d.dokterNama, catatan: d.catatan, noSEP: d.noSep, kodeDokter: d.kodeDokter,
      });
    } else {
      const jk = items.find((x) => x.id === id);
      if (!jk) return;
      setDraft({
        tanggal: jk.tanggal, poliKontrol: jk.poliKontrol ?? "", dokterId: "",
        dokter: jk.dokter, catatan: jk.catatan, noSEP: jk.noSEP ?? "", kodeDokter: jk.kodeDokter ?? "",
      });
    }
    setEditId(id);
    setShowForm(true);
  }

  async function save() {
    if (!canSave) return;
    if (!isPersisted) {
      // Demo — daftar lokal (tanpa nomor sistem / WS BPJS).
      const patch = {
        tanggal: draft.tanggal,
        poli: poliNamaBersih,
        dokter: draft.dokter.trim(),
        catatan: draft.catatan.trim(),
        ...(isBpjs ? { noSEP: draft.noSEP.trim(), kodeDokter: draft.kodeDokter.trim(), poliKontrol: draft.poliKontrol } : {}),
      };
      if (editId) {
        onChange(items.map((it) => (it.id === editId ? { ...it, ...patch } : it)));
      } else {
        const newItem: JadwalKontrolLocal = { id: `jk-${Date.now()}`, ...patch };
        onChange([...items, newItem]);
      }
      resetForm();
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        // EDIT — noSuratKontrol + noSep tetap; baris BPJS → server kirim RencanaKontrol/Update.
        const dto = await updateJadwalKontrol(kunjunganId, editId, {
          tanggal: draft.tanggal,
          poliNama: poliNamaBersih,
          poliKontrol: draft.poliKontrol,
          dokterId: draft.dokterId || undefined,
          dokterNama: draft.dokter.trim(),
          catatan: draft.catatan.trim(),
        });
        setServerItems((arr) => arr.map((d) => (d.id === dto.id ? dto : d)));
        toast.success(
          "Jadwal kontrol diperbarui",
          dto.noReferensi ? `BPJS RencanaKontrol/Update · ${dto.noReferensi}` : undefined,
        );
        resetForm();
      } else {
        const dto = await createJadwalKontrol(kunjunganId, {
          tanggal: draft.tanggal,
          poliNama: poliNamaBersih,
          poliKontrol: draft.poliKontrol,
          dokterId: draft.dokterId || undefined,
          dokterNama: draft.dokter.trim(),
          catatan: draft.catatan.trim(),
          bpjs: isBpjs,
          noSep: draft.noSEP.trim(),
        });
        setServerItems((arr) => [dto, ...arr]);
        setIssued(dto); // panel terbit (visual utama — toast tidak perlu dobel)
        resetForm();
      }
    } catch (e) {
      toast.error(
        editId ? "Gagal memperbarui jadwal kontrol" : "Gagal menerbitkan jadwal kontrol",
        e instanceof ApiError ? e.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  }

  async function hapus(id: string) {
    if (!isPersisted) {
      onChange(items.filter((i) => i.id !== id));
      return;
    }
    try {
      await deleteJadwalKontrol(kunjunganId, id);
      setServerItems((arr) => arr.filter((i) => i.id !== id));
      toast.success("Jadwal kontrol dibatalkan");
    } catch (e) {
      toast.error("Gagal membatalkan jadwal", e instanceof ApiError ? e.message : undefined);
    }
  }

  // Kartu seragam dari dua sumber.
  const views: KontrolView[] = isPersisted
    ? serverItems.map((d) => ({
        id: d.id, tanggal: d.tanggal,
        poli: d.poliKontrol ? `${d.poliNama} (${d.poliKontrol})` : d.poliNama,
        dokter: d.dokterNama, catatan: d.catatan,
        nomor: d.nomor, noSEP: d.noSep || undefined, noReferensi: d.noReferensi,
      }))
    : items.map((jk) => ({
        id: jk.id, tanggal: jk.tanggal,
        poli: jk.poliKontrol ? `${jk.poli} (${jk.poliKontrol})` : jk.poli,
        dokter: jk.dokter, catatan: jk.catatan,
        noSEP: jk.noSEP, noReferensi: undefined,
      }));

  function salinReferensi(teks: string) {
    void navigator.clipboard?.writeText(teks).then(() => toast.success("Disalin ke clipboard", teks));
  }

  return (
    <div>
      {payloadOpen && (
        <RencanaKontrolPayloadModal
          payload={payloadObj}
          endpoint={payloadEndpoint}
          onClose={() => setPayloadOpen(false)}
        />
      )}

      {/* ── Panel "Surat Kontrol Terbit" — visual sukses pasca-submit ── */}
      <AnimatePresence>
        {issued && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, height: 0, marginBottom: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="mb-3 overflow-hidden rounded-2xl border border-emerald-200 shadow-md shadow-emerald-100/60"
          >
            {/* Header gradient */}
            <div className="flex items-center gap-3 bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-3">
              <motion.span
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.12 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white"
              >
                <CheckCircle2 size={20} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">Surat Kontrol Terbit</p>
                <p className="text-[11px] text-emerald-50">
                  {issued.noReferensi
                    ? "V-Claim RencanaKontrol/insert — metaData 200 Ok"
                    : "Tersimpan di sistem (non-BPJS)"}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 font-mono text-[10px] font-bold text-white">
                {issued.nomor}
              </span>
            </div>

            {/* Body */}
            <div className="bg-white px-4 py-3.5">
              {issued.noReferensi && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                    No. Referensi (noSuratKontrol)
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-base font-bold tracking-wide text-emerald-800">
                      {issued.noReferensi}
                    </p>
                    <button
                      type="button"
                      onClick={() => salinReferensi(issued.noReferensi!)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-95"
                    >
                      <Copy size={11} /> Salin
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                {[
                  {
                    label: "Tanggal Kontrol",
                    val: new Date(issued.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
                  },
                  { label: "Poliklinik", val: issued.poliKontrol ? `${issued.poliNama} (${issued.poliKontrol})` : issued.poliNama },
                  { label: "Dokter", val: issued.dokterNama || "—" },
                  { label: "No. SEP", val: issued.noSep || "—", mono: true },
                ].map(({ label, val, mono }) => (
                  <div key={label}>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className={cn("mt-0.5 text-[11px] font-semibold text-slate-700", mono && "font-mono")}>
                      {val}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <p className="text-[10px] text-slate-400">
                  Diterbitkan oleh {issued.pencatat} · {issued.createdAt.slice(0, 10)} {issued.createdAt.slice(11, 16)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setIssued(null); setShowForm(true); }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Buat Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssued(null)}
                    className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 active:scale-95"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {views.length === 0 && !showForm && !issued && (
          <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-[11px] text-slate-400">
            Belum ada jadwal kontrol
          </p>
        )}
        <AnimatePresence>
          {views.map((jk) => (
            <motion.div
              key={jk.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
              className={cn(
                "flex items-start gap-2 rounded-xl border p-3",
                jk.noReferensi
                  ? "border-emerald-200 border-l-4 border-l-emerald-400 bg-emerald-50/40"
                  : "border-slate-100 bg-slate-50",
              )}
            >
              <CalendarCheck size={12} className={cn("mt-0.5 shrink-0", jk.noReferensi ? "text-emerald-500" : "text-orange-400")} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {jk.nomor && (
                    <span className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-600">
                      {jk.nomor}
                    </span>
                  )}
                  <p className="text-[12px] font-semibold text-slate-700">
                    {new Date(jk.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {jk.noSEP && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                      <ShieldCheck size={8} /> BPJS
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {jk.poli}{jk.dokter ? ` · ${jk.dokter}` : ""}
                </p>
                {jk.noReferensi && (
                  <p className="mt-0.5 text-[10px] text-emerald-700">
                    No. Referensi: <span className="font-mono font-semibold">{jk.noReferensi}</span>
                  </p>
                )}
                {jk.noSEP && (
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">SEP {jk.noSEP}</p>
                )}
                {jk.catatan && <p className="mt-0.5 text-[10px] text-slate-400">{jk.catatan}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => startEdit(jk.id)}
                  title="Edit jadwal (nomor surat kontrol sama)"
                  className="rounded-lg p-1 text-slate-300 transition hover:bg-orange-50 hover:text-orange-500"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => void hapus(jk.id)}
                  title="Batalkan jadwal"
                  className="rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-orange-200 bg-orange-50/70 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold text-orange-700">
                  {editId ? "Edit Jadwal Kontrol" : "Tambah Jadwal Kontrol"}
                </p>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
              </div>

              {/* Nomor (auto sistem) + No. Referensi (return BPJS) — read-only, bukan isian.
                  Edit → tampilkan nilai NYATA (tetap sama; surat tidak diterbitkan ulang). */}
              <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <FieldLabel label="Nomor" />
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2">
                    <span className={cn("font-mono text-xs", editingDto ? "text-slate-600" : "text-slate-400")}>
                      {editingDto ? editingDto.nomor : "JK-…"}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500">
                      {editId ? "Tetap" : "Auto · Sistem"}
                    </span>
                  </div>
                </div>
                <div>
                  <FieldLabel label="No. Referensi" />
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2">
                    <span className={cn("truncate font-mono text-xs", editingDto?.noReferensi ? "text-emerald-700" : "text-slate-400")}>
                      {editingDto?.noReferensi ? editingDto.noReferensi : isBpjs ? "noSuratKontrol…" : "—"}
                    </span>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide",
                      isBpjs ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400",
                    )}>
                      {editId ? "Tetap" : isBpjs ? "Return BPJS" : "Non-BPJS"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <FieldLabel label="Tanggal Rencana Kontrol" required />
                  <DatePicker
                    value={draft.tanggal}
                    onChange={(iso) => setDraft((d) => ({ ...d, tanggal: iso }))}
                    placeholder="Pilih tanggal kontrol"
                  />
                </div>
                <div>
                  <FieldLabel label="Poliklinik Tujuan" required />
                  <Select
                    value={draft.poliKontrol}
                    onChange={(v) => setDraft((d) => ({ ...d, poliKontrol: v }))}
                    options={POLI_KONTROL_OPTIONS}
                    searchable
                    placeholder="Pilih poli…"
                  />
                </div>
                <div>
                  <FieldLabel label="Dokter" />
                  {dokterList && dokterList.length > 0 ? (
                    <Select
                      value={draft.dokterId}
                      onChange={pilihDokter}
                      options={dokterList.map((d) => ({
                        value: d.dokterId,
                        label: isBpjs && !d.kodeBpjs ? `${d.nama} · belum ter-map BPJS` : d.nama,
                      }))}
                      searchable
                      placeholder="Pilih dokter…"
                    />
                  ) : (
                    <input
                      value={draft.dokter}
                      onChange={(e) => setDraft((d) => ({ ...d, dokter: e.target.value }))}
                      placeholder="Nama dokter tujuan…"
                      className={inputCls}
                    />
                  )}
                </div>
                <div>
                  <FieldLabel label="Catatan" />
                  <input
                    value={draft.catatan}
                    onChange={(e) => setDraft((d) => ({ ...d, catatan: e.target.value }))}
                    placeholder="Catatan tambahan…"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Blok BPJS — payload V-Claim RencanaKontrol/insert */}
              {isBpjs && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5">
                  <div className="mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      {editId
                        ? "Pasien BPJS — RencanaKontrol/Update (No. Surat Kontrol sama)"
                        : "Pasien BPJS — data RencanaKontrol/insert wajib"}
                    </p>
                  </div>
                  <div>
                    <FieldLabel label="No. SEP" required />
                    {editId ? (
                      // Edit → SEP asal = identitas surat, TIDAK diubah.
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2">
                        <span className="truncate font-mono text-xs text-slate-600">{draft.noSEP || "—"}</span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500">Tetap</span>
                      </div>
                    ) : sepList && sepList.length > 0 ? (
                      <Select
                        value={draft.noSEP}
                        onChange={(v) => setDraft((d) => ({ ...d, noSEP: v }))}
                        options={sepList.map((s) => ({
                          value: s.noSep,
                          label: `${s.noSep} — ${s.tglSep} · ${s.jenis}${s.kunjunganIni ? " · kunjungan ini" : ""}`,
                        }))}
                        searchable
                        placeholder="Pilih SEP terbit…"
                      />
                    ) : (
                      <input
                        value={draft.noSEP}
                        onChange={(e) => setDraft((d) => ({ ...d, noSEP: e.target.value }))}
                        placeholder={sepList === null ? "0301R011…" : "Belum ada SEP terbit — isi manual…"}
                        className={cn(inputCls, "font-mono")}
                      />
                    )}
                    {!editId && sepList && sepList.length > 0 && (
                      <p className="mt-1 text-[9px] text-emerald-700">
                        {sepList.length} SEP terbit milik pasien — urut terbaru; default SEP kunjungan ini.
                      </p>
                    )}
                  </div>
                  {/* kodeDokter TIDAK ditampilkan sebagai form — ketarik dari mapping DPJP dan
                      langsung di-embed ke payload saat submit (lihat Lihat Payload). */}
                  {dokterTerpilih && !kodeAuto && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] leading-snug text-amber-700 ring-1 ring-amber-100">
                      <span className="font-semibold">{dokterTerpilih.nama}</span> belum memiliki kode DPJP BPJS —
                      lengkapi di Mapping Hub → DPJP BPJS agar jadwal kontrol BPJS bisa disimpan.
                    </p>
                  )}
                  {!dokterTerpilih && (
                    <p className="mt-2 text-[10px] text-emerald-700">
                      Pilih dokter di atas — kode DPJP BPJS-nya otomatis disertakan ke payload.
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] text-emerald-700">
                      User pembuat: <span className="font-semibold">{userNama || "—"}</span>
                      <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-600">Sesi Login</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setPayloadOpen(true)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 transition hover:text-emerald-800"
                    >
                      <Braces size={11} /> Lihat Payload (JSON)
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between">
                {!canSave ? (
                  <p className="text-[10px] text-slate-400">
                    Lengkapi tanggal + poli{isBpjs && " + No. SEP + dokter ter-map BPJS"}
                  </p>
                ) : <span />}
                <button
                  onClick={() => void save()}
                  disabled={!canSave}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving
                    ? (editId ? "Menyimpan…" : "Menerbitkan…")
                    : (editId ? "Perbarui Jadwal" : "Simpan Jadwal")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-orange-200 py-2.5 text-[11px] font-medium text-orange-500 transition hover:border-orange-300 hover:bg-orange-50"
        >
          <Plus size={12} /> Tambah Jadwal Kontrol
        </button>
      )}
    </div>
  );
}
