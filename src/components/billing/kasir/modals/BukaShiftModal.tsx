"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { LockOpen, Building, MapPin, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ModalShell, Field, ModalFooter, inputCn,
} from "../../invoice/modals/AddItemModal";
import { fmtRupiah } from "../../invoice/invoiceShared";
import {
  COUNTER_LIST, isCounterOccupied,
  type CounterId, type KasirShift,
} from "@/lib/billing/kasirShiftMock";
import { COUNTER_TONE } from "../kasirShared";
import { Select } from "@/components/shared/inputs";
import { listKasirUsers, type KasirUserDTO } from "@/lib/api/billing/shift";

interface Props {
  open: boolean;
  shifts: KasirShift[];     // untuk cek counter occupied (shift Open NYATA)
  onClose: () => void;
  onOpenShift: (input: BukaShiftInput) => void;
}

export interface BukaShiftInput {
  counter: CounterId;
  kasirPegawaiId: string;
  bukaSaldoAwal: number;
  bukaCatatan?: string;
}

interface FormState {
  counter: CounterId;
  kasirId: string;     // pegawaiId kasir terpilih
  saldo: string;       // string untuk validasi user input
  catatan: string;
}

const initialState = (): FormState => ({
  counter: "Kasir-1",
  kasirId: "",
  saldo: "500000",
  catatan: "",
});

/**
 * Form Buka Shift — pilih counter (occupied di-block) + kasir (dropdown NYATA: user
 * role "Kasir" + unitKerja kasir) + saldo kas fisik awal + catatan opsional serah-terima.
 */
