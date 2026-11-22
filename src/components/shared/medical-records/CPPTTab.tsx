"use client";

// CPPT (Catatan Perkembangan Pasien Terintegrasi) — SATU komponen bersama untuk IGD · Rawat Inap ·
// Rawat Jalan · Farmasi (CPPT Apoteker). Orkestrator: muat/simpan ke medicalrecord.Cppt (mode DB,
// kunjunganId UUID) atau state lokal (pasien demo). Tampilan ada di cppt/CpptComposer (form) +
// cppt/CpptHistory (riwayat) + CPPTEntryCard.
//
// Perilaku penting:
// - Isi form TIDAK dikosongkan sebelum server menerima → gagal simpan tak menghilangkan tulisan.
// - Draf catatan baru bertahan saat pindah tab (memori, bukan storage browser — data klinis).
// - Profesi default mengikuti role akun login (kecuali unit memaksa, mis. Farmasi = Apoteker).

import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import type { CPPTEntry, CPPTJenis, CPPTProfesi } from "@/lib/data";
import { useSession } from "@/contexts/SessionContext";
import { hasSuperuserRole } from "@/lib/auth/superuser";
import { toast } from "@/lib/ui/toastStore";
import ConfirmDialog from "@/components/master/ruangan/ConfirmDialog";
import DiscardDialog from "@/components/master/icd/DiscardDialog";
import {
  getCppt, addCppt, updateCppt, verifyCppt, flagCppt, deleteCppt, type CpptEntryDTO,
} from "@/lib/api/cppt/cppt";
import { fmtDate, todayISO } from "./cpptShared";
import { CpptComposer } from "./cppt/CpptComposer";
import { CpptHistory } from "./cppt/CpptHistory";
import {
  EMPTY_FORM, buildPayload, draftStore, dtoToEntry, entryToForm, hasContent, profesiFromRoles, type CPPTForm,
} from "./cppt/cpptForm";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CPPTTabProps {
  initialEntries: CPPTEntry[];
  showDate?: boolean;             // RI/Farmasi: entri demo baru diberi tanggal hari ini
  requiresVerification?: boolean; // SNARS: co-sign DPJP per entri
  /** UUID kunjungan → mode DB (persist per-aksi ke medicalrecord.Cppt); selain itu demo lokal (mock). */
  kunjunganId?: string;
  /** Paksa profesi default (mis. "Apoteker" di tab Farmasi). Tanpa ini → dari role akun login. */
  defaultProfesi?: CPPTProfesi;
  /** Jenis catatan aktif saat tab dibuka. Default "SBAR" (pelaporan/komunikasi kondisi). */
  defaultJenis?: CPPTJenis;
}

type Pending = { kind: "copy"; entry: CPPTEntry } | { kind: "clear" } | null;

