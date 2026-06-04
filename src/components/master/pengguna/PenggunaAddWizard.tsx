"use client";

// Wizard "Tambah Pengguna Baru" — 3 step, TIAP step disimpan langsung (mock, siap-wiring):
//   Step 1 Data Pegawai → onCreatePegawai()  (≈ POST /api/v1/master/pegawai)
//   Step 2 Akun Login   → onCreateUser()     (≈ POST user, tertaut pegawaiId)
//   Step 3 Peran/Status → onAssignRoles()    (≈ POST role)
// Step yang sudah disimpan = committed (read-only di stepper); maju linear.

import { useState } from "react";
import {
  X, UserPlus, IdCard, KeyRound, ShieldCheck, ArrowRight, Check, Loader2,
  Eye, EyeOff, Stethoscope, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PegawaiFormData, type AkunData, type UserRole, type UserStatus, type StatusPegawai,
  namaTampilPegawai, UNIT_LIST,
} from "./penggunaShared";
import {
  ErrorText, IdentityCard, RoleGrid, StatusSelect, slugUsername, useBodyScrollLock,
  type IdentityView,
} from "./penggunaFormShared";
import { Field, FormSection, fieldCls } from "../ruangan/forms/OrganizationForm";
import { DatePicker, Select } from "@/components/shared/inputs";

interface PenggunaAddWizardProps {
  onClose: () => void;
  onCreatePegawai: (data: PegawaiFormData) => Promise<string>;
  onCreateUser: (pegawaiId: string, akun: AkunData) => Promise<string>;
  onAssignRoles: (userId: string, roles: UserRole[], status: UserStatus) => Promise<void>;
}

const STATUS_PEGAWAI: StatusPegawai[] = ["ASN", "Outsourcing", "Honorer", "Magang", "Mitra"];

// Agama besar dunia + "Lainnya" di akhir (master.Pegawai.agama = String?).
const AGAMA_OPTS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu", "Yahudi", "Lainnya"];

// Jenis tenaga (acuan SISDMK). Profesi = sumber kebenaran "Dokter / Perawat / dst.".
const PROFESI_OPTS = [
  "Dokter", "Dokter Gigi", "Dokter Spesialis", "Perawat", "Bidan",
  "Apoteker", "Tenaga Teknis Kefarmasian", "Ahli Teknologi Lab Medik",
  "Radiografer", "Nutrisionis", "Fisioterapis", "Tenaga Kesehatan Lainnya",
  "Administrator", "Non-Tenaga Kesehatan",
];
// Profesi yang = dokter → turunkan isDokter (tautan master Dokter / Practitioner FHIR).
const DOCTOR_PROFESI = new Set(["Dokter", "Dokter Gigi", "Dokter Spesialis"]);
const isDoctorProfesi = (p?: string): boolean => !!p && DOCTOR_PROFESI.has(p);

// Opsi Unit Kerja (dropdown) — selaras daftar unit sistem.
const UNIT_KERJA_OPTS = UNIT_LIST.map((u) => u.nama);

const STEPS = [
  { n: 1, label: "Data Pegawai", icon: IdCard },
  { n: 2, label: "Akun Login", icon: KeyRound },
  { n: 3, label: "Peran & Status", icon: ShieldCheck },
] as const;

