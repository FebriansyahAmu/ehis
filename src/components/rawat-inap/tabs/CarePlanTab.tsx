"use client";

// Tab Rencana Asuhan (RAT — SNARS PP 1 & PP 2). Goal-centric & PROBLEM-ORIENTED:
// daftar MASALAH aktif (boleh link Diagnosa/SDKI → anti-redundan) → tiap masalah punya
// GOAL terukur per PPA + verifikasi co-sign DPJP. DB-wired (medicalrecord.CarePlanMasalah/Goal
// via /kunjungan/:id/care-plan, gate clinical.careplan). Pasien NYATA (UUID) persist; pasien
// demo (non-UUID) = state lokal efemeral (banner). Verifikasi hanya DPJP (Dokter/superuser).

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, ShieldCheck, Info, Loader2 } from "lucide-react";
import type { RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import {
  getCarePlan, createMasalah, updateMasalah, deleteMasalah,
  createGoal, updateGoal, deleteGoal,
} from "@/lib/api/carePlan/carePlan";
import MasalahForm from "./carePlan/MasalahForm";
import MasalahCard from "./carePlan/MasalahCard";
import {
  goalTally, unverifiedAktif, localMasalah, localGoal,
  type CarePlanMasalahDTO, type MasalahInput, type GoalInput, type MasalahStatusDTO,
} from "./carePlan/carePlanShared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Progress header ───────────────────────────────────────────────────────────
function ProgressHeader({ list }: { list: CarePlanMasalahDTO[] }) {
  const { total, tercapai } = goalTally(list);
  const unver = unverifiedAktif(list);
  const pct = total === 0 ? 0 : Math.round((tercapai / total) * 100);
  const allVerified = list.length > 0 && unver === 0;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", allVerified ? "bg-emerald-100" : "bg-sky-100")}>
        <ClipboardList size={14} className={allVerified ? "text-emerald-600" : "text-sky-600"} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Rencana Asuhan Terintegrasi</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
            {list.length} masalah · {tercapai}/{total} goal tercapai
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={cn("h-full rounded-full", allVerified ? "bg-emerald-400" : "bg-sky-400")}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">{pct}%</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CarePlanTab({ patient }: { patient: RawatInapPatientDetail }) {
  const kunjunganId = patient.id;
  const isPersisted = UUID_RE.test(kunjunganId);

  const { session } = useSession();
  const canVerify = !!session && (session.isSuperuser || session.roles.includes("Dokter"));
  const pencatat = session?.namaTampil ?? "Petugas";

  const [list, setList] = useState<CarePlanMasalahDTO[]>([]);
  const [loading, setLoading] = useState(isPersisted);
  const [adding, setAdding] = useState(false);

  // Muat masalah + goal (kunjungan UUID). loading di-init isPersisted → demo langsung false.
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getCarePlan(kunjunganId, ac.signal)
      .then((rows) => setList(rows))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat rencana asuhan", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [kunjunganId, isPersisted]);

  // Helper: ganti 1 masalah di list (server truth).
  const replaceMasalah = (dto: CarePlanMasalahDTO) =>
    setList((l) => l.map((m) => (m.id === dto.id ? dto : m)));
  // Helper: patch lokal (pasien demo) 1 masalah.
  const patchLocal = (id: string, fn: (m: CarePlanMasalahDTO) => CarePlanMasalahDTO) =>
    setList((l) => l.map((m) => (m.id === id ? fn(m) : m)));

  async function guard<T>(fn: () => Promise<T>, msg: string): Promise<T | undefined> {
    try { return await fn(); }
    catch (e) { toast.error(msg, e instanceof ApiError ? e.message : undefined); return undefined; }
  }

  // ── Mutations (branch persisted vs demo) ──────────────────────────────────
  async function addMasalah(input: MasalahInput) {
    if (isPersisted) {
      const dto = await guard(() => createMasalah(kunjunganId, input), "Gagal menambah masalah");
      if (dto) { setList((l) => [...l, dto]); setAdding(false); }
    } else {
      setList((l) => [...l, localMasalah(input, pencatat)]); setAdding(false);
    }
  }

  async function addGoal(masalahId: string, input: GoalInput) {
    if (isPersisted) {
      const dto = await guard(() => createGoal(kunjunganId, masalahId, input), "Gagal menambah goal");
      if (dto) replaceMasalah(dto);
    } else {
      patchLocal(masalahId, (m) => ({ ...m, goals: [...m.goals, localGoal(input, pencatat)] }));
    }
  }

  async function editGoal(masalahId: string, goalId: string, input: GoalInput) {
    if (isPersisted) {
      const dto = await guard(() => updateGoal(kunjunganId, masalahId, goalId, input), "Gagal mengubah goal");
      if (dto) replaceMasalah(dto);
    } else {
      patchLocal(masalahId, (m) => ({
        ...m,
        goals: m.goals.map((g) => (g.id === goalId ? { ...localGoal(input, g.pencatat), id: g.id, waktu: g.waktu } : g)),
      }));
    }
  }

  async function removeGoal(masalahId: string, goalId: string) {
    if (isPersisted) {
      const dto = await guard(() => deleteGoal(kunjunganId, masalahId, goalId), "Gagal menghapus goal");
      if (dto) replaceMasalah(dto);
    } else {
      patchLocal(masalahId, (m) => ({ ...m, goals: m.goals.filter((g) => g.id !== goalId) }));
    }
  }

  async function setStatus(masalahId: string, status: MasalahStatusDTO) {
    if (isPersisted) {
      const dto = await guard(() => updateMasalah(kunjunganId, masalahId, { status }), "Gagal mengubah status");
      if (dto) replaceMasalah(dto);
    } else {
      patchLocal(masalahId, (m) => ({ ...m, status }));
    }
  }

  async function verify(masalahId: string, verified: boolean) {
    if (isPersisted) {
      const dto = await guard(
        () => updateMasalah(kunjunganId, masalahId, { verified, verifiedBy: verified ? pencatat : undefined }),
        "Gagal verifikasi",
      );
      if (dto) replaceMasalah(dto);
    } else {
      patchLocal(masalahId, (m) => ({
        ...m, verified, verifiedBy: verified ? pencatat : "", verifiedAt: verified ? new Date().toISOString() : "",
      }));
    }
  }

  async function removeMasalah(masalahId: string) {
    if (isPersisted) {
      const ok = await guard(async () => { await deleteMasalah(kunjunganId, masalahId); return true; }, "Gagal menghapus masalah");
      if (ok) setList((l) => l.filter((m) => m.id !== masalahId));
    } else {
      setList((l) => l.filter((m) => m.id !== masalahId));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 size={16} className="animate-spin" /> Memuat rencana asuhan…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ProgressHeader list={list} />

      {/* Compliance + demo note */}
      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5">
        <Info size={11} className="mt-0.5 shrink-0 text-slate-400" />
        <p className="text-[10px] text-slate-400">
          SNARS PP 1 — Rencana asuhan terintegrasi disusun seluruh PPA & diverifikasi DPJP sebagai ketua tim.
          {!isPersisted && <span className="font-semibold text-amber-600"> Pasien demo — perubahan tidak tersimpan.</span>}
        </p>
      </div>

      {/* Daftar masalah */}
      <AnimatePresence initial={false}>
        {list.map((m) => (
          <MasalahCard
            key={m.id}
            masalah={m}
            canVerify={canVerify}
            onAddGoal={(input) => addGoal(m.id, input)}
            onUpdateGoal={(goalId, input) => editGoal(m.id, goalId, input)}
            onDeleteGoal={(goalId) => removeGoal(m.id, goalId)}
            onSetStatus={(status) => setStatus(m.id, status)}
            onVerify={(verified) => verify(m.id, verified)}
            onDelete={() => removeMasalah(m.id)}
          />
        ))}
      </AnimatePresence>

      {list.length === 0 && !adding && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center">
          <ClipboardList size={22} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs text-slate-400">Belum ada masalah pada rencana asuhan</p>
        </div>
      )}

      {/* Tambah masalah */}
      <AnimatePresence>
        {adding && (
          <MasalahForm onCancel={() => setAdding(false)} onSubmit={addMasalah} />
        )}
      </AnimatePresence>

      {!adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-500 transition hover:border-sky-300 hover:bg-sky-50/40 hover:text-sky-600"
        >
          <Plus size={14} /> Tambah Masalah
        </button>
      )}

      {/* Verifikasi ringkas */}
      {list.length > 0 && unverifiedAktif(list) === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 shadow-xs"
        >
          <ShieldCheck size={15} className="shrink-0 text-emerald-500" />
          <p className="text-xs font-semibold text-emerald-800">Seluruh masalah aktif telah diverifikasi DPJP</p>
        </motion.div>
      )}
    </div>
  );
}