export default function BukaShiftModal({
  open, shifts, onClose, onOpenShift,
}: Props) {
  const [form, setForm] = useState<FormState>(initialState);
  const [touched, setTouched] = useState(false);
  const [kasirUsers, setKasirUsers] = useState<KasirUserDTO[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Muat kandidat kasir (sekali) — user role "Kasir" + unitKerja kasir.
  useEffect(() => {
    const ac = new AbortController();
    listKasirUsers(ac.signal)
      .then((u) => {
        if (ac.signal.aborted) return;
        setKasirUsers(u);
        // Default kasir = kandidat pertama (bila belum dipilih).
        setForm((f) => (f.kasirId || u.length === 0 ? f : { ...f, kasirId: u[0].pegawaiId }));
      })
      .catch(() => { if (!ac.signal.aborted) setKasirUsers([]); })
      .finally(() => { if (!ac.signal.aborted) setUsersLoading(false); });
    return () => ac.abort();
  }, []);

  // Reset form + validasi saat modal DIBUKA — pola "adjust state during render"
  // (bukan effect) agar tidak memicu cascading render.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setForm({ ...initialState(), kasirId: form.kasirId || kasirUsers[0]?.pegawaiId || "" });
    setTouched(false);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const saldoNum = Number(form.saldo.replace(/[^\d]/g, ""));
  const counterOccupied = isCounterOccupied(form.counter, shifts);
  const selectedKasir = kasirUsers.find((k) => k.pegawaiId === form.kasirId);
  const counterCfg = COUNTER_LIST.find((c) => c.id === form.counter);
  const counterTone = COUNTER_TONE[form.counter];

  const errors = {
    counter: counterOccupied
      ? "Counter ini sedang dipakai shift Open lain — pilih yang lain"
      : null,
    kasir: !selectedKasir ? "Kasir wajib dipilih" : null,
    saldo: !Number.isFinite(saldoNum) || saldoNum < 0
      ? "Saldo awal harus ≥ 0"
      : null,
  };
  const hasError = Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (hasError || !selectedKasir) return;
    onOpenShift({
      counter: form.counter,
      kasirPegawaiId: selectedKasir.pegawaiId,
      bukaSaldoAwal: saldoNum,
      bukaCatatan: form.catatan.trim() || undefined,
    });
    onClose();
  };

  // ESC close
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <ModalShell title="Buka Shift Kasir" onClose={onClose} maxWidth="max-w-lg">
          <div className="space-y-3">
            {/* Counter — visual cards */}
            <div>
              <p className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Counter
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {COUNTER_LIST.map((c) => {
                  const tone = COUNTER_TONE[c.id];
                  const Icon = tone.icon;
                  const active = c.id === form.counter;
                  const occupied = isCounterOccupied(c.id, shifts);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm({ ...form, counter: c.id })}
                      disabled={occupied && !active}
                      title={occupied ? "Counter sedang dipakai" : c.lokasi}
                      className={cn(
                        "flex items-start gap-2 rounded-md border px-2 py-1.5 text-left text-[11.5px] transition-all",
                        active
                          ? cn("ring-1", tone.bg, tone.text, tone.ring, "border-transparent")
                          : occupied
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 line-through dark:border-slate-800 dark:bg-slate-900/50"
                            : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-700 dark:hover:bg-amber-950/30",
                      )}
                    >
                      <Icon size={14} className="mt-0.5 flex-none" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-tight">{c.nama}</p>
                        <p className="truncate text-[10px] opacity-80">
                          {occupied ? "Sudah dipakai" : c.lokasi}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {touched && errors.counter && (
                <p className="mt-1 text-[10.5px] text-rose-600">{errors.counter}</p>
              )}
            </div>

            {/* Kasir + selected counter info card */}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kasir" error={touched ? errors.kasir : null}>
                <Select
                  value={form.kasirId}
                  onChange={(v) => setForm({ ...form, kasirId: v })}
                  options={kasirUsers.map((k) => ({ value: k.pegawaiId, label: k.nama }))}
                  icon={UserRound}
                  placeholder={usersLoading ? "Memuat kasir…" : "— Pilih kasir —"}
                />
              </Field>
              <Field label="Lokasi">
                <div className={cn(inputCn, "flex items-center gap-1.5 bg-slate-50 text-slate-600 dark:bg-slate-800/50")}>
                  <MapPin size={11} className="text-slate-400" />
                  <span className="truncate text-[11.5px]">{counterCfg?.lokasi ?? "—"}</span>
                </div>
              </Field>
            </div>

            {!usersLoading && kasirUsers.length === 0 && (
              <p className="rounded-md border border-amber-200 bg-amber-50/50 px-2.5 py-1.5 text-[10.5px] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/15 dark:text-amber-300">
                Belum ada pengguna dengan peran <strong>Kasir</strong> &amp; unit kerja Kasir. Tambahkan
                di Master → Pengguna sebelum membuka shift.
              </p>
            )}

            {/* Saldo awal */}
            <Field label="Saldo Kas Awal (Rp)" error={touched ? errors.saldo : null}>
              <input
                type="text"
                inputMode="numeric"
                value={form.saldo}
                onChange={(e) => setForm({ ...form, saldo: e.target.value.replace(/[^\d]/g, "") })}
                placeholder="500000"
                className={cn(inputCn, "font-mono tabular-nums")}
              />
            </Field>

            {/* Catatan */}
            <Field label="Catatan Serah-Terima (opsional)">
              <textarea
                rows={2}
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                placeholder="Mis. terima dari shift malam dengan saldo Rp 500K"
                className={cn(inputCn, "resize-none")}
              />
            </Field>

            {/* Preview ringkas */}
            <div className="rounded-md border border-amber-200 bg-amber-50/40 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/15">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Konfirmasi
              </p>
              <p className="mt-0.5 text-[11.5px] text-slate-700 dark:text-slate-300">
                <span className="font-semibold">{selectedKasir?.nama ?? "—"}</span> akan membuka shift di{" "}
                <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ring-1", counterTone.bg, counterTone.text, counterTone.ring)}>
                  <Building size={10} />
                  {counterCfg?.nama ?? form.counter}
                </span>
                {" "}dengan saldo kas awal{" "}
                <span className="font-mono font-bold tabular-nums text-amber-700 dark:text-amber-300">
                  {fmtRupiah(saldoNum)}
                </span>.
              </p>
            </div>
          </div>

          <ModalFooter
            onClose={onClose}
            onConfirm={submit}
            confirmLabel="Buka Shift"
            confirmIcon={LockOpen}
          />
        </ModalShell>
      )}
    </AnimatePresence>
  );
}