export default function PenggunaAddWizard({
  onClose, onCreatePegawai, onCreateUser, onAssignRoles,
}: PenggunaAddWizardProps) {
  useBodyScrollLock();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1 — Pegawai
  const [peg, setPeg] = useState<PegawaiFormData>({
    nik: "", nip: "", namaLengkap: "", jenisKelamin: "L", statusPegawai: "ASN", isDokter: false,
  });
  // Step 2 — Akun
  const [akun, setAkun] = useState<AkunData>({ username: "", password: "", mustChangePassword: true });
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  // Step 3 — Peran
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [status, setStatus] = useState<UserStatus>("Aktif");
  // Committed ids
  const [pegawaiId, setPegawaiId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const updatePeg = <K extends keyof PegawaiFormData>(k: K, v: PegawaiFormData[K]) =>
    setPeg((p) => ({ ...p, [k]: v }));
  const clearError = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));

  // Profesi = sumber kebenaran; isDokter diturunkan (checkbox manual tak perlu lagi).
  const setProfesi = (v: string) => {
    setPeg((p) => ({ ...p, profesi: v, isDokter: isDoctorProfesi(v) }));
    clearError("profesi");
  };

  const identityView: IdentityView = {
    namaLengkap: peg.namaLengkap || "—",
    namaTampil: namaTampilPegawai(peg) || "—",
    nip: peg.nip,
    email: peg.email ?? "",
    unitKerja: peg.unitKerja || "—",
    statusPegawai: peg.statusPegawai,
    isDokter: peg.isDokter,
  };

  // ── Validasi per step ──
  function validateStep1(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!/^\d{16}$/.test(peg.nik)) e.nik = "NIK harus 16 digit.";
    if (!peg.nip.trim()) e.nip = "NIP wajib diisi.";
    if (!peg.namaLengkap.trim()) e.namaLengkap = "Nama lengkap wajib diisi.";
    if (!peg.profesi) e.profesi = "Pilih jenis profesi.";
    if (peg.tanggalLahir && new Date(`${peg.tanggalLahir}T00:00:00`) > new Date()) {
      e.tanggalLahir = "Tidak boleh di masa depan.";
    }
    return e;
  }
  function validateStep2(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!akun.username.trim()) e.username = "Username wajib diisi.";
    else if (!/^[a-z0-9.]+$/.test(akun.username)) e.username = "Hanya huruf kecil, angka, titik.";
    if (akun.password.length < 8) e.password = "Minimal 8 karakter.";
    else if (confirm !== akun.password) e.confirm = "Konfirmasi password tidak cocok.";
    return e;
  }

  // ── Simpan per step (mock async — tinggal swap ke fetch) ──
  async function saveStep1() {
    const e = validateStep1();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const id = await onCreatePegawai(peg);
      setPegawaiId(id);
      setAkun((a) => ({ ...a, username: a.username || slugUsername(peg.namaLengkap) }));
      setStep(2);
    } finally {
      setSaving(false);
    }
  }
  async function saveStep2() {
    if (!pegawaiId) return;
    const e = validateStep2();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const id = await onCreateUser(pegawaiId, akun);
      setUserId(id);
      setStep(3);
    } finally {
      setSaving(false);
    }
  }
  async function saveStep3() {
    if (!userId) return;
    if (roles.length === 0) {
      setErrors({ roles: "Pilih minimal 1 peran." });
      return;
    }
    setSaving(true);
    try {
      await onAssignRoles(userId, roles, status);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const doneFlags = { 1: pegawaiId !== null, 2: userId !== null, 3: false };

  return (
    <>
      {/* Header + stepper */}
      <div className="shrink-0 border-b border-slate-100 px-6 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 ring-2 ring-teal-100">
              <UserPlus size={18} className="text-teal-600" />
            </span>
            <div>
              <p className="text-[15px] font-bold text-slate-900">Tambah Pengguna Baru</p>
              <p className="text-[11px] text-slate-500">
                Buat data pegawai, akun login, lalu tetapkan peran — disimpan bertahap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-2 text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="mt-4 flex items-center">
          {STEPS.map((s, i) => {
            const done = doneFlags[s.n];
            const current = step === s.n;
            return (
              <div key={s.n} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition",
                      done
                        ? "bg-emerald-500 text-white"
                        : current
                          ? "bg-teal-600 text-white ring-4 ring-teal-100"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {done ? <Check size={13} /> : s.n}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold transition",
                      current ? "text-slate-900" : done ? "text-emerald-600" : "text-slate-400",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className={cn("mx-2 h-px flex-1 transition", done ? "bg-emerald-300" : "bg-slate-200")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {step === 1 && (
          <Step1Pegawai peg={peg} update={updatePeg} setProfesi={setProfesi} errors={errors} clearError={clearError} />
        )}
        {step === 2 && (
          <Step2Akun
            identity={identityView}
            akun={akun}
            setAkun={setAkun}
            confirm={confirm}
            setConfirm={setConfirm}
            showPw={showPw}
            setShowPw={setShowPw}
            errors={errors}
            clearError={clearError}
          />
        )}
        {step === 3 && (
          <Step3Peran
            identity={identityView}
            username={akun.username}
            roles={roles}
            onToggleRole={(r) => {
              setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
              clearError("roles");
            }}
            status={status}
            setStatus={setStatus}
            error={errors.roles}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
        <p className="hidden text-[10px] text-slate-400 sm:block">
          Langkah {step} dari 3 · tiap langkah tersimpan otomatis
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            {pegawaiId ? "Tutup" : "Batal"}
          </button>
          <button
            type="button"
            onClick={step === 1 ? saveStep1 : step === 2 ? saveStep2 : saveStep3}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm outline-none transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            {saving ? (
              <><Loader2 size={13} className="animate-spin" /> Menyimpan…</>
            ) : step === 3 ? (
              <><Check size={13} /> Simpan & Selesai</>
            ) : (
              <>Simpan & Lanjut <ArrowRight size={13} /></>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Step 1: Data Pegawai ──────────────────────────────────────────────────────
function Step1Pegawai({
  peg, update, setProfesi, errors, clearError,
}: {
  peg: PegawaiFormData;
  update: <K extends keyof PegawaiFormData>(k: K, v: PegawaiFormData[K]) => void;
  setProfesi: (v: string) => void;
  errors: Record<string, string>;
  clearError: (k: string) => void;
}) {
  const errCls = "border-rose-300 focus:border-rose-400 focus:ring-rose-100";
  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Identitas" icon={<IdCard size={11} />}>
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="NIK" required hint="16 digit sesuai KTP">
              <input
                inputMode="numeric"
                value={peg.nik}
                onChange={(e) => { update("nik", e.target.value.replace(/\D/g, "").slice(0, 16)); clearError("nik"); }}
                className={cn(fieldCls, "font-mono", errors.nik && errCls)}
                placeholder="3201xxxxxxxxxxxx"
              />
              {errors.nik && <ErrorText msg={errors.nik} />}
            </Field>
            <Field label="NIP" required hint="Nomor induk pegawai">
              <input
                value={peg.nip}
                onChange={(e) => { update("nip", e.target.value); clearError("nip"); }}
                className={cn(fieldCls, "font-mono", errors.nip && errCls)}
                placeholder="1980xxxxxxxxxxxxxx"
              />
              {errors.nip && <ErrorText msg={errors.nip} />}
            </Field>
          </div>

          <Field label="Nama Lengkap" required>
            <input
              value={peg.namaLengkap}
              onChange={(e) => { update("namaLengkap", e.target.value); clearError("namaLengkap"); }}
              className={cn(fieldCls, errors.namaLengkap && errCls)}
              placeholder="Budi Santoso"
            />
            {errors.namaLengkap && <ErrorText msg={errors.namaLengkap} />}
          </Field>

          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Gelar Depan" hint="Mis. dr., Ns.">
              <input
                value={peg.gelarDepan ?? ""}
                onChange={(e) => update("gelarDepan", e.target.value)}
                className={fieldCls}
                placeholder="dr."
              />
            </Field>
            <Field label="Gelar Belakang" hint="Mis. Sp.JP, S.Kep">
              <input
                value={peg.gelarBelakang ?? ""}
                onChange={(e) => update("gelarBelakang", e.target.value)}
                className={fieldCls}
                placeholder="Sp.JP"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Jenis Kelamin" required>
              <div className="grid grid-cols-2 gap-1.5">
                {(["L", "P"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update("jenisKelamin", g)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-[11px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-teal-300",
                      peg.jenisKelamin === g
                        ? "border-teal-300 bg-teal-50 text-teal-700 ring-1 ring-teal-200"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    {g === "L" ? "Laki-laki" : "Perempuan"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Agama">
              <Select
                value={peg.agama ?? ""}
                onChange={(v) => update("agama", v)}
                options={AGAMA_OPTS}
                placeholder="Pilih agama"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Tempat Lahir">
              <input
                value={peg.tempatLahir ?? ""}
                onChange={(e) => update("tempatLahir", e.target.value)}
                className={fieldCls}
                placeholder="Jakarta"
              />
            </Field>
            <Field label="Tanggal Lahir">
              <DatePicker
                value={peg.tanggalLahir ?? ""}
                onChange={(v) => { update("tanggalLahir", v); clearError("tanggalLahir"); }}
              />
              {errors.tanggalLahir && <ErrorText msg={errors.tanggalLahir} />}
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection title="Kepegawaian" icon={<ShieldCheck size={11} />}>
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Field label="Jenis Profesi" required>
              <Select
                value={peg.profesi ?? ""}
                onChange={setProfesi}
                options={PROFESI_OPTS}
                icon={Stethoscope}
                placeholder="Pilih profesi"
              />
              {errors.profesi
                ? <ErrorText msg={errors.profesi} />
                : isDoctorProfesi(peg.profesi) && (
                    <span className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-teal-600">
                      <Stethoscope size={10} /> Otomatis tertaut sebagai Practitioner (Dokter)
                    </span>
                  )}
            </Field>
            <Field label="Status Pegawai" required>
              <Select
                value={peg.statusPegawai}
                onChange={(v) => update("statusPegawai", v as StatusPegawai)}
                options={STATUS_PEGAWAI}
              />
            </Field>
            <Field label="Unit Kerja">
              <Select
                value={peg.unitKerja ?? ""}
                onChange={(v) => update("unitKerja", v)}
                options={UNIT_KERJA_OPTS}
                placeholder="Pilih unit"
              />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection title="Kontak (opsional)" icon={<IdCard size={11} />}>
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="No. HP">
              <input
                value={peg.noHp ?? ""}
                onChange={(e) => update("noHp", e.target.value)}
                className={fieldCls}
                placeholder="0812-0000-0000"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={peg.email ?? ""}
                onChange={(e) => update("email", e.target.value)}
                className={fieldCls}
                placeholder="nama@rsharapansehat.id"
              />
            </Field>
          </div>
          <Field label="Alamat">
            <input
              value={peg.alamat ?? ""}
              onChange={(e) => update("alamat", e.target.value)}
              className={fieldCls}
              placeholder="Jl. Mawar No. 1, Jakarta"
            />
          </Field>
        </div>
      </FormSection>
    </div>
  );
}

// ── Step 2: Akun Login ────────────────────────────────────────────────────────
function Step2Akun({
  identity, akun, setAkun, confirm, setConfirm, showPw, setShowPw, errors, clearError,
}: {
  identity: IdentityView;
  akun: AkunData;
  setAkun: React.Dispatch<React.SetStateAction<AkunData>>;
  confirm: string;
  setConfirm: (v: string) => void;
  showPw: boolean;
  setShowPw: React.Dispatch<React.SetStateAction<boolean>>;
  errors: Record<string, string>;
  clearError: (k: string) => void;
}) {
  const errCls = "border-rose-300 focus:border-rose-400 focus:ring-rose-100";
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pegawai tersimpan</p>
        <IdentityCard view={identity} tone="slate" />
      </div>

      <FormSection title="Kredensial Akun" icon={<KeyRound size={11} />}>
        <div className="flex flex-col gap-3.5">
          <Field label="Username" required hint="Dipakai untuk login — huruf kecil, angka, titik">
            <input
              value={akun.username}
              onChange={(e) => { setAkun((a) => ({ ...a, username: e.target.value.toLowerCase().replace(/\s+/g, ".") })); clearError("username"); }}
              className={cn(fieldCls, "font-mono", errors.username && errCls)}
              placeholder="budi.santoso"
              autoComplete="off"
            />
            {errors.username && <ErrorText msg={errors.username} />}
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Password" required hint="Minimal 8 karakter">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={akun.password}
                  onChange={(e) => { setAkun((a) => ({ ...a, password: e.target.value })); clearError("password"); }}
                  autoComplete="new-password"
                  className={cn(fieldCls, "pr-9 font-mono", errors.password && errCls)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 outline-none transition hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.password && <ErrorText msg={errors.password} />}
            </Field>

            <Field label="Konfirmasi Password" required>
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); clearError("confirm"); }}
                autoComplete="new-password"
                className={cn(fieldCls, "font-mono", errors.confirm && errCls)}
                placeholder="••••••••"
              />
              {errors.confirm
                ? <ErrorText msg={errors.confirm} />
                : confirm.length > 0 && confirm === akun.password && (
                    <span className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                      <Check size={10} /> Password cocok
                    </span>
                  )}
            </Field>
          </div>

          <button
            type="button"
            onClick={() => setAkun((a) => ({ ...a, mustChangePassword: !a.mustChangePassword }))}
            className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-left outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                akun.mustChangePassword ? "border-teal-600 bg-teal-600" : "border-slate-300 bg-white",
              )}
            >
              {akun.mustChangePassword && <Check size={11} className="text-white" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-slate-700">
                Wajib ganti password saat login pertama
              </span>
              <span className="block text-[10px] text-slate-500">
                Pengguna membuat password baru sendiri (disarankan).
              </span>
            </span>
          </button>
        </div>
      </FormSection>
    </div>
  );
}

// ── Step 3: Peran & Status ────────────────────────────────────────────────────
function Step3Peran({
  identity, username, roles, onToggleRole, status, setStatus, error,
}: {
  identity: IdentityView;
  username: string;
  roles: UserRole[];
  onToggleRole: (r: UserRole) => void;
  status: UserStatus;
  setStatus: (v: UserStatus) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Akun tersimpan</p>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
          <IdentityCardCompact identity={identity} />
          <span className="shrink-0 rounded-md bg-white px-2 py-1 font-mono text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
            @{username}
          </span>
        </div>
      </div>

      <FormSection title="Peran / Role" icon={<ShieldCheck size={11} />}>
        <Field label="Pilih Peran" required hint="Boleh lebih dari satu — hak akses = gabungan semua peran">
          <RoleGrid roles={roles} onToggle={onToggleRole} />
          {error
            ? <span className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-rose-600"><AlertCircle size={10} /> {error}</span>
            : roles.length > 0 && <span className="mt-1 text-[9px] text-slate-400">{roles.length} peran dipilih</span>}
        </Field>

        <div className="mt-3.5">
          <Field label="Status Akun">
            <StatusSelect value={status} onChange={setStatus} className="max-w-sm" />
          </Field>
        </div>
      </FormSection>
    </div>
  );
}

function IdentityCardCompact({ identity }: { identity: IdentityView }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <p className="truncate text-[12px] font-bold text-slate-800">{identity.namaTampil}</p>
      {identity.isDokter && <Stethoscope size={11} className="shrink-0 text-teal-500" />}
    </div>
  );
}
