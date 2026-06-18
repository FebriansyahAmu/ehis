"use client";

// Shell modal Pengguna: AnimatePresence + container. Routing:
//   initial == null → Wizard "Tambah Pengguna Baru" (Pegawai → Akun → Role, simpan bertahap)
//   initial != null → Form Edit (1 layar; identitas pegawai terkunci)
// Backdrop TIDAK menutup saat diklik — sebagai gantinya modal BERGETAR (shake) untuk
// menandakan harus pakai Batal/✕. Centering via flex agar shake (x) tak bentrok transform.

import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from "framer-motion";
import type {
  PenggunaRecord, PegawaiFormData, AkunData, UserRole, UserStatus, ExistingPegawaiSeed,
} from "./penggunaShared";
import PenggunaAddWizard from "./PenggunaAddWizard";
import PenggunaEditForm from "./PenggunaEditForm";

interface PenggunaFormModalProps {
  open: boolean;
  initial: PenggunaRecord | null;
  onClose: () => void;
  /** EDIT — simpan perubahan akun (persist kredensial + peran/status; di-await sebelum modal ditutup). */
  onSubmit: (next: PenggunaRecord, changes: { password?: string }) => void | Promise<void>;
  /** ADD step 1 — buat pegawai, kembalikan pegawaiId. */
  onCreatePegawai: (data: PegawaiFormData) => Promise<string>;
  /** ADD step 2 — buat akun login tertaut pegawai, kembalikan userId. */
  onCreateUser: (pegawaiId: string, akun: AkunData) => Promise<string>;
  /** ADD step 3 — tetapkan peran + status. */
  onAssignRoles: (userId: string, roles: UserRole[], status: UserStatus) => Promise<void>;
  /** "Buatkan Akun" — provisioning akun utk pegawai yang sudah ada (wizard mulai Step 2). */
  provisionPegawai?: ExistingPegawaiSeed | null;
}

export default function PenggunaFormModal({
  open, initial, onClose, onSubmit, onCreatePegawai, onCreateUser, onAssignRoles, provisionPegawai,
}: PenggunaFormModalProps) {
  const shake = useAnimationControls();
  const reduceMotion = useReducedMotion();

  // Klik di luar modal → getarkan (bukan menutup). Reduced-motion: lewati getaran.
  const handleOutsideClick = () => {
    if (reduceMotion) return;
    shake.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.4, ease: "easeInOut" },
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop (visual) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          {/* Lapisan centering + penangkap klik luar */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleOutsideClick}
          >
            {/* Wrapper entrance/exit (opacity·scale·y) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[92vh] w-[min(94vw,880px)]"
            >
              {/* Box modal — layer shake (x) terpisah agar tak bentrok transform entrance */}
              <motion.div
                animate={shake}
                role="dialog"
                aria-modal="true"
                className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
              >
                {initial ? (
                  <PenggunaEditForm initial={initial} onClose={onClose} onSubmit={onSubmit} />
                ) : (
                  <PenggunaAddWizard
                    onClose={onClose}
                    onCreatePegawai={onCreatePegawai}
                    onCreateUser={onCreateUser}
                    onAssignRoles={onAssignRoles}
                    existingPegawai={provisionPegawai ?? undefined}
                  />
                )}
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