export default function CPPTTab({
  initialEntries, showDate = false, requiresVerification = false, kunjunganId, defaultProfesi, defaultJenis = "SBAR",
}: CPPTTabProps) {
  const isPersisted = !!kunjunganId && UUID_RE.test(kunjunganId);
  const { session } = useSession();
  const draftKey = kunjunganId ?? "demo";

  const baseProfesi: CPPTProfesi = defaultProfesi ?? profesiFromRoles(session?.roles ?? []) ?? "Dokter";
  const blank = useCallback((): CPPTForm => ({ ...EMPTY_FORM, profesi: baseProfesi, jenis: defaultJenis }), [baseProfesi, defaultJenis]);

  const [form, setForm] = useState<CPPTForm>(() => draftStore.get(draftKey) ?? { ...EMPTY_FORM, jenis: defaultJenis });
  const [draftRestored, setDraftRestored] = useState(() => !!draftStore.get(draftKey));
  // Profesi "otomatis" mengikuti role sampai operator mengubahnya (sesi bisa tiba sesudah mount).
  const [profesiAuto, setProfesiAuto] = useState(() => !draftStore.get(draftKey));
  const view: CPPTForm = profesiAuto ? { ...form, profesi: baseProfesi } : form;

  const [entries, setEntries] = useState<CPPTEntry[]>(isPersisted ? [] : [...initialEntries]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(isPersisted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [pending, setPending] = useState<Pending>(null);
  const [deleteTarget, setDeleteTarget] = useState<CPPTEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const flashTimer = useRef<number | undefined>(undefined);

  const editing = editingId ? entries.find((e) => e.id === editingId) ?? null : null;
  // TBAK selalu butuh co-sign DPJP (1×24 jam, SKP 2); SOAP/SBAR ikut prop tab.
  const needsVerify = requiresVerification || view.jenis === "TBAK";
  const serverVerifier = isPersisted ? (session?.namaTampil ?? null) : undefined;

  // ── Muat (mode DB) ──
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getCppt(kunjunganId!, ac.signal)
      .then((dto) => setEntries(dto.entries.map(dtoToEntry)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("Gagal memuat CPPT dari rekam medis");
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [kunjunganId, isPersisted]);

  // Draf catatan baru → memori (bukan saat mengedit catatan lama).
  useEffect(() => {
    if (!editingId) draftStore.set(draftKey, view);
  }, [view, editingId, draftKey]);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const reload = useCallback(async () => {
    if (!isPersisted) return;
    try {
      const dto = await getCppt(kunjunganId!);
      setEntries(dto.entries.map(dtoToEntry));
    } catch { /* pertahankan state terakhir */ }
  }, [kunjunganId, isPersisted]);

  const flash = (id: string) => {
    setFlashId(id);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashId(null), 2200);
  };

  const patchForm = (patch: Partial<CPPTForm>) => {
    if ("profesi" in patch) setProfesiAuto(false);
    setForm((prev) => ({ ...(profesiAuto ? { ...prev, profesi: baseProfesi } : prev), ...patch }));
    if (draftRestored && !editingId) setDraftRestored(false);
  };

  /** Sesudah tersimpan: catatan baru → form kosong & draf dibuang; edit → kembali ke draf (bila ada). */
  const resetAfter = (wasEdit: boolean) => {
    setEditingId(null);
    if (wasEdit) {
      const d = draftStore.get(draftKey);
      setForm(d ?? blank());
      setProfesiAuto(!d && !defaultProfesi);
      setDraftRestored(!!d);
    } else {
      draftStore.clear(draftKey);
      setForm(blank());
      setProfesiAuto(!defaultProfesi);
      setDraftRestored(false);
    }
  };

  // ── Simpan ──
  const save = async () => {
    const wasEdit = !!editingId;
    if (isPersisted) {
      setBusy(true);
      setError(null);
      try {
        const payload = buildPayload(view, requiresVerification, wasEdit ? "update" : "create");
        const dto: CpptEntryDTO = editingId
          ? await updateCppt(kunjunganId!, editingId, payload)
          : await addCppt(kunjunganId!, payload);
        const entry = dtoToEntry(dto);
        setEntries((prev) => (wasEdit ? prev.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...prev]));
        resetAfter(wasEdit);
        flash(entry.id);
        toast.success(wasEdit ? "Perubahan catatan disimpan" : "Catatan CPPT disimpan");
      } catch {
        setError(`Gagal menyimpan ${wasEdit ? "perubahan" : "catatan"} — isi form tetap utuh, silakan simpan lagi.`);
      } finally {
        setBusy(false);
      }
      return;
    }

    // ── Mode demo (lokal) ──
    const waktu = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const isTbak = view.jenis === "TBAK";
    const content = {
      profesi: view.profesi,
      penulis: view.penulis.trim(),
      jenisCatatan: view.jenis,
      subjektif: isTbak ? undefined : view.subjektif.trim() || undefined,
      objektif: isTbak ? undefined : view.objektif.trim() || undefined,
      asesmen: isTbak ? undefined : view.asesmen.trim() || undefined,
      planning: isTbak ? undefined : view.planning.trim() || undefined,
      instruksi: view.instruksi.trim() || undefined,
      tbakPemberi: isTbak ? view.tbakPemberi.trim() : undefined,
      tbakMetode: isTbak ? view.tbakMetode : undefined,
      tbakTulis: isTbak ? view.tbakTulis : undefined,
      tbakBaca: isTbak ? view.tbakBaca : undefined,
      tbakKonfirmasi: isTbak ? view.tbakKonfirmasi : undefined,
    } satisfies Partial<CPPTEntry>;
    const id = editingId ?? `cppt-${Date.now()}`;
    if (editingId) {
      setEntries((prev) => prev.map((e) => e.id === editingId
        ? { ...e, waktu, ...content, ...(needsVerify && { verified: false, verifiedBy: undefined, verifiedAt: undefined }) }
        : e));
    } else {
      const created: CPPTEntry = {
        id, waktu, tanggal: showDate ? todayISO() : undefined,
        ...content,
        verified: needsVerify ? false : undefined, flagged: false,
      };
      setEntries((prev) => [created, ...prev]);
    }
    resetAfter(wasEdit);
    flash(id);
    toast.success(wasEdit ? "Perubahan catatan disimpan" : "Catatan CPPT disimpan", "Mode demo — tidak tersimpan ke rekam medis");
  };

  // ── Aksi kartu ──
  const runReplace = async (p: Promise<CpptEntryDTO>, gagal: string) => {
    setBusy(true);
    setError(null);
    try {
      const dto = await p;
      setEntries((prev) => prev.map((e) => (e.id === dto.id ? dtoToEntry(dto) : e)));
    } catch {
      setError(gagal);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const doCopy = (e: CPPTEntry) => {
    setEditingId(null);
    setForm({ ...entryToForm(e), penulis: isPersisted ? "" : e.penulis });
    setProfesiAuto(false);
    setDraftRestored(false);
    setFocusKey((k) => k + 1);
  };

  const handleCopy = (e: CPPTEntry) => {
    if (!editingId && hasContent(view)) setPending({ kind: "copy", entry: e });
    else doCopy(e);
  };

  const handleEdit = (e: CPPTEntry) => {
    // Draf catatan baru tetap tersimpan di memori → kembali sesudah edit selesai / dibatalkan.
    setEditingId(e.id);
    setForm(entryToForm(e));
    setProfesiAuto(false);
    setFocusKey((k) => k + 1);
  };

  const handleClear = () => {
    if (hasContent(view)) setPending({ kind: "clear" });
    else resetAfter(false);
  };

  const handleVerify = (id: string, verifiedBy: string, verifiedAt: string) => {
    if (isPersisted) {
      // verifikator & waktu ditetapkan server dari akun login.
      void runReplace(verifyCppt(kunjunganId!, id), "Gagal memverifikasi catatan");
      return;
    }
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, verified: true, verifiedBy, verifiedAt } : e)));
  };

  const handleFlag = (id: string) => {
    const next = !entries.find((e) => e.id === id)?.flagged;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, flagged: next } : e))); // optimistik
    if (isPersisted) void runReplace(flagCppt(kunjunganId!, id, next), "Gagal menandai catatan");
  };

  // ── Hapus (soft-delete) — selalu lewat dialog konfirmasi; mode DB hanya pembuat / Admin ──
  const canDeleteEntry = (e: CPPTEntry) =>
    !isPersisted || hasSuperuserRole(session?.roles ?? []) || (!!e.authorUserId && e.authorUserId === session?.userId);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const drop = () => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (editingId === id) resetAfter(true);
      setDeleteTarget(null);
    };
    if (!isPersisted) { drop(); return; }
    setDeleting(true);
    setError(null);
    try {
      await deleteCppt(kunjunganId!, id);
      drop();
      toast.success("Catatan CPPT dihapus");
    } catch {
      setError("Gagal menghapus catatan CPPT");
      setDeleteTarget(null);
      await reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <CpptComposer
          form={view}
          onChange={patchForm}
          editing={editing}
          isPersisted={isPersisted}
          penulisLogin={session?.namaTampil ?? null}
          needsVerify={needsVerify}
          saving={busy}
          ttvKunjunganId={isPersisted ? kunjunganId! : null}
          draftRestored={draftRestored}
          onDiscardDraft={() => resetAfter(false)}
          onSave={() => void save()}
          onCancelEdit={() => resetAfter(true)}
          onClear={handleClear}
          focusKey={focusKey}
        />

        <CpptHistory
          entries={entries}
          loading={loading}
          busy={busy}
          error={error}
          onDismissError={() => setError(null)}
          editingId={editingId}
          flashId={flashId}
          requiresVerification={requiresVerification}
          serverVerifier={serverVerifier}
          canDelete={canDeleteEntry}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onVerify={handleVerify}
          onFlag={handleFlag}
          onDelete={setDeleteTarget}
        />
      </div>

      <DiscardDialog
        open={!!pending}
        title={pending?.kind === "copy" ? "Ganti isi form?" : "Kosongkan form?"}
        message={pending?.kind === "copy"
          ? "Form masih berisi catatan yang belum disimpan. Isinya akan diganti dengan salinan catatan terpilih."
          : "Catatan yang belum disimpan akan dihapus dari form."}
        confirmLabel={pending?.kind === "copy" ? "Ganti" : "Kosongkan"}
        cancelLabel="Batal"
        onConfirm={() => {
          if (pending?.kind === "copy") doCopy(pending.entry);
          else resetAfter(false);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />

      {/* ── Konfirmasi hapus (soft-delete medico-legal) ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        kindLabel="Catatan CPPT"
        name={deleteTarget ? `${deleteTarget.profesi} — ${deleteTarget.penulis}` : ""}
        kode={deleteTarget ? `${deleteTarget.tanggal ? `${fmtDate(deleteTarget.tanggal)}, ` : ""}${deleteTarget.waktu} · ${deleteTarget.jenisCatatan ?? "SOAP"}` : undefined}
        message={
          <>
            Catatan ini akan{" "}
            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600 ring-1 ring-rose-100">dihapus</span>{" "}
            dari riwayat CPPT pasien dan tidak lagi tampil di rekam medis.
          </>
        }
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </MotionConfig>
  );
}
