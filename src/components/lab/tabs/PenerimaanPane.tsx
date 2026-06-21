"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, User, CalendarDays, Hash, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { useLabRoster } from "../useLabRoster";
import AssignmentGuardBanner from "../AssignmentGuardBanner";
import { type LabOrder, updateLabWorkflow } from "../labShared";

// ── Props ─────────────────────────────────────────────────

interface Props { order: LabOrder; onStatusChange: () => void }

// ── Identity Card ─────────────────────────────────────────

function IdentityCard({
  icon, label, value, verified,
}: { icon: React.ReactNode; label: string; value: string; verified: boolean }) {
  return (
    <motion.div
      animate={{ borderColor: verified ? "#34d399" : "#e2e8f0" }}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 bg-white p-3.5 transition-colors",
        verified ? "border-emerald-300" : "border-slate-200",
      )}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", verified ? "bg-emerald-50" : "bg-slate-100")}>
        <span className={verified ? "text-emerald-600" : "text-slate-400"}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-[13px] font-bold text-slate-800">{value}</p>
      </div>
      {verified && (
        <CheckCircle2 size={16} className="ml-auto text-emerald-500 shrink-0" />
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PenerimaanPane({ order, onStatusChange }: Props) {
  const isAlreadyReceived = order.status !== "Menunggu";

  const { session } = useSession();
  // Diterima oleh = user yang sedang login (penerima order). Fallback ke yang tersimpan.
  const penerimaName = order.diterima_oleh || session?.namaTampil || "";

  // Penerima HARUS petugas ter-assign ke Laboratorium (SDM Assignment) — ditegakkan juga di server
  // (receive). Superuser/global bypass; tanpa sesi (dev) tak diblok. Peringatan hanya muncul
  // setelah roster termuat (anti-kedip).
  const { loading: rosterLoading, isAssigned } = useLabRoster(order.id);
  const notAssigned =
    !rosterLoading && !!session && !session.isSuperuser && !session.isGlobal && !isAssigned(session.pegawaiId);

  const [checked1,    setChecked1]    = useState(isAlreadyReceived);
  const [checked2,    setChecked2]    = useState(isAlreadyReceived);
  const [checked3,    setChecked3]    = useState(isAlreadyReceived);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(isAlreadyReceived);

  const canSubmit = checked1 && checked2 && checked3 && penerimaName.trim().length > 0 && !notAssigned;

  function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setTimeout(() => {
      updateLabWorkflow(order.id, {
        status: "Diterima",
        diterima_oleh: penerimaName,
        timestamps: { terima: new Date().toISOString().slice(0, 16) },
      });
      setSaving(false);
      setSaved(true);
      onStatusChange();
    }, 600);
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_340px]">

      {/* Left — Identity Verification */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Verifikasi Identitas Pasien</h3>
          <p className="text-[11px] text-slate-400">
            Konfirmasi 2 dari 3 identifer sebelum memproses order · SKP 1 · JCI IPSG.1
          </p>
        </div>

        <div className="space-y-2.5">
          <IdentityCard
            icon={<User size={16} />}
            label="Nama Lengkap"
            value={order.namaPasien}
            verified={checked1}
          />
          <IdentityCard
            icon={<CalendarDays size={16} />}
            label="Tanggal Lahir"
            value={new Date(order.tanggalLahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            verified={checked2}
          />
          <IdentityCard
            icon={<Hash size={16} />}
            label="No. Rekam Medis"
            value={order.noRM}
            verified={checked3}
          />
        </div>

        <AnimatePresence>
          {!saved && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Konfirmasi Identitas
              </p>
              <div className="space-y-2">
                {[
                  { label: "Nama lengkap sudah dikonfirmasi dengan gelang pasien", state: checked1, set: setChecked1 },
                  { label: "Tanggal lahir sudah dikonfirmasi secara lisan / dokumen", state: checked2, set: setChecked2 },
                  { label: "No. Rekam Medis sudah sesuai dengan formulir permintaan", state: checked3, set: setChecked3 },
                ].map(({ label, state, set }, i) => (
                  <label key={i} className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={state}
                      onChange={(e) => set(e.target.checked)}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 accent-sky-600"
                    />
                    <span className="text-[12px] text-slate-700">{label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Diterima Oleh <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <User size={16} className="shrink-0 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{penerimaName || "—"}</span>
                  <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">user login</span>
                </div>
              </div>

              {notAssigned && (
                <AssignmentGuardBanner message="Anda belum ditugaskan ke unit Laboratorium pada SDM Assignment. Hanya petugas ter-assign yang dapat menerima order. Hubungi admin untuk penugasan." />
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-40"
              >
                {saving ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    Konfirmasi Identitas & Terima Order
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
            >
              <CheckCircle2 size={20} className="text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Identitas Terverifikasi</p>
                <p className="text-[11px] text-emerald-700">
                  Diterima oleh: {order.diterima_oleh || penerimaName}
                  {order.timestamps.terima && ` · ${new Date(order.timestamps.terima).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right — Order Detail */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Detail Order
          </h4>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Order</span>
              <span className="font-mono font-semibold text-slate-800">{order.noOrder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dokter</span>
              <span className="text-right font-medium text-slate-700">{order.dokter.split(",")[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Unit Asal</span>
              <span className="font-medium text-slate-700">{order.unitAsal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Prioritas</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                order.prioritas === "CITO" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600",
              )}>
                {order.prioritas}
              </span>
            </div>
            {order.catatan && (
              <div className="mt-1 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700 ring-1 ring-amber-200">
                <span className="font-bold">Catatan: </span>{order.catatan}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Pemeriksaan yang Diminta
          </h4>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn(
                    "text-[12px] font-medium",
                    item.isSpecial ? "text-rose-700" : "text-slate-700",
                  )}>
                    {item.nama}
                  </p>
                  <p className="text-[10px] text-slate-400">{item.kode} · {item.waktuTunggu}</p>
                </div>
                {item.isSpecial && (
                  <span className="flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 ring-1 ring-rose-200">
                    <AlertTriangle size={8} />
                    Kritis
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
          <div className="flex items-start gap-2">
            <Clock size={14} className="mt-0.5 shrink-0 text-sky-600" />
            <div>
              <p className="text-[11px] font-bold text-sky-800">Waktu Masuk Order</p>
              <p className="text-[12px] text-sky-700">
                {order.tanggal} · {order.jam}
              </p>
              {order.timestamps.terima && (
                <p className="text-[11px] text-sky-600">
                  Diterima Lab: {new Date(order.timestamps.terima).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
